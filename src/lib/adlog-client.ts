/**
 * 애드로그(adlog.kr) 서버사이드 클라이언트
 *
 * 그누보드5 기반 사이트에 로그인 후 대시보드 데이터를 파싱합니다.
 * 서버 사이드에서만 사용하세요 (API route 전용).
 */

const BASE = "https://adlog.kr";
const LOGIN_URL = `${BASE}/bbs/login_check.php`;
const DASHBOARD_URL = `${BASE}/adlog/`;

/* ─── Types ─── */

export interface AdlogCredentials {
  mb_id: string;
  mb_password: string;
}

export interface AdlogCampaign {
  id: string;
  platform: string;       // naver, kakao, google, meta 등
  name: string;
  status: string;         // active, paused, completed
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  startDate: string | null;
  endDate: string | null;
}

export interface AdlogDashboard {
  connected: boolean;
  accountName: string | null;
  platforms: {
    key: string;
    label: string;
    connected: boolean;
  }[];
  summary: {
    totalSpent: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    avgCTR: number;
    avgCPC: number;
    avgROAS: number;
  };
  campaigns: AdlogCampaign[];
  raw?: string; // 디버깅용 원본 HTML (개발 모드만)
}

/* ─── Session Manager ─── */

// 메모리 기반 세션 캐시 (서버리스 환경에서는 요청마다 재로그인)
const sessionCache = new Map<string, { cookies: string; expiresAt: number }>();

/**
 * 애드로그 로그인 후 세션 쿠키를 반환합니다.
 */
export async function adlogLogin(creds: AdlogCredentials): Promise<{ cookies: string; ok: boolean; error?: string }> {
  const cacheKey = creds.mb_id;
  const cached = sessionCache.get(cacheKey);

  // 캐시된 세션이 유효하면 재사용 (5분)
  if (cached && cached.expiresAt > Date.now()) {
    return { cookies: cached.cookies, ok: true };
  }

  try {
    const formData = new URLSearchParams();
    formData.append("mb_id", creds.mb_id);
    formData.append("mb_password", creds.mb_password);
    formData.append("url", DASHBOARD_URL);

    const res = await fetch(LOGIN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": `${BASE}/adlog/`,
        "Origin": BASE,
      },
      body: formData.toString(),
      redirect: "manual",
    });

    // 그누보드5는 로그인 성공 시 302 리다이렉트 + Set-Cookie
    const setCookies = res.headers.getSetCookie?.() || [];
    const cookieString = setCookies
      .map((c) => c.split(";")[0])
      .filter(Boolean)
      .join("; ");

    if (!cookieString) {
      // 로그인 실패 - 응답 바디 확인
      const html = await res.text();
      if (html.includes("비밀번호") || html.includes("아이디")) {
        return { cookies: "", ok: false, error: "아이디 또는 비밀번호가 올바르지 않습니다." };
      }
      return { cookies: "", ok: false, error: "로그인에 실패했습니다. 애드로그 사이트를 확인해주세요." };
    }

    // 세션 캐시 저장 (5분)
    sessionCache.set(cacheKey, {
      cookies: cookieString,
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return { cookies: cookieString, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "네트워크 오류";
    return { cookies: "", ok: false, error: `애드로그 연결 실패: ${msg}` };
  }
}

/**
 * 로그인된 세션으로 애드로그 페이지를 가져옵니다.
 */
export async function adlogFetch(cookies: string, path: string): Promise<string> {
  const url = path.startsWith("http") ? path : `${BASE}${path}`;
  const res = await fetch(url, {
    headers: {
      Cookie: cookies,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Referer: DASHBOARD_URL,
    },
  });
  return res.text();
}

/**
 * 애드로그 대시보드 HTML을 파싱하여 구조화된 데이터로 변환합니다.
 */
export function parseAdlogDashboard(html: string): Omit<AdlogDashboard, "connected"> {
  const campaigns: AdlogCampaign[] = [];

  // 테이블 행 파싱 (애드로그 대시보드의 캠페인 테이블)
  // <tr> 태그 내의 데이터를 추출
  const tableRowRegex = /<tr[^>]*class="[^"]*campaign[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<td[^>]*>([\s\S]*?)<\/td>/gi;

  let rowMatch;
  let rowIdx = 0;
  while ((rowMatch = tableRowRegex.exec(html)) !== null) {
    const cells: string[] = [];
    let cellMatch;
    while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, "").trim());
    }
    if (cells.length >= 5) {
      campaigns.push({
        id: `adlog-${rowIdx++}`,
        platform: detectPlatform(cells[0] || ""),
        name: cells[1] || `캠페인 ${rowIdx}`,
        status: parseStatus(cells[2] || ""),
        budget: parseKrNumber(cells[3] || "0"),
        spent: parseKrNumber(cells[4] || "0"),
        impressions: parseKrNumber(cells[5] || "0"),
        clicks: parseKrNumber(cells[6] || "0"),
        conversions: parseKrNumber(cells[7] || "0"),
        ctr: parseFloat(cells[8] || "0") || 0,
        cpc: parseKrNumber(cells[9] || "0"),
        roas: parseFloat(cells[10] || "0") || 0,
        startDate: null,
        endDate: null,
      });
    }
  }

  // 요약 숫자 파싱 (대시보드 상단 카드)
  const summaryNumbers = extractSummaryNumbers(html);

  // 연결된 매체 감지
  const platforms = [
    { key: "naver", label: "네이버", connected: /네이버|naver/i.test(html) },
    { key: "kakao", label: "카카오", connected: /카카오|kakao/i.test(html) },
    { key: "google", label: "구글", connected: /구글|google/i.test(html) },
    { key: "meta", label: "메타", connected: /메타|meta|facebook|instagram/i.test(html) },
  ];

  // 계정명 추출
  const accountMatch = html.match(/class="[^"]*user[^"]*name[^"]*"[^>]*>([^<]+)/i)
    || html.match(/class="[^"]*nick[^"]*"[^>]*>([^<]+)/i);
  const accountName = accountMatch ? accountMatch[1].trim() : null;

  const totalSpent = summaryNumbers.spent || campaigns.reduce((s, c) => s + c.spent, 0);
  const totalImpressions = summaryNumbers.impressions || campaigns.reduce((s, c) => s + c.impressions, 0);
  const totalClicks = summaryNumbers.clicks || campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalConversions = summaryNumbers.conversions || campaigns.reduce((s, c) => s + c.conversions, 0);

  return {
    accountName,
    platforms,
    summary: {
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      avgCTR: totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0,
      avgCPC: totalClicks > 0 ? totalSpent / totalClicks : 0,
      avgROAS: summaryNumbers.roas || 0,
    },
    campaigns,
  };
}

/**
 * 전체 플로우: 로그인 → 대시보드 fetch → 파싱 → 반환
 */
export async function fetchAdlogDashboard(creds: AdlogCredentials): Promise<AdlogDashboard> {
  const login = await adlogLogin(creds);
  if (!login.ok) {
    return {
      connected: false,
      accountName: null,
      platforms: [],
      summary: { totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, avgCTR: 0, avgCPC: 0, avgROAS: 0 },
      campaigns: [],
    };
  }

  const html = await adlogFetch(login.cookies, "/adlog/");

  // 로그인 페이지로 리다이렉트됐는지 확인
  if (html.includes("login_check") || html.includes("로그인")) {
    sessionCache.delete(creds.mb_id);
    return {
      connected: false,
      accountName: null,
      platforms: [],
      summary: { totalSpent: 0, totalImpressions: 0, totalClicks: 0, totalConversions: 0, avgCTR: 0, avgCPC: 0, avgROAS: 0 },
      campaigns: [],
    };
  }

  const data = parseAdlogDashboard(html);
  return {
    connected: true,
    ...data,
    ...(process.env.NODE_ENV === "development" ? { raw: html.slice(0, 5000) } : {}),
  };
}

/* ─── Place Rank Score Types ─── */

export interface PlaceRankEntry {
  date: string;
  rank: number | null;
  n1: number | null;
  n2: number | null;
  n3: number | null;
  saves: string;
  blogReviews: string;
  visitorReviews: string;
}

export interface PlaceRankItem {
  keyword: string;
  placeUrl: string;
  placeName: string;
  placeId: string;
  monthlySearch: number;
  businessCount: number;
  representativeKeywords: string[];
  registeredDate: string;
  ranks: PlaceRankEntry[];
  lastCheckedAt: string;
}

/**
 * 플레이스 히든 지수 페이지를 파싱하여 N1/N2/N3 포함된 순위 데이터를 반환합니다.
 * URL: /adlog/naver_place_rank_score.php
 */
export function parseAdlogScorePage(html: string): PlaceRankItem[] {
  const items: PlaceRankItem[] = [];

  // 각 키워드 행은 api_rows_XXXXX 클래스로 묶여 있음 (2개의 <tr>)
  const apiRowIds = [...new Set((html.match(/api_rows_(\d+)/g) || []).map((m) => m.replace("api_rows_", "")))];

  for (const apiNo of apiRowIds) {
    const rowRegex = new RegExp(`<tr[^>]*class="[^"]*api_rows_${apiNo}[^"]*"[^>]*>([\\s\\S]*?)<\\/tr>`, "gi");
    const rows: string[] = [];
    let m;
    while ((m = rowRegex.exec(html)) !== null) {
      rows.push(m[1]);
    }
    if (rows.length < 2) continue;

    const row1 = rows[0]; // 키워드, URL, 업체명, 월검색량, 등록일
    const row2 = rows[1]; // 순위 데이터 (stat_div들)

    // 키워드 추출
    const keywordMatch = row1.match(/<td[^>]*align="left"[^>]*><a[^>]*>([^<]+)<\/a>/);
    const keyword = keywordMatch ? keywordMatch[1].trim() : "";

    // 플레이스 URL + 업체명 + placeId
    const placeIdMatch = row1.match(/place\/(\d+)/);
    const placeId = placeIdMatch ? placeIdMatch[1] : "";
    const placeNameMatch = row1.match(/class="fc_blu">([^<]+)<\/a>/);
    const placeName = placeNameMatch ? placeNameMatch[1].trim() : "";
    const placeUrl = placeId ? `https://m.place.naver.com/place/${placeId}` : "";

    // 월 검색량, 업체수
    const monthlyMatch = row1.match(/월\s*([\d,]+)건/);
    const monthlySearch = monthlyMatch ? parseInt(monthlyMatch[1].replace(/,/g, ""), 10) : 0;
    const businessMatch = row1.match(/업체\s*([\d,]+)개/);
    const businessCount = businessMatch ? parseInt(businessMatch[1].replace(/,/g, ""), 10) : 0;

    // 대표키워드
    const repKeyMatch = row1.match(/\[\s*([^\]]+)\s*\]/);
    const representativeKeywords = repKeyMatch
      ? repKeyMatch[1].split(/[,，]/).map((k) => k.trim()).filter(Boolean)
      : [];

    // 등록일
    const regDateMatch = row1.match(/(\d{4}-\d{2}-\d{2})/);
    const registeredDate = regDateMatch ? regDateMatch[1] : "";

    // 순위 데이터 파싱 (stat_div들)
    const ranks: PlaceRankEntry[] = [];
    const statDivRegex = /stat_date="([^"]+)"[^>]*stat_total_rank="([^"]*)"[^>]*>([\s\S]*?)<\/div>/gi;
    let statMatch;
    while ((statMatch = statDivRegex.exec(row2)) !== null) {
      const date = statMatch[1];
      const rankStr = statMatch[2];
      const content = statMatch[3];

      const rank = rankStr ? parseInt(rankStr, 10) : null;

      // N1/N2/N3 추출
      const n1Match = content.match(/N1\s*([\d.]+)/);
      const n2Match = content.match(/N2\s*([\d.]+)/);
      const n3Match = content.match(/N3\s*([\d.]+)/);

      // 저장수, 블로그리뷰, 방문자리뷰
      const savesMatch = content.match(/fc_grn">([^<]+)</);
      const blogMatch = content.match(/블\s*([\d,]+)개/);
      const visitorMatch = content.match(/방\s*([\d,]+)개/);

      ranks.push({
        date,
        rank: isNaN(rank as number) ? null : rank,
        n1: n1Match ? parseFloat(n1Match[1]) : null,
        n2: n2Match ? parseFloat(n2Match[1]) : null,
        n3: n3Match ? parseFloat(n3Match[1]) : null,
        saves: savesMatch ? savesMatch[1].trim() : "",
        blogReviews: blogMatch ? `${blogMatch[1]}개` : "",
        visitorReviews: visitorMatch ? visitorMatch[1] : "",
      });
    }

    // 마지막 체크 시간
    const checkTimeMatch = rows.length > 1 ? rows[1].match(/(\d{4}-\d{2}-\d{2})\s*<br>\s*(\d{2}:\d{2}:\d{2})/) : null;
    const lastCheckedAt = checkTimeMatch ? `${checkTimeMatch[1]} ${checkTimeMatch[2]}` : "";

    if (keyword) {
      items.push({
        keyword,
        placeUrl,
        placeName,
        placeId,
        monthlySearch,
        businessCount,
        representativeKeywords,
        registeredDate,
        ranks,
        lastCheckedAt,
      });
    }
  }

  return items;
}

/**
 * 플레이스 히든 지수 페이지를 가져와 파싱합니다.
 */
export async function fetchAdlogPlaceScores(creds: AdlogCredentials): Promise<PlaceRankItem[]> {
  const login = await adlogLogin(creds);
  if (!login.ok) return [];

  const html = await adlogFetch(login.cookies, "/adlog/naver_place_rank_score.php");
  if (html.includes("login_check") && !html.includes("naver_place_rank_score")) {
    sessionCache.delete(creds.mb_id);
    return [];
  }

  return parseAdlogScorePage(html);
}

/* ─── Helpers ─── */

function parseKrNumber(str: string): number {
  // "1,234,567" → 1234567, "150만" → 1500000
  const cleaned = str.replace(/[^\d.만억천]/g, "");
  if (cleaned.includes("억")) {
    return parseFloat(cleaned.replace("억", "")) * 100000000;
  }
  if (cleaned.includes("만")) {
    return parseFloat(cleaned.replace("만", "")) * 10000;
  }
  if (cleaned.includes("천")) {
    return parseFloat(cleaned.replace("천", "")) * 1000;
  }
  return parseInt(cleaned.replace(/\D/g, ""), 10) || 0;
}

function detectPlatform(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("네이버") || t.includes("naver")) return "naver";
  if (t.includes("카카오") || t.includes("kakao")) return "kakao";
  if (t.includes("구글") || t.includes("google")) return "google";
  if (t.includes("메타") || t.includes("meta") || t.includes("facebook") || t.includes("인스타")) return "meta";
  return "etc";
}

function parseStatus(text: string): string {
  const t = text.toLowerCase();
  if (t.includes("집행") || t.includes("active") || t.includes("진행")) return "active";
  if (t.includes("중지") || t.includes("pause")) return "paused";
  if (t.includes("종료") || t.includes("완료") || t.includes("complete")) return "completed";
  return "draft";
}

function extractSummaryNumbers(html: string): {
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  roas: number;
} {
  // 대시보드 상단 KPI 카드에서 숫자를 추출
  const result = { spent: 0, impressions: 0, clicks: 0, conversions: 0, roas: 0 };

  // 광고비/지출 관련
  const spentMatch = html.match(/(?:광고비|총\s*지출|소진)[^<]*?<[^>]*>([^<]+)/i);
  if (spentMatch) result.spent = parseKrNumber(spentMatch[1]);

  // 노출
  const impMatch = html.match(/(?:노출|impression)[^<]*?<[^>]*>([^<]+)/i);
  if (impMatch) result.impressions = parseKrNumber(impMatch[1]);

  // 클릭
  const clickMatch = html.match(/(?:클릭|click)[^<]*?<[^>]*>([^<]+)/i);
  if (clickMatch) result.clicks = parseKrNumber(clickMatch[1]);

  // 전환
  const convMatch = html.match(/(?:전환|conversion)[^<]*?<[^>]*>([^<]+)/i);
  if (convMatch) result.conversions = parseKrNumber(convMatch[1]);

  // ROAS
  const roasMatch = html.match(/(?:ROAS|roas)[^<]*?<[^>]*>([^<]+)/i);
  if (roasMatch) result.roas = parseFloat(roasMatch[1].replace(/[^0-9.]/g, "")) || 0;

  return result;
}

import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as cheerio from "cheerio";

const ADLOG_BASE = "https://adlog.kr";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

/* ─── Types ─── */

export interface RankEntry {
  date: string;
  rank: number | null;
  saves: string;
  blogReviews: string;
  visitorReviews: string;
  n1: number | null;
  n2: number | null;
  n3: number | null;
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
  ranks: RankEntry[];
  lastCheckedAt: string;
}

export interface BidItem {
  keyword: string;
  pcSearch: number;
  moSearch: number;
  totalSearch: number;
  pcClicks: number;
  moClicks: number;
  pcCtr: string;
  moCtr: string;
  competition: string;
  avgAds: string;
  pcBids: string[];
  moBids: string[];
  checkedDate: string;
}

export interface AccountInfo {
  expirationDate: string;
  totalSlots: number;
  usedSlots: number;
  paidSlots: number;
  freeSlots: number;
}

export interface AdlogSyncData {
  account: AccountInfo;
  placeRanks: PlaceRankItem[];
  bidAnalysis: BidItem[];
  syncedAt: string;
}

/* ─── API Route ─── */

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [channel] = await db
      .select()
      .from(marketingChannels)
      .where(eq(marketingChannels.channel, "adlog"));

    if (!channel || !channel.isActive) {
      return NextResponse.json(
        { error: "애드로그 계정이 연결되지 않았습니다." },
        { status: 401 },
      );
    }

    const settings = channel.settings as {
      adlogId?: string;
      adlogPassword?: string;
    } | null;

    if (!settings?.adlogId || !settings?.adlogPassword) {
      return NextResponse.json(
        { error: "애드로그 계정 정보가 없습니다." },
        { status: 401 },
      );
    }

    // 로그인 → 쿠키 획득
    const cookies = await adlogLogin(settings.adlogId, settings.adlogPassword);
    if (!cookies) {
      return NextResponse.json({ error: "애드로그 로그인 실패" }, { status: 401 });
    }

    // 3개 페이지 병렬 스크래핑
    const [mainHtml, placeHtml, bidHtml] = await Promise.all([
      fetchPage(`${ADLOG_BASE}/adlog/`, cookies),
      fetchPage(
        `${ADLOG_BASE}/adlog/naver_place_rank_score.php?sfl=user_id&stx=${encodeURIComponent(settings.adlogId)}`,
        cookies,
      ),
      fetchPage(
        `${ADLOG_BASE}/adlog/naver_keyword_bid.php?sfl=user_id&stx=${encodeURIComponent(settings.adlogId)}`,
        cookies,
      ),
    ]);

    const account = parseAccountInfo(mainHtml);
    const placeRanks = parsePlaceRanks(placeHtml);
    const bidAnalysis = parseBidAnalysis(bidHtml);

    const syncData: AdlogSyncData = {
      account,
      placeRanks,
      bidAnalysis,
      syncedAt: new Date().toISOString(),
    };

    // 마지막 동기화 시간 업데이트
    await db
      .update(marketingChannels)
      .set({
        settings: { ...settings, lastSyncAt: syncData.syncedAt },
        updatedAt: new Date(),
      })
      .where(eq(marketingChannels.id, channel.id));

    return NextResponse.json(syncData);
  } catch (error) {
    const msg = error instanceof Error ? error.message : "동기화 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/* ─── 로그인 ─── */

async function adlogLogin(id: string, pw: string): Promise<string | null> {
  try {
    const res = await fetch(`${ADLOG_BASE}/bbs/login_check.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        Referer: `${ADLOG_BASE}/adlog/`,
      },
      body: new URLSearchParams({ mb_id: id, mb_password: pw, url: "/adlog/" }),
      redirect: "manual",
    });

    // 쿠키 수집 (getSetCookie is Node 18+)
    const setCookies =
      typeof res.headers.getSetCookie === "function"
        ? res.headers.getSetCookie()
        : (res.headers.get("set-cookie") || "").split(/,(?=[^ ])/);

    const cookieParts: string[] = [];
    for (const c of setCookies) {
      const m = c.match(/^([^=]+=[^;]+)/);
      if (m) cookieParts.push(m[1].trim());
    }

    return cookieParts.length > 0 ? cookieParts.join("; ") : null;
  } catch {
    return null;
  }
}

/* ─── 페이지 fetch ─── */

async function fetchPage(url: string, cookies: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Cookie: cookies, "User-Agent": UA },
  });
  return res.text();
}

/* ─── 메인 대시보드 파싱 (계정 정보) ─── */

function parseAccountInfo(html: string): AccountInfo {
  const info: AccountInfo = {
    expirationDate: "",
    totalSlots: 0,
    usedSlots: 0,
    paidSlots: 0,
    freeSlots: 0,
  };

  try {
    const expMatch = html.match(/사용기간[\s\S]*?(\d{2,4}년\s*\d{1,2}월\s*\d{1,2}일)/);
    if (expMatch) info.expirationDate = expMatch[1].trim();

    const totalMatch = html.match(/총\s*슬롯수[\s\S]*?(\d+)개/);
    if (totalMatch) info.totalSlots = parseInt(totalMatch[1]);

    const usedMatch = html.match(/총\s*사용\s*슬롯수[\s\S]*?(\d+)개/);
    if (usedMatch) info.usedSlots = parseInt(usedMatch[1]);

    const paidMatch = html.match(/유료\s*사용\s*슬롯수[\s\S]*?(\d+)개/);
    if (paidMatch) info.paidSlots = parseInt(paidMatch[1]);

    const freeMatch = html.match(/무료\s*사용\s*슬롯수[\s\S]*?(\d+)개/);
    if (freeMatch) info.freeSlots = parseInt(freeMatch[1]);
  } catch {
    /* ignore */
  }

  return info;
}

/* ─── 플레이스 히든 지수 파싱 (naver_place_rank_score.php) ─── */

function parsePlaceRanks(html: string): PlaceRankItem[] {
  const items: PlaceRankItem[] = [];

  try {
    const $ = cheerio.load(html);
    const table = $("table").first();
    const rows = table.find("tr");

    // score 페이지: 6 tds (번호, 키워드, URL, 검색량, 등록일, 관리)
    // rank_check 페이지: 7 tds (번호, 그룹, 키워드, URL, 검색량, 등록일, 관리)
    // 첫 데이터 행의 td 개수로 오프셋 결정
    let colOffset = 0;
    for (let i = 0; i < rows.length; i++) {
      const cls = $(rows[i]).attr("class") || "";
      if (cls.match(/^api_rows_\d+$/)) {
        const tdCount = $(rows[i]).find("td").length;
        colOffset = tdCount >= 7 ? 1 : 0; // 7개면 그룹 칼럼 있음
        break;
      }
    }

    for (let i = 0; i < rows.length; i++) {
      const row = $(rows[i]);
      const cls = row.attr("class") || "";
      if (!cls.match(/^api_rows_\d+$/)) continue;

      const tds = row.find("td");
      if (tds.length < 6) continue;

      // 키워드 (score: td[1], rank_check: td[2])
      const keyword = $(tds[1 + colOffset])
        .text()
        .trim()
        .replace(/\s*ⓜ\s*/g, "")
        .replace(/\s*ⓟ\s*/g, "")
        .trim();

      // 플레이스 URL & 업체명
      const placeText = $(tds[2 + colOffset]).text().trim();
      const urlMatch = placeText.match(/https:\/\/[^\s]+place\/(\d+)/);
      const placeUrl = urlMatch ? urlMatch[0].split("\n")[0].trim() : "";
      const placeId = urlMatch ? urlMatch[1] : "";
      const nameMatch = placeText.match(/\n\s*([^(\n]+)\((\d+)\)/);
      const placeName = nameMatch ? nameMatch[1].trim() : "";

      // 월 검색량 & 업체수
      const infoText = $(tds[3 + colOffset]).text().trim();
      const searchMatch = infoText.match(/월\s*([\d,]+)건/);
      const bizMatch = infoText.match(/업체\s*([\d,]+)개/);
      const monthlySearch = searchMatch
        ? parseInt(searchMatch[1].replace(/,/g, ""))
        : 0;
      const businessCount = bizMatch
        ? parseInt(bizMatch[1].replace(/,/g, ""))
        : 0;

      // 대표키워드
      const repMatch = infoText.match(/\[\s*([^\]]+)\]/);
      const representativeKeywords = repMatch
        ? repMatch[1]
            .split(",")
            .map((k: string) => k.trim())
            .filter(Boolean)
        : [];

      // 등록일
      const registeredDate = $(tds[4 + colOffset]).text().trim().split("\n")[0]?.trim() || "";

      // tr2 행에서 순위 데이터 추출
      const tr2 = row.next("tr");
      const ranks: RankEntry[] = [];

      if (tr2.length && (tr2.attr("class") || "").includes("tr2")) {
        tr2.find(".stat_div").each((_: number, div: any) => {
          const dateSpan = $(div).find("span").first().text().trim();
          const dateMatch = dateSpan.match(/(\d{2}-\d{2})/);
          if (!dateMatch) return;

          const bTags = $(div).find("b");
          const rankText = bTags.first().text().trim();
          const rankNumMatch = rankText.match(/(\d+)위/);
          const rank = rankNumMatch ? parseInt(rankNumMatch[1]) : null;

          const saves = bTags.length > 1 ? bTags.eq(1).text().trim() : "";

          let blogReviews = "";
          let visitorReviews = "";
          $(div)
            .find("span.fc_888")
            .each((_: number, sp: any) => {
              const t = $(sp).text().trim();
              if (t.startsWith("블 "))
                blogReviews = t.replace("블 ", "").replace("개", "");
              if (t.startsWith("방 "))
                visitorReviews = t
                  .replace("방 ", "")
                  .replace("개", "")
                  .replace(/,/g, "");
            });

          // N1/N2/N3 지수
          let n1: number | null = null;
          let n2: number | null = null;
          let n3: number | null = null;
          const n1Span = $(div).find("span.fc_197").text().trim();
          const n1Match = n1Span.match(/N1\s*([\d.]+)/);
          if (n1Match) n1 = parseFloat(n1Match[1]);

          const n2Span = $(div).find("span.fc_255").text().trim();
          const n2Match = n2Span.match(/N2\s*([\d.]+)/);
          if (n2Match) n2 = parseFloat(n2Match[1]);

          const n3Span = $(div).find("span.fc_888.marb5").text().trim();
          const n3Match = n3Span.match(/N3\s*([\d.]+)/);
          if (n3Match) n3 = parseFloat(n3Match[1]);

          ranks.push({ date: dateMatch[1], rank, saves, blogReviews, visitorReviews, n1, n2, n3 });
        });
      }

      // 체크 시간
      let lastCheckedAt = "";
      if (tr2.length) {
        lastCheckedAt = tr2.find("td").last().text().trim().replace(/\s+/g, " ");
      }

      items.push({
        keyword,
        placeUrl,
        placeName,
        placeId,
        monthlySearch,
        businessCount,
        representativeKeywords,
        registeredDate,
        ranks: ranks.slice(0, 30),
        lastCheckedAt,
      });
    }
  } catch {
    /* ignore */
  }

  return items;
}

/* ─── 파워링크 입찰가 분석 파싱 ─── */

function parseBidAnalysis(html: string): BidItem[] {
  const items: BidItem[] = [];

  try {
    const $ = cheerio.load(html);
    const table = $("table").first();

    table.find("tr").each((_: number, row: any) => {
      const tds = $(row).find("td");
      if (tds.length < 17) return;

      const keyword = $(tds[1]).text().trim();
      if (!keyword) return;

      const parseNum = (s: string) =>
        parseFloat(s.replace(/[,원%개]/g, "")) || 0;

      items.push({
        keyword,
        pcSearch: parseNum($(tds[2]).text()),
        moSearch: parseNum($(tds[3]).text()),
        totalSearch: parseNum($(tds[4]).text()),
        pcClicks: parseNum($(tds[5]).text()),
        moClicks: parseNum($(tds[6]).text()),
        pcCtr: $(tds[7]).text().trim(),
        moCtr: $(tds[8]).text().trim(),
        competition: $(tds[9]).text().trim(),
        avgAds: $(tds[10]).text().trim(),
        pcBids: [
          $(tds[11]).text().trim(),
          $(tds[12]).text().trim(),
          $(tds[13]).text().trim(),
        ],
        moBids: [
          $(tds[14]).text().trim(),
          $(tds[15]).text().trim(),
          $(tds[16]).text().trim(),
        ],
        checkedDate: $(tds[17])?.text().trim() || "",
      });
    });
  } catch {
    /* ignore */
  }

  return items;
}

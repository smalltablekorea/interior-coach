/**
 * 네이버 검색 API — 발행 후 글 검색 순위 추출.
 *
 * Q6=a: NAVER_CLIENT_ID/SECRET 환경변수 있으면 실 호출, 없으면 mock.
 */

const NAVER_API = "https://openapi.naver.com/v1/search/blog.json";
const DISPLAY = 100;

const NAVER_ID = process.env.NAVER_CLIENT_ID;
const NAVER_SECRET = process.env.NAVER_CLIENT_SECRET;
export const NAVER_SEARCH_ENABLED = !!(NAVER_ID && NAVER_SECRET);

export interface RankResult {
  keyword: string;
  rank: number | null; // 1-based, null = top 100 안 보임
  totalResults: number;
  mock: boolean;
  matchedUrl?: string | null;
}

interface NaverApiResp {
  total: number;
  items: Array<{
    link: string;
    bloggername?: string;
    bloggerlink?: string;
  }>;
}

/** URL에서 host만 추출 (서브도메인 포함, scheme/path 제거) */
function extractHost(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    return new URL(rawUrl).host.toLowerCase();
  } catch {
    return null;
  }
}

/** 블로거 link (예: https://blog.naver.com/{userId}) 의 userId 추출 */
function extractBloggerId(rawUrl: string | null | undefined): string | null {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    if (!u.host.includes("blog.naver.com")) return null;
    const segs = u.pathname.split("/").filter(Boolean);
    return segs[0]?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

function mockRank(keyword: string): RankResult {
  // 결정적 mock: keyword 길이로 rank 생성 (운영자가 결과 검증 가능하게)
  const rank = (keyword.length % 30) + 1;
  return {
    keyword,
    rank,
    totalResults: 12345,
    mock: true,
  };
}

export async function searchRank(
  keyword: string,
  targetBlogUrl: string | null,
): Promise<RankResult> {
  if (!NAVER_SEARCH_ENABLED) {
    return mockRank(keyword);
  }
  if (!keyword.trim()) {
    return { keyword, rank: null, totalResults: 0, mock: false };
  }

  const targetBloggerId = extractBloggerId(targetBlogUrl);
  const targetHost = extractHost(targetBlogUrl);

  const url = `${NAVER_API}?query=${encodeURIComponent(keyword)}&display=${DISPLAY}`;
  const resp = await fetch(url, {
    headers: {
      "X-Naver-Client-Id": NAVER_ID!,
      "X-Naver-Client-Secret": NAVER_SECRET!,
    },
  });
  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Naver search API ${resp.status}: ${body.slice(0, 200)}`);
  }
  const data = (await resp.json()) as NaverApiResp;
  const items = data.items ?? [];

  let rank: number | null = null;
  let matchedUrl: string | null = null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const itHost = extractHost(it.link);
    const itBlogger = extractBloggerId(it.bloggerlink ?? it.link);
    const matched =
      (targetBloggerId && itBlogger && targetBloggerId === itBlogger) ||
      (targetHost && itHost && targetHost === itHost);
    if (matched) {
      rank = i + 1;
      matchedUrl = it.link;
      break;
    }
  }

  return {
    keyword,
    rank,
    totalResults: data.total ?? 0,
    mock: false,
    matchedUrl,
  };
}

/** 해시태그 배열 → 검색 키워드 (앞의 # 제거, 빈 값 제외) */
export function hashtagsToKeywords(hashtags: string[] | null | undefined): string[] {
  if (!hashtags) return [];
  return hashtags
    .map((h) => h.replace(/^#+/, "").trim())
    .filter((k) => k.length > 0);
}

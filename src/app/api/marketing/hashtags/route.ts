import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * POST /api/marketing/hashtags
 *
 * Hashtag optimization engine — generates optimized hashtag sets
 * based on channel, content type, and context.
 *
 * Body: { channel, buildingType?, areaPyeong?, location?, contentType?, customTags?: string[] }
 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "read");
  if (!auth.ok) return auth.response;

  try {
    const {
      channel,
      buildingType,
      areaPyeong,
      location,
      contentType,
      customTags,
    } = await request.json();

    if (!channel) {
      return err("channel이 필요합니다");
    }

    const optimized = generateOptimizedHashtags({
      channel,
      buildingType,
      areaPyeong,
      location,
      contentType,
      customTags,
    });

    return ok(optimized);
  } catch (error) {
    return serverError(error);
  }
}

interface HashtagInput {
  channel: string;
  buildingType?: string;
  areaPyeong?: number;
  location?: string;
  contentType?: string;
  customTags?: string[];
}

interface HashtagResult {
  primary: string[];      // High-volume, broad reach
  secondary: string[];    // Medium-volume, targeted
  niche: string[];        // Low-volume, high engagement
  trending: string[];     // Trending/seasonal tags
  all: string[];          // Combined optimized set
  strategy: string;       // Explanation
}

// Korean interior design hashtag database with engagement tiers
const HASHTAG_DB = {
  // Tier 1: High-volume (>100K posts)
  primary: [
    "인테리어", "인테리어디자인", "리모델링", "홈인테리어", "인테리어시공",
    "셀프인테리어", "인테리어업체", "모던인테리어", "미니멀인테리어",
    "아파트인테리어", "집꾸미기", "인스타인테리어", "홈스타일링",
  ],
  // Tier 2: Medium-volume (10K-100K)
  buildingType: {
    아파트: ["아파트인테리어", "아파트리모델링", "아파트올수리", "아파트부분수리", "아파트셀프인테리어"],
    빌라: ["빌라인테리어", "빌라리모델링", "빌라올수리", "빌라시공"],
    오피스텔: ["오피스텔인테리어", "원룸인테리어", "오피스텔꾸미기", "원룸꾸미기"],
    상가: ["상가인테리어", "매장인테리어", "상업인테리어", "카페인테리어", "매장디자인"],
    주택: ["주택인테리어", "단독주택인테리어", "주택리모델링", "전원주택인테리어"],
  },
  // Area-based
  area: {
    small: ["소형인테리어", "10평대인테리어", "원룸인테리어", "소형아파트"],
    medium20: ["20평대인테리어", "20평인테리어", "투룸인테리어", "신혼집인테리어"],
    medium30: ["30평대인테리어", "30평인테리어", "국민평수인테리어"],
    large: ["40평대인테리어", "50평인테리어", "대형인테리어", "펜트하우스인테리어"],
  },
  // Content type specific
  contentType: {
    시공완료: ["시공완료", "비포애프터", "before_after", "시공사례", "완공"],
    시공사진: ["시공현장", "시공과정", "현장스케치", "공사일지"],
    인테리어팁: ["인테리어팁", "인테리어정보", "인테리어꿀팁", "시공팁", "리모델링팁"],
    시공사례: ["시공사례", "포트폴리오", "인테리어사례", "시공후기"],
    프로모션: ["인테리어이벤트", "시공할인", "인테리어프로모션", "특가"],
  },
  // Trade-specific
  trades: {
    철거: ["철거공사", "해체공사", "리모델링철거"],
    목공: ["목공사", "인테리어목공", "붙박이장", "맞춤가구"],
    전기: ["전기공사", "조명시공", "LED조명", "인테리어조명"],
    설비: ["설비공사", "배관공사", "욕실시공"],
    타일: ["타일시공", "욕실타일", "주방타일", "포세린타일"],
    도배: ["도배공사", "벽지시공", "실크벽지", "합지벽지"],
    마루: ["마루시공", "바닥재", "강마루", "원목마루"],
    페인트: ["페인트시공", "벽페인트", "인테리어페인트", "젠톤페인트"],
    가구: ["맞춤가구", "붙박이장", "시스템가구", "주방가구"],
  },
  // Style tags
  style: [
    "모던인테리어", "미니멀인테리어", "내추럴인테리어", "북유럽인테리어",
    "화이트인테리어", "우드인테리어", "모노톤인테리어", "빈티지인테리어",
    "클래식인테리어", "뉴트럴인테리어", "코지인테리어",
  ],
  // Seasonal/trending (rotate)
  trending: [
    "2026인테리어", "인테리어트렌드", "신축인테리어", "이사인테리어",
    "봄인테리어", "가을인테리어", "연말인테리어",
  ],
  // Location tags (Seoul focused)
  locations: {
    서울: ["서울인테리어", "서울리모델링", "서울시공"],
    강남: ["강남인테리어", "강남리모델링"],
    송파: ["송파인테리어", "잠실인테리어"],
    마포: ["마포인테리어", "합정인테리어"],
    용산: ["용산인테리어", "이태원인테리어"],
    성북: ["성북인테리어", "성북리모델링"],
    은평: ["은평인테리어", "녹번동인테리어"],
    광진: ["광진인테리어", "건대인테리어"],
    영등포: ["영등포인테리어", "여의도인테리어"],
  } as Record<string, string[]>,
  // Brand tags
  brand: ["스몰테이블디자인", "스몰테이블디자인그룹", "인테리어코치"],
};

function generateOptimizedHashtags(input: HashtagInput): HashtagResult {
  const { channel, buildingType, areaPyeong, location, contentType, customTags } = input;

  // Build primary tags (always include)
  const primary = [...HASHTAG_DB.primary.slice(0, 5), ...HASHTAG_DB.brand];

  // Build secondary tags based on context
  const secondary: string[] = [];
  if (buildingType && HASHTAG_DB.buildingType[buildingType]) {
    secondary.push(...HASHTAG_DB.buildingType[buildingType]);
  }
  if (areaPyeong) {
    if (areaPyeong <= 15) secondary.push(...HASHTAG_DB.area.small);
    else if (areaPyeong <= 25) secondary.push(...HASHTAG_DB.area.medium20);
    else if (areaPyeong <= 35) secondary.push(...HASHTAG_DB.area.medium30);
    else secondary.push(...HASHTAG_DB.area.large);
  }
  if (contentType && HASHTAG_DB.contentType[contentType]) {
    secondary.push(...HASHTAG_DB.contentType[contentType]);
  }

  // Build niche tags
  const niche: string[] = [];
  if (location) {
    const locationKey = Object.keys(HASHTAG_DB.locations).find(
      (k) => location.includes(k)
    );
    if (locationKey) {
      niche.push(...HASHTAG_DB.locations[locationKey]);
    }
  }
  niche.push(...HASHTAG_DB.style.slice(0, 3));

  // Trending tags
  const month = new Date().getMonth();
  const trending = [...HASHTAG_DB.trending.slice(0, 2)];
  if (month >= 2 && month <= 4) trending.push("봄인테리어");
  else if (month >= 8 && month <= 10) trending.push("가을인테리어");

  // Channel-specific limits
  const limits: Record<string, number> = {
    instagram: 30,
    threads: 10,
    x: 5,
    naver_blog: 15,
    youtube: 15,
  };
  const maxTags = limits[channel] || 15;

  // Combine all, deduplicate, and limit
  const allTags = [
    ...primary,
    ...secondary,
    ...niche,
    ...trending,
    ...(customTags || []),
  ];
  const unique = [...new Set(allTags)].slice(0, maxTags);

  // Strategy explanation
  const strategy = channel === "instagram"
    ? "인스타그램: 대형 해시태그(도달범위) + 중형(타겟) + 소형(참여율) 3단계 전략. 30개 최대 활용으로 노출 극대화."
    : channel === "x"
      ? "X: 핵심 키워드 3~5개만 사용. 과도한 해시태그는 참여율을 낮춤. 트렌딩 키워드 우선."
      : channel === "threads"
        ? "스레드: 5~10개 해시태그로 깔끔하게. 인스타그램 연동 해시태그 포함."
        : "채널 특성에 맞는 해시태그 최적화 전략 적용.";

  return {
    primary,
    secondary,
    niche,
    trending,
    all: unique,
    strategy,
  };
}

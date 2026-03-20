// =============================================================================
// AI Prompt Builders for Marketing Content Generation
// Used by /api/marketing/content/generate endpoint
// =============================================================================

interface SiteContext {
  name: string;
  address: string | null;
  buildingType: string | null;
  areaPyeong: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  photos: {
    url: string;
    phase: string | null;
    category: string | null;
    caption: string | null;
  }[];
  estimateItems: { category: string; itemName: string; amount: number }[];
  phases: { category: string; status: string; progress: number }[];
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function formatSiteOverview(site: SiteContext): string {
  const lines: string[] = [];
  lines.push(`[현장 정보]`);
  lines.push(`- 현장명: ${site.name}`);
  if (site.address) lines.push(`- 주소: ${site.address}`);
  if (site.buildingType) lines.push(`- 건물 유형: ${site.buildingType}`);
  if (site.areaPyeong) lines.push(`- 면적: ${site.areaPyeong}평`);
  lines.push(`- 현재 상태: ${site.status}`);
  if (site.startDate) lines.push(`- 착공일: ${site.startDate}`);
  if (site.endDate) lines.push(`- 준공(예정)일: ${site.endDate}`);
  return lines.join("\n");
}

function formatEstimate(site: SiteContext): string {
  if (site.estimateItems.length === 0) return "";
  const lines: string[] = ["[견적 항목]"];
  const totalAmount = site.estimateItems.reduce((s, i) => s + i.amount, 0);
  for (const item of site.estimateItems) {
    lines.push(
      `- ${item.category} > ${item.itemName}: ${item.amount.toLocaleString()}원`
    );
  }
  lines.push(`- 총 합계: ${totalAmount.toLocaleString()}원`);
  return lines.join("\n");
}

function formatPhases(site: SiteContext): string {
  if (site.phases.length === 0) return "";
  const lines: string[] = ["[공정 현황]"];
  for (const phase of site.phases) {
    lines.push(
      `- ${phase.category}: ${phase.status} (진행률 ${phase.progress}%)`
    );
  }
  return lines.join("\n");
}

function formatPhotos(site: SiteContext): string {
  if (site.photos.length === 0) return "";
  const lines: string[] = ["[사진 목록]"];
  for (const photo of site.photos) {
    const parts: string[] = [];
    if (photo.phase) parts.push(`공정: ${photo.phase}`);
    if (photo.category) parts.push(`카테고리: ${photo.category}`);
    if (photo.caption) parts.push(`설명: ${photo.caption}`);
    lines.push(`- ${parts.join(", ")} (${photo.url})`);
  }
  return lines.join("\n");
}

function buildSiteDataBlock(site: SiteContext): string {
  return [
    formatSiteOverview(site),
    formatEstimate(site),
    formatPhases(site),
    formatPhotos(site),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function locationFromAddress(address: string | null): string {
  if (!address) return "";
  // 시/군/구 단위까지 추출 (예: "서울시 강남구")
  const match = address.match(
    /^(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)[^\s]*\s*[^\s]*/
  );
  return match ? match[0] : address.split(" ").slice(0, 2).join(" ");
}

// -----------------------------------------------------------------------------
// Blog Prompt
// -----------------------------------------------------------------------------

const BLOG_CONTENT_TYPES: Record<string, string> = {
  시공사례:
    "시공 과정과 결과를 상세히 소개하는 시공 사례 블로그 포스트를 작성해 주세요. 고객이 왜 이 시공을 선택했는지, 어떤 자재와 공법을 사용했는지, 최종 결과가 어떠한지를 스토리텔링 형식으로 서술해 주세요.",
  비포애프터:
    "시공 전후를 극적으로 비교하는 비포 & 애프터 블로그 포스트를 작성해 주세요. 각 공간별 변화를 [PHOTO_공종_BEFORE]와 [PHOTO_공종_AFTER] 마커를 사용하여 사진 배치를 표시하고, 변화 포인트를 구체적으로 설명해 주세요.",
  비용분석:
    "시공 비용을 항목별로 분석하는 블로그 포스트를 작성해 주세요. 견적 항목을 카테고리별로 정리하고, 각 비용이 합리적인 이유와 절약 팁을 포함해 주세요. 독자가 자신의 인테리어 예산을 세울 때 참고할 수 있도록 실용적인 정보를 제공해 주세요.",
  자재리뷰:
    "시공에 사용된 주요 자재를 리뷰하는 블로그 포스트를 작성해 주세요. 각 자재의 장단점, 시공 후 사용 소감, 가성비 평가, 유사 대체 자재와의 비교를 포함해 주세요.",
};

export function buildBlogPrompt(
  site: SiteContext,
  contentType: string,
  additionalContext?: string
): string {
  const typeInstruction =
    BLOG_CONTENT_TYPES[contentType] || BLOG_CONTENT_TYPES["시공사례"];

  const location = locationFromAddress(site.address);
  const areaStr = site.areaPyeong ? `${site.areaPyeong}평` : "";
  const buildingStr = site.buildingType || "";

  const prompt = `당신은 인테리어/리모델링 전문 블로그 작성자입니다.
아래 현장 데이터를 바탕으로 네이버 블로그에 게시할 글을 작성해 주세요.

${buildSiteDataBlock(site)}

[작성 요청]
콘텐츠 유형: ${contentType}
${typeInstruction}

[작성 규칙]
1. 글자 수: 2000~3000자 (공백 포함)
2. SEO 최적화:
   - 핵심 키워드(${[location, areaStr, buildingStr, "인테리어", "리모델링"].filter(Boolean).join(", ")})를 자연스럽게 포함
   - 키워드 밀도 1~2% 유지
   - H2, H3 소제목을 활용하여 구조화
3. 사진 배치:
   - 본문 중간에 [PHOTO_공종_BEFORE], [PHOTO_공종_AFTER] 형태의 사진 위치 마커를 삽입
   - 마커 아래에 사진 설명 캡션을 포함
4. 문체: 전문적이면서 친근한 톤 (\"~합니다\" 체)
5. 글 마지막에 아래와 같은 상담 유도 섹션을 포함:
   ---
   인테리어/리모델링 상담 문의
   무료 현장 방문 견적 가능합니다.
   연락처: [CONTACT_PHONE]
   카카오톡: [CONTACT_KAKAO]
   ---
${additionalContext ? `\n[추가 요청사항]\n${additionalContext}` : ""}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트는 포함하지 마세요.
{
  "title": "블로그 제목 (40~60자)",
  "body": "블로그 본문 전체 (HTML 또는 마크다운)",
  "hashtags": ["관련 해시태그 10~15개"],
  "keywords": ["SEO 핵심 키워드 5~10개"]
}`;

  return prompt;
}

// -----------------------------------------------------------------------------
// Threads Prompt
// -----------------------------------------------------------------------------

const THREADS_CONTENT_TYPES: Record<string, string> = {
  시공완료:
    "시공이 완료된 현장을 소개하는 게시물을 작성해 주세요. 완성된 공간의 매력을 짧고 임팩트 있게 전달해 주세요.",
  시공팁:
    "시공 과정에서 얻은 실용적인 팁을 공유하는 게시물을 작성해 주세요. 독자가 즉시 활용할 수 있는 핵심 노하우를 전달해 주세요.",
  비포애프터:
    "시공 전후 변화를 극적으로 보여주는 게시물을 작성해 주세요. 한눈에 변화가 느껴지도록 핵심만 전달해 주세요.",
  고객후기:
    "고객 만족 후기 형태의 게시물을 작성해 주세요. 실제 고객의 목소리처럼 자연스러운 톤으로 작성해 주세요.",
};

export function buildThreadsPrompt(
  site: SiteContext,
  contentType: string,
  additionalContext?: string
): string {
  const typeInstruction =
    THREADS_CONTENT_TYPES[contentType] || THREADS_CONTENT_TYPES["시공완료"];

  const prompt = `당신은 인테리어/리모델링 전문 SNS 마케터입니다.
아래 현장 데이터를 바탕으로 Threads(스레드)에 게시할 짧은 글을 작성해 주세요.

${buildSiteDataBlock(site)}

[작성 요청]
콘텐츠 유형: ${contentType}
${typeInstruction}

[작성 규칙]
1. 글자 수: 최대 500자 이내 (짧을수록 좋음)
2. 구조:
   - 첫 줄은 반드시 강렬한 훅(Hook)으로 시작 (질문, 놀라운 사실, 숫자 활용)
   - 핵심 메시지 1~2개만 전달
   - 마지막에 행동 유도(CTA) 한 줄
3. 이모지를 적극 활용하여 가독성 높이기 (문장 앞이나 핵심 포인트에 배치)
4. 해시태그: 5~10개 (본문과 분리하여 마지막에 배치)
5. 문체: 친근하고 캐주얼한 말투 (\"~요\" 체)
${additionalContext ? `\n[추가 요청사항]\n${additionalContext}` : ""}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트는 포함하지 마세요.
{
  "title": "게시물 첫 줄 훅 (한 줄 요약)",
  "body": "본문 전체 (이모지 포함, 해시태그 제외)",
  "hashtags": ["해시태그 5~10개"],
  "keywords": ["관련 키워드 3~5개"]
}`;

  return prompt;
}

// -----------------------------------------------------------------------------
// Instagram Prompt
// -----------------------------------------------------------------------------

const INSTAGRAM_CONTENT_TYPES: Record<string, string> = {
  시공사례:
    "시공 사례를 소개하는 인스타그램 게시물을 작성해 주세요. 시각적 매력을 강조하고, 공간의 분위기와 디자인 포인트를 전달해 주세요.",
  비포애프터:
    "시공 전후 비교를 보여주는 인스타그램 게시물을 작성해 주세요. 극적인 변화를 강조하여 팔로워의 관심을 끌어 주세요.",
  자재소개:
    "시공에 사용된 자재를 소개하는 인스타그램 게시물을 작성해 주세요. 자재의 특징, 질감, 컬러감을 감성적으로 표현해 주세요.",
  인테리어팁:
    "인테리어 관련 실용적인 팁을 공유하는 인스타그램 게시물을 작성해 주세요. 팔로워가 저장하고 싶어지는 유용한 정보를 전달해 주세요.",
};

export function buildInstagramPrompt(
  site: SiteContext,
  contentType: string,
  additionalContext?: string
): string {
  const typeInstruction =
    INSTAGRAM_CONTENT_TYPES[contentType] || INSTAGRAM_CONTENT_TYPES["시공사례"];

  const location = locationFromAddress(site.address);
  const buildingStr = site.buildingType || "아파트";

  const prompt = `당신은 인테리어/리모델링 전문 인스타그램 콘텐츠 크리에이터입니다.
아래 현장 데이터를 바탕으로 인스타그램에 게시할 캡션을 작성해 주세요.

${buildSiteDataBlock(site)}

[작성 요청]
콘텐츠 유형: ${contentType}
${typeInstruction}

[작성 규칙]
1. 캡션 구조:
   - 첫 줄: 임팩트 있는 한 줄 (이모지 포함)
   - 본문: 3~5문단, 각 문단 사이 줄바꿈
   - 핵심 정보: 위치, 면적, 시공 기간, 주요 공종 포함
   - CTA: "더 많은 시공 사례가 궁금하시면 프로필 링크를 확인해 주세요!" 등
2. 이모지: 각 문단 시작이나 핵심 포인트에 적극 활용
3. 톤: 감성적이면서 전문적, 트렌디한 느낌
4. 해시태그 (캡션과 분리하여 별도 제공):
   - 총 20~30개
   - 위치 관련: #${location ? location.replace(/\s/g, "") : "서울인테리어"} #${location ? location.replace(/\s/g, "") + "인테리어" : "강남인테리어"} 등
   - 시공 유형: #${buildingStr}리모델링 #${buildingStr}인테리어 등
   - 스타일: #모던인테리어 #미니멀인테리어 #북유럽인테리어 등
   - 트렌드: #인테리어스타그램 #집스타그램 #홈스타그램 등
   - 공종: #욕실리모델링 #주방인테리어 #바닥시공 등
5. 문체: \"~요\" 체, 따뜻하고 친근한 톤
${additionalContext ? `\n[추가 요청사항]\n${additionalContext}` : ""}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트는 포함하지 마세요.
{
  "title": "게시물 첫 줄 (한 줄 요약, 이모지 포함)",
  "body": "캡션 본문 전체 (해시태그 제외, 이모지 포함)",
  "hashtags": ["해시태그 20~30개"],
  "keywords": ["SEO 키워드 5~10개"]
}`;

  return prompt;
}

// -----------------------------------------------------------------------------
// YouTube Prompt
// -----------------------------------------------------------------------------

const YOUTUBE_CONTENT_TYPES: Record<string, string> = {
  비포애프터:
    "시공 전후를 비교하는 유튜브 영상의 제목, 설명, 태그를 작성해 주세요. 시청자가 클릭하고 싶어지는 극적인 변화를 강조해 주세요.",
  비용가이드:
    "시공 비용을 상세히 안내하는 유튜브 영상의 제목, 설명, 태그를 작성해 주세요. 시청자가 예산을 계획할 때 도움이 되는 실용적인 정보를 제공해 주세요.",
  공정소개:
    "시공 과정을 단계별로 소개하는 유튜브 영상의 제목, 설명, 태그를 작성해 주세요. 각 공정이 왜 중요한지, 주의할 점은 무엇인지 설명해 주세요.",
  자재소개:
    "시공에 사용된 자재를 소개하는 유튜브 영상의 제목, 설명, 태그를 작성해 주세요. 자재 선택 기준과 실제 시공 후기를 포함해 주세요.",
};

export function buildYouTubePrompt(
  site: SiteContext,
  contentType: string,
  additionalContext?: string
): string {
  const typeInstruction =
    YOUTUBE_CONTENT_TYPES[contentType] || YOUTUBE_CONTENT_TYPES["비포애프터"];

  const location = locationFromAddress(site.address);
  const areaStr = site.areaPyeong ? `${site.areaPyeong}평` : "";
  const buildingStr = site.buildingType || "아파트";

  // 공정 목록에서 타임스탬프 예시 생성
  const timestampExample = site.phases
    .slice(0, 6)
    .map((phase, i) => {
      const min = i * 2;
      const sec = "00";
      return `${String(min).padStart(2, "0")}:${sec} ${phase.category} 시공 과정`;
    })
    .join("\n   ");

  const prompt = `당신은 인테리어/리모델링 전문 유튜브 콘텐츠 전략가입니다.
아래 현장 데이터를 바탕으로 유튜브 영상의 제목, 설명, 태그를 작성해 주세요.

${buildSiteDataBlock(site)}

[작성 요청]
콘텐츠 유형: ${contentType}
${typeInstruction}

[작성 규칙]
1. 제목 (title):
   - 최대 100자 이내
   - SEO 최적화 패턴 사용:
     "${location ? `[${location}]` : "[지역]"} ${areaStr || "[평수]평"} ${buildingStr} [공간] 리모델링"
   - 클릭을 유도하는 요소 포함: 비용 공개, 비포애프터, 놀라운 변화 등
   - 예시: "${location || "서울 강남"} ${areaStr || "30평"} ${buildingStr} 올수리 리모델링 | 비용 전격 공개!"
2. 설명 (body):
   - 500자 이상
   - 첫 2줄에 핵심 내용 요약 (검색 결과에 노출)
   - 타임스탬프 포함:
   ${timestampExample || "00:00 인트로\n   01:00 시공 전 현장\n   03:00 시공 과정\n   06:00 시공 완료"}
   - 현장 정보 포함: 위치, 면적, 시공 기간, 주요 공종
   - 하단에 채널 구독/좋아요 유도 문구
   - 문의 안내: [CONTACT_PHONE], [CONTACT_KAKAO]
3. 태그 (hashtags):
   - 15~30개
   - 검색량 높은 키워드 우선 배치
   - 혼합 구성: 대형 키워드(인테리어, 리모델링) + 중형(${buildingStr}인테리어) + 롱테일(${location || "지역"}${areaStr || "평수"}${buildingStr}리모델링)
4. 키워드 (keywords):
   - 유튜브 검색 최적화용 핵심 키워드 10~15개
${additionalContext ? `\n[추가 요청사항]\n${additionalContext}` : ""}

[응답 형식]
반드시 아래 JSON 형식으로만 응답하세요. JSON 외의 텍스트는 포함하지 마세요.
{
  "title": "영상 제목 (최대 100자)",
  "body": "영상 설명 전체 (타임스탬프 포함)",
  "hashtags": ["태그 15~30개"],
  "keywords": ["SEO 키워드 10~15개"]
}`;

  return prompt;
}

// -----------------------------------------------------------------------------
// Dispatcher
// -----------------------------------------------------------------------------

export function buildPrompt(
  channel: string,
  site: SiteContext,
  contentType: string,
  additionalContext?: string
): string {
  switch (channel) {
    case "blog":
      return buildBlogPrompt(site, contentType, additionalContext);
    case "threads":
      return buildThreadsPrompt(site, contentType, additionalContext);
    case "instagram":
      return buildInstagramPrompt(site, contentType, additionalContext);
    case "youtube":
      return buildYouTubePrompt(site, contentType, additionalContext);
    default:
      throw new Error(
        `지원하지 않는 마케팅 채널입니다: ${channel}. 사용 가능한 채널: blog, threads, instagram, youtube`
      );
  }
}

export type { SiteContext };

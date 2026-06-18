/**
 * 마케팅 대행 콘텐츠 생성 엔진 (Phase 3).
 *
 * - 생성 모델: claude-sonnet-4-6 (Q1=c)
 * - 환경변수 토글: AGENCY_AI_ENABLED=true 시 실 호출, 아니면 mock (Q8=c)
 * - 호출당 input/output 토큰 콘솔 로깅
 * - 클라이언트 톤: brand_tone JSONB + 과거 시공 사례 캡션 3개 few-shot (Q10=c)
 * - 자재 단가 RAG: top-30 materials 컨텍스트 주입 (Q3=c)
 * - 이미지 마커: AI가 본문에 [이미지N] 토큰 직접 삽입 + position 메타 (Q6=a)
 */

import Anthropic from "@anthropic-ai/sdk";
import type {
  AgencyImageMarker,
  agencyClients,
  agencyBrandAssets,
  agencyWeeklyUploads,
} from "@/lib/db/schema";
import type { MaterialCandidate } from "@/lib/agency/materials-cite";
import { formatMaterialsContext } from "@/lib/agency/materials-cite";
import { MODELS } from "@/lib/api/ai-helpers";

/**
 * 마케팅 대행 콘텐츠 생성 모델 — 중앙 관리되는 MODELS.SONNET 재export.
 * 향후 Sonnet 새 버전 출시 시 src/lib/api/ai-helpers.ts:MODELS 한 곳만 변경하면
 * 전체 AI 호출(견적코치·세무·마케팅·대행 등)이 자동 적용.
 */
export const GEN_MODEL = MODELS.SONNET;
export const AGENCY_AI_ENABLED = process.env.AGENCY_AI_ENABLED === "true";

export type Channel = "naver_blog" | "threads" | "instagram";

type Client = typeof agencyClients.$inferSelect;
type BrandAsset = typeof agencyBrandAssets.$inferSelect;
type WeeklyUpload = typeof agencyWeeklyUploads.$inferSelect;

export interface GenerateInput {
  channel: Channel;
  client: Client;
  brandAssets: BrandAsset[];
  weeklyUpload: WeeklyUpload | null;
  relevantMaterials: MaterialCandidate[];
  attemptNumber: number;
  previousFeedback?: string | null;
}

export interface GenerateOutput {
  title: string | null;
  body: string;
  hashtags: string[];
  imageMarkers: AgencyImageMarker[];
  tokensIn: number;
  tokensOut: number;
  rawJson?: unknown;
}

interface RawAiOutput {
  title?: string;
  body: string;
  hashtags?: string[];
  image_markers?: Array<{
    marker: string;
    image_index: number; // weeklyUpload.imageUrls 인덱스
    caption?: string;
    paragraph_index?: number;
    char_offset?: number;
  }>;
}

const CHANNEL_GUIDELINES: Record<Channel, string> = {
  naver_blog: [
    "네이버 블로그 시공 사례 포스트.",
    "분량: 2000~3000자.",
    "H2, H3 헤딩 활용한 구성. 본문은 마크다운.",
    "SEO: 지역명 + 평수 + 인테리어 스타일 + 시공 카테고리 키워드를 자연스럽게 본문에 4~6회 분산 배치.",
    "시공 전/후 비교, 자재 선택의 이유, 시공 기간, 비용 흐름을 포함.",
    "이미지 마커는 본문 흐름상 자연스러운 위치에 [이미지1], [이미지2]... 형식으로 삽입. 첨부 이미지 수만큼 활용.",
  ].join("\n"),
  threads: [
    "Threads 단일 게시물. 짧고 후킹 강한 카피.",
    "분량: 300자 이내.",
    "줄바꿈으로 호흡 분리. 첫 줄에서 임팩트.",
    "해시태그 5~7개.",
    "이미지 1~3장 첨부 전제 — 본문 끝에 [이미지1] [이미지2] 형식 마커 배치.",
  ].join("\n"),
  instagram: [
    "Instagram 피드 캡션.",
    "분량: 500~800자.",
    "감성적/시각적 톤. 줄바꿈으로 호흡.",
    "해시태그 10~15개 (한국어 + 영어 혼용).",
    "이미지 마커는 본문 끝에 [이미지1] [이미지2] 형식으로.",
  ].join("\n"),
};

function buildSystemPrompt(input: GenerateInput): string {
  const { channel, client, brandAssets } = input;
  const brandTone =
    (client.brandTone as { description?: string; keywords?: string[] } | null) ?? null;
  const toneKeywords = brandTone?.keywords?.length
    ? brandTone.keywords.join(", ")
    : "(미설정)";
  const toneDesc = brandTone?.description?.trim() || "(미설정)";
  const fewShotCaptions = brandAssets
    .filter((a) => a.caption && a.caption.trim().length > 0)
    .slice(0, 3)
    .map((a, i) => `예시 ${i + 1}: ${a.caption}`)
    .join("\n");

  return [
    `당신은 인테리어 업체 "${client.businessName}"의 콘텐츠 마케터입니다.`,
    `한국 시장의 ${channel === "naver_blog" ? "네이버 블로그" : channel === "threads" ? "Threads" : "Instagram"} 콘텐츠를 작성합니다.`,
    ``,
    `[브랜드 톤]`,
    `- 설명: ${toneDesc}`,
    `- 키워드: ${toneKeywords}`,
    `- 타겟: ${client.targetAudience || "(미설정)"}`,
    `- 카테고리: ${(client.categories as string[] | null)?.join(", ") || "(미설정)"}`,
    `- 지역: ${client.region || "(미설정)"}`,
    ``,
    fewShotCaptions
      ? `[과거 시공 사례 캡션 예시 — 톤 학습용]\n${fewShotCaptions}`
      : `[과거 시공 사례 캡션 예시] (없음)`,
    ``,
    `[채널 가이드]`,
    CHANNEL_GUIDELINES[channel],
    ``,
    `[출력 형식 — 반드시 이 JSON만 반환]`,
    `{`,
    `  "title": "제목 (블로그만 필수, SNS는 null 가능)",`,
    `  "body": "본문 (이미지 위치에 [이미지1] [이미지2] ... 마커 삽입)",`,
    `  "hashtags": ["#태그1", "#태그2"],`,
    `  "image_markers": [`,
    `    { "marker": "[이미지1]", "image_index": 0, "caption": "거실 시공 전", "paragraph_index": 2, "char_offset": null }`,
    `  ]`,
    `}`,
    ``,
    `중요:`,
    `- JSON 외 다른 텍스트 절대 출력 금지.`,
    `- image_markers의 image_index는 첨부된 이미지 배열의 0-based 인덱스.`,
    `- paragraph_index는 본문 내 단락 인덱스 (0-based, 빈 줄로 구분).`,
    `- 본문은 사실에 기반. 자재 가격 언급 시 반드시 제공된 자재 데이터의 시세 범위 내에서.`,
  ].join("\n");
}

function buildUserPrompt(input: GenerateInput): string {
  const { weeklyUpload, relevantMaterials, attemptNumber, previousFeedback } = input;
  const week = weeklyUpload?.weekOfDate ?? "(이번 주 업로드 없음)";
  const notes = weeklyUpload?.notesText || "(노트 없음)";
  const photoCount = weeklyUpload?.imageUrls?.length ?? 0;

  const retryHint =
    attemptNumber > 1 && previousFeedback
      ? `\n[직전 QC 피드백 — 이번 재생성에 반영]\n${previousFeedback}\n`
      : "";

  return [
    `[이번 주 업로드]`,
    `- 주차: ${week}`,
    `- 사진: ${photoCount}장 첨부됨 (image_index 0~${photoCount - 1})`,
    `- 노트: ${notes}`,
    ``,
    `[참고 자재 시세]`,
    formatMaterialsContext(relevantMaterials),
    retryHint,
    ``,
    `이번 주 시공을 소재로 콘텐츠를 작성해주세요.`,
  ].join("\n");
}

/* ──────────────────────────────── mock ──────────────────────────────── */

function mockGenerate(input: GenerateInput): GenerateOutput {
  const { channel, client, weeklyUpload } = input;
  const week = weeklyUpload?.weekOfDate ?? "이번주";
  const photoCount = weeklyUpload?.imageUrls?.length ?? 0;
  const markers: AgencyImageMarker[] = Array.from({ length: Math.min(photoCount, 3) }).map(
    (_, i) => ({
      marker: `[이미지${i + 1}]`,
      imageUrl: weeklyUpload!.imageUrls[i],
      caption: `시공 사진 ${i + 1}`,
      position: { paragraphIndex: i + 1, charOffset: null, nodePath: null },
    }),
  );

  const body =
    channel === "naver_blog"
      ? [
          `## ${client.businessName} ${week} 시공 사례`,
          ``,
          `이번 주는 ${client.region || "현장"}에서 진행한 인테리어 시공을 소개합니다.`,
          ``,
          `${markers[0]?.marker ?? ""} 시공 전 상태를 먼저 확인합니다.`,
          ``,
          `자재 선택 단계에서는 평당 단가를 합리적으로 잡았습니다. 도배지 1롤당 약 15,000원, 마루 시공은 평당 약 12만원 수준입니다.`,
          ``,
          `${markers[1]?.marker ?? ""} 시공 중 단계입니다.`,
          ``,
          `(mock) Phase 3 베타. AGENCY_AI_ENABLED=true 설정 시 실제 Sonnet 4.6으로 교체.`,
          ``,
          `${markers[2]?.marker ?? ""} 완성된 모습입니다.`,
        ].join("\n")
      : [
          `${client.businessName} 이번 주 시공 완료 ✨`,
          ``,
          `${client.region || ""} 현장의 새 모습.`,
          `자세한 시공 후기는 블로그에서.`,
          ``,
          markers.map((m) => m.marker).join(" "),
        ].join("\n");

  return {
    title: channel === "naver_blog" ? `${client.businessName} ${week} 시공 사례 (mock)` : null,
    body,
    hashtags:
      channel === "naver_blog"
        ? ["#인테리어", "#시공사례", `#${client.region ?? "서울"}인테리어`]
        : ["#인테리어", "#시공", "#리모델링", "#홈스타일링"],
    imageMarkers: markers,
    tokensIn: 0,
    tokensOut: 0,
    rawJson: { mock: true },
  };
}

/* ──────────────────────────────── real ──────────────────────────────── */

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("AI 응답에서 JSON을 찾을 수 없습니다");
  return JSON.parse(match[0]);
}

function buildImageMarkers(
  raw: RawAiOutput,
  weeklyUpload: WeeklyUpload | null,
): AgencyImageMarker[] {
  const urls = weeklyUpload?.imageUrls ?? [];
  if (!raw.image_markers) return [];
  return raw.image_markers
    .filter((m) => m.image_index >= 0 && m.image_index < urls.length)
    .map((m) => ({
      marker: m.marker,
      imageUrl: urls[m.image_index],
      caption: m.caption ?? null,
      position: {
        paragraphIndex: m.paragraph_index ?? null,
        charOffset: m.char_offset ?? null,
        nodePath: null,
      },
    }));
}

async function realGenerate(input: GenerateInput): Promise<GenerateOutput> {
  const client = new Anthropic();
  const resp = await client.messages.create({
    model: GEN_MODEL,
    max_tokens: 4096,
    system: [{ type: "text", text: buildSystemPrompt(input), cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const tokensIn = resp.usage?.input_tokens ?? 0;
  const tokensOut = resp.usage?.output_tokens ?? 0;
  const cacheCreate = resp.usage?.cache_creation_input_tokens ?? 0;
  const cacheRead = resp.usage?.cache_read_input_tokens ?? 0;
  // eslint-disable-next-line no-console
  console.log(
    `[agency:ai:gen] model=${GEN_MODEL} channel=${input.channel} attempt=${input.attemptNumber} tokensIn=${tokensIn} tokensOut=${tokensOut} cacheCreate=${cacheCreate} cacheRead=${cacheRead}`,
  );

  const text = resp.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n");
  const raw = extractJson(text) as RawAiOutput;

  return {
    title: raw.title ?? null,
    body: raw.body,
    hashtags: raw.hashtags ?? [],
    imageMarkers: buildImageMarkers(raw, input.weeklyUpload),
    tokensIn,
    tokensOut,
    rawJson: raw,
  };
}

export async function generateContent(input: GenerateInput): Promise<GenerateOutput> {
  if (!AGENCY_AI_ENABLED) {
    return mockGenerate(input);
  }
  return realGenerate(input);
}

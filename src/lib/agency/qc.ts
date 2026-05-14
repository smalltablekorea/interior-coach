/**
 * QC (Quality Check) AI 레이어.
 *
 * - QC 모델: claude-haiku-4-5-20251001 (Q1=c)
 * - 통과 임계점: 80점 (Q2=b)
 * - AGENCY_AI_ENABLED=false면 mock (Q8=c)
 * - SEO는 AI 자체 판단 (Q7=a)
 */

import Anthropic from "@anthropic-ai/sdk";
import type { agencyClients } from "@/lib/db/schema";
import type { Channel } from "@/lib/agency/ai";
import { AGENCY_AI_ENABLED } from "@/lib/agency/ai";

export const QC_MODEL = "claude-haiku-4-5-20251001";
export const QC_THRESHOLD = 80;

type Client = typeof agencyClients.$inferSelect;

export interface QcInput {
  channel: Channel;
  client: Client;
  draft: { title: string | null; body: string; hashtags: string[] };
}

export interface QcOutput {
  score: number;
  passed: boolean;
  feedback: string;
  breakdown?: {
    tone?: number;
    factual?: number;
    seo?: number;
  };
  tokensIn: number;
  tokensOut: number;
}

interface RawQcOutput {
  tone_score: number;
  factual_score: number;
  seo_score: number;
  overall_score: number;
  feedback: string;
}

function buildSystemPrompt(channel: Channel): string {
  return [
    `당신은 인테리어 마케팅 콘텐츠의 품질 검수자입니다.`,
    `채널: ${channel === "naver_blog" ? "네이버 블로그" : channel === "threads" ? "Threads" : "Instagram"}`,
    ``,
    `다음 3개 축을 0~100점으로 평가합니다:`,
    `1. 톤 일치도 (tone_score): 브랜드 톤·키워드·타겟에 부합하는지`,
    `2. 사실성 (factual_score): 자재 단가/시공 정보 등 사실 관계가 합리적인지`,
    `3. SEO/유효성 (seo_score): 채널 특성에 맞는 분량/구성/해시태그/키워드 배치`,
    ``,
    `overall_score = (tone + factual + seo) / 3 (반올림 정수)`,
    `통과 임계점: overall_score >= ${QC_THRESHOLD}`,
    ``,
    `[출력 형식 — 반드시 이 JSON만]`,
    `{`,
    `  "tone_score": 0~100 정수,`,
    `  "factual_score": 0~100 정수,`,
    `  "seo_score": 0~100 정수,`,
    `  "overall_score": 0~100 정수,`,
    `  "feedback": "개선 포인트 한국어로 2~3문장. 미달 시 구체적 수정 방향 포함."`,
    `}`,
    ``,
    `JSON 외 다른 텍스트 출력 금지.`,
  ].join("\n");
}

function buildUserPrompt(input: QcInput): string {
  const brandTone =
    (input.client.brandTone as { description?: string; keywords?: string[] } | null) ?? null;
  return [
    `[브랜드 톤]`,
    `- 설명: ${brandTone?.description || "(미설정)"}`,
    `- 키워드: ${brandTone?.keywords?.join(", ") || "(미설정)"}`,
    `- 타겟: ${input.client.targetAudience || "(미설정)"}`,
    `- 카테고리: ${(input.client.categories as string[] | null)?.join(", ") || "(미설정)"}`,
    `- 지역: ${input.client.region || "(미설정)"}`,
    ``,
    `[검수 대상 콘텐츠]`,
    `제목: ${input.draft.title ?? "(없음)"}`,
    `해시태그: ${input.draft.hashtags.join(", ")}`,
    ``,
    `본문:`,
    input.draft.body,
  ].join("\n");
}

/* ──────────────────────────────── mock ──────────────────────────────── */

function mockQc(input: QcInput): QcOutput {
  // mock 모드는 항상 통과 처리 (85점)로 흐름 검증 가능하게.
  // 다만 본문이 비어있으면 0점.
  const len = input.draft.body.trim().length;
  if (len < 50) {
    return {
      score: 30,
      passed: false,
      feedback: "(mock) 본문이 너무 짧습니다. 50자 이상 작성해주세요.",
      breakdown: { tone: 30, factual: 30, seo: 30 },
      tokensIn: 0,
      tokensOut: 0,
    };
  }
  return {
    score: 85,
    passed: true,
    feedback: "(mock) 통과. AGENCY_AI_ENABLED=true 시 실제 Haiku 4.5로 평가.",
    breakdown: { tone: 85, factual: 85, seo: 85 },
    tokensIn: 0,
    tokensOut: 0,
  };
}

/* ──────────────────────────────── real ──────────────────────────────── */

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("QC 응답에서 JSON을 찾을 수 없습니다");
  return JSON.parse(match[0]);
}

async function realQc(input: QcInput): Promise<QcOutput> {
  const client = new Anthropic();
  const resp = await client.messages.create({
    model: QC_MODEL,
    max_tokens: 1024,
    system: buildSystemPrompt(input.channel),
    messages: [{ role: "user", content: buildUserPrompt(input) }],
  });

  const tokensIn = resp.usage?.input_tokens ?? 0;
  const tokensOut = resp.usage?.output_tokens ?? 0;
  // eslint-disable-next-line no-console
  console.log(
    `[agency:ai:qc] model=${QC_MODEL} channel=${input.channel} tokensIn=${tokensIn} tokensOut=${tokensOut}`,
  );

  const text = resp.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("\n");
  const raw = extractJson(text) as RawQcOutput;

  const score = Math.max(0, Math.min(100, Math.round(raw.overall_score)));
  return {
    score,
    passed: score >= QC_THRESHOLD,
    feedback: raw.feedback,
    breakdown: {
      tone: raw.tone_score,
      factual: raw.factual_score,
      seo: raw.seo_score,
    },
    tokensIn,
    tokensOut,
  };
}

export async function runQc(input: QcInput): Promise<QcOutput> {
  if (!AGENCY_AI_ENABLED) {
    return mockQc(input);
  }
  return realQc(input);
}

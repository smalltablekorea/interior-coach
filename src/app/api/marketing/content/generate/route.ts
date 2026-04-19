import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  marketingContent,
  sites,
  sitePhotos,
  estimates,
  estimateItems,
  constructionPhases,
} from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import Anthropic from "@anthropic-ai/sdk";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { enforceAiRateLimit } from "@/lib/api/ai-rate-limit";

function buildPrompt(
  channel: string,
  contentType: string,
  siteData: {
    site: Record<string, unknown> | null;
    photos: { before: unknown[]; during: unknown[]; after: unknown[] };
    items: unknown[];
    phases: unknown[];
  },
  additionalContext?: string
): string {
  // Build site context if available
  let siteContext = "";
  if (siteData.site) {
    const s = siteData.site;
    siteContext = `
[시공 현장 정보]
- 현장명: ${s.name || "미입력"}
- 주소: ${s.address || "미입력"}
- 건물유형: ${s.buildingType || "미입력"}
- 면적: ${s.areaPyeong ? `${s.areaPyeong}평` : "미입력"}
- 상태: ${s.status || "미입력"}
- 시공기간: ${s.startDate || "미정"} ~ ${s.endDate || "미정"}

[시공 사진]
- 시공 전(Before): ${siteData.photos.before.length}장
- 시공 중(During): ${siteData.photos.during.length}장
- 시공 후(After): ${siteData.photos.after.length}장

[견적 항목]
${siteData.items.length > 0 ? (siteData.items as Array<{ category: string; itemName: string }>).map((item) => `- ${item.category}: ${item.itemName}`).join("\n") : "- 견적 항목 없음"}

[공정 현황]
${siteData.phases.length > 0 ? (siteData.phases as Array<{ category: string; status: string; progress: number }>).map((phase) => `- ${phase.category}: ${phase.status} (${phase.progress}%)`).join("\n") : "- 공정 정보 없음"}
`;
  }

  const additionalSection = additionalContext
    ? `\n[추가 요청사항]\n${additionalContext}\n`
    : "";

  const channelPrompts: Record<string, string> = {
    naver_blog: `당신은 인테리어 업체의 블로그 마케팅 전문가입니다. 네이버 블로그에 올릴 시공사례 포스트를 작성해주세요.

${siteContext}${additionalSection}

콘텐츠 유형: ${contentType}

작성 가이드라인:
- 2000~3000자 분량으로 작성
- SEO 최적화를 위해 핵심 키워드를 자연스럽게 포함
- H2, H3 구조를 활용한 가독성 높은 구성
- 시공 전/후 비교를 강조하는 스토리텔링
- 고객이 공감할 수 있는 before/after 설명
- 전문성과 신뢰감을 드러내는 톤
- 지역명 + 평수 + 인테리어 스타일 키워드 포함

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "title": "블로그 포스트 제목",
  "body": "블로그 본문 (마크다운 형식)",
  "hashtags": ["해시태그1", "해시태그2", ...],
  "keywords": ["SEO키워드1", "SEO키워드2", ...]
}`,

    threads: `인테리어 업체의 스레드 포스트를 작성해주세요.

${siteContext}${additionalSection}

콘텐츠 유형: ${contentType}

작성 가이드라인:
- 500자 이내로 간결하게 작성
- 첫 줄은 반드시 훅(관심 유발)으로 시작
- 시공 사례의 핵심 포인트를 압축적으로 전달
- 이모지를 적절히 활용
- 댓글 유도하는 질문이나 CTA 포함
- 캐주얼하면서도 전문적인 톤

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "title": "포스트 한줄 요약",
  "body": "스레드 본문",
  "hashtags": ["해시태그1", "해시태그2", ...],
  "keywords": ["키워드1", "키워드2", ...]
}`,

    instagram: `인스타그램 피드용 캡션을 작성해주세요.

${siteContext}${additionalSection}

콘텐츠 유형: ${contentType}

작성 가이드라인:
- 감성적이면서 정보를 담은 톤
- 첫 줄에 시선을 사로잡는 문구
- 시공 과정과 결과를 매력적으로 설명
- 줄바꿈을 활용한 가독성 확보
- 해시태그 20~30개 포함 (인테리어 관련 + 지역 + 스타일)
- CTA: 문의 유도 문구 포함

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "title": "캡션 한줄 요약",
  "body": "인스타그램 캡션 본문",
  "hashtags": ["해시태그1", "해시태그2", ...],
  "keywords": ["키워드1", "키워드2", ...]
}`,

    youtube: `유튜브 영상의 제목, 설명, 태그를 작성해주세요.

${siteContext}${additionalSection}

콘텐츠 유형: ${contentType}

작성 가이드라인:
- 검색 최적화(SEO)에 집중
- 제목: 클릭을 유도하면서 핵심 키워드 포함 (60자 이내)
- 설명: 영상 내용 요약 + 타임스탬프 예시 + 채널 소개 + CTA
- 태그: 관련 키워드 15~20개
- 썸네일 텍스트 제안 포함

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "title": "유튜브 영상 제목",
  "body": "영상 설명 본문",
  "hashtags": ["태그1", "태그2", ...],
  "keywords": ["SEO키워드1", "SEO키워드2", ...]
}`,
  };

  return (
    channelPrompts[channel] ||
    `인테리어 업체의 마케팅 콘텐츠를 작성해주세요.

${siteContext}${additionalSection}

채널: ${channel}
콘텐츠 유형: ${contentType}

반드시 아래 JSON 형식으로만 응답해주세요:
{
  "title": "콘텐츠 제목",
  "body": "콘텐츠 본문",
  "hashtags": ["해시태그1", "해시태그2", ...],
  "keywords": ["키워드1", "키워드2", ...]
}`
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId; const uid = auth.userId;

  // Plan-aware rate limiting (AI 과금 폭탄 방어 - AI-21)
  const gate = await enforceAiRateLimit(uid);
  if (!gate.ok) return gate.response;

  try {
    const body = await request.json();
    const { channel, siteId, contentType, additionalContext } = body;

    if (!channel || !contentType) {
      return err("channel과 contentType은 필수입니다.");
    }

    // Fetch site data if siteId is provided
    const siteData: {
      site: Record<string, unknown> | null;
      photos: { before: unknown[]; during: unknown[]; after: unknown[] };
      items: unknown[];
      phases: unknown[];
    } = {
      site: null,
      photos: { before: [], during: [], after: [] },
      items: [],
      phases: [],
    };

    if (siteId) {
      // Fetch site info (scoped to user)
      const [site] = await db
        .select()
        .from(sites)
        .where(and(eq(sites.id, siteId), workspaceFilter(sites.workspaceId, sites.userId, wid, uid)))
        .limit(1);

      if (site) {
        siteData.site = site as unknown as Record<string, unknown>;

        // Fetch photos categorized by phase
        const photos = await db
          .select()
          .from(sitePhotos)
          .where(eq(sitePhotos.siteId, siteId))
          .orderBy(desc(sitePhotos.createdAt));

        for (const photo of photos) {
          if (photo.phase === "before") siteData.photos.before.push(photo);
          else if (photo.phase === "during") siteData.photos.during.push(photo);
          else if (photo.phase === "after") siteData.photos.after.push(photo);
        }

        // Fetch estimate items
        const siteEstimates = await db
          .select({ id: estimates.id })
          .from(estimates)
          .where(eq(estimates.siteId, siteId))
          .orderBy(desc(estimates.createdAt))
          .limit(1);

        if (siteEstimates.length > 0) {
          siteData.items = await db
            .select({
              category: estimateItems.category,
              itemName: estimateItems.itemName,
              unit: estimateItems.unit,
              quantity: estimateItems.quantity,
              amount: estimateItems.amount,
            })
            .from(estimateItems)
            .where(eq(estimateItems.estimateId, siteEstimates[0].id));
        }

        // Fetch construction phases
        siteData.phases = await db
          .select({
            category: constructionPhases.category,
            status: constructionPhases.status,
            progress: constructionPhases.progress,
            plannedStart: constructionPhases.plannedStart,
            plannedEnd: constructionPhases.plannedEnd,
          })
          .from(constructionPhases)
          .where(eq(constructionPhases.siteId, siteId))
          .orderBy(constructionPhases.sortOrder);
      }
    }

    // Build prompt
    const prompt = buildPrompt(channel, contentType, siteData, additionalContext);

    // Call Anthropic Claude API
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    // Extract text from the response
    const responseText =
      msg.content[0].type === "text" ? msg.content[0].text : "";

    // Parse JSON from response (handle markdown code blocks)
    let parsed: { title: string; body: string; hashtags: string[]; keywords: string[] };
    try {
      // Try to extract JSON from markdown code block first
      const jsonMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
      const jsonStr = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      // If JSON parsing fails, use the raw text
      parsed = {
        title: `${channel} 콘텐츠`,
        body: responseText,
        hashtags: [],
        keywords: [],
      };
    }

    // Save to marketingContent table
    const [savedContent] = await db
      .insert(marketingContent)
      .values({
        userId: uid,
        workspaceId: wid,
        siteId: siteId || null,
        title: parsed.title,
        body: parsed.body,
        contentType,
        tags: parsed.keywords || null,
        category: "시공사례",
        targetChannels: [channel],
        aiGenerated: true,
        aiPrompt: prompt,
      })
      .returning();

    return ok({
      content: savedContent,
      generated: {
        title: parsed.title,
        body: parsed.body,
        hashtags: parsed.hashtags,
        keywords: parsed.keywords,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

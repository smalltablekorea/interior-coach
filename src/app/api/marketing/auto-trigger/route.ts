import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import {
  constructionPhases,
  sites,
  sitePhotos,
  marketingContent,
  marketingPosts,
  threadsAutoRules,
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, err, serverError } from "@/lib/api/response";

/**
 * POST /api/marketing/auto-trigger
 *
 * Called when a construction phase completes or a site status changes.
 * Automatically generates and queues marketing content for configured channels.
 *
 * Body: { siteId, triggerType: "phase_complete" | "site_complete" | "photo_upload" }
 */
export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    const { siteId, triggerType, phaseId } = await request.json();

    if (!siteId || !triggerType) {
      return err("siteId와 triggerType이 필요합니다");
    }

    // Get site info
    const [site] = await db
      .select()
      .from(sites)
      .where(
        and(
          eq(sites.id, siteId),
          workspaceFilter(sites.workspaceId, sites.userId, wid, uid)
        )
      )
      .limit(1);

    if (!site) {
      return err("현장을 찾을 수 없습니다");
    }

    // Get site photos (after photos preferred for completion posts)
    const photos = await db
      .select()
      .from(sitePhotos)
      .where(eq(sitePhotos.siteId, siteId))
      .orderBy(desc(sitePhotos.createdAt))
      .limit(10);

    const afterPhotos = photos.filter(
      (p) => p.category === "after" || p.category === "완공"
    );
    const duringPhotos = photos.filter(
      (p) => p.category === "during" || p.category === "시공중"
    );
    const bestPhotos = afterPhotos.length > 0 ? afterPhotos : duringPhotos.length > 0 ? duringPhotos : photos;

    // Get phase info if provided
    let phaseName = "";
    if (phaseId) {
      const [phase] = await db
        .select()
        .from(constructionPhases)
        .where(eq(constructionPhases.id, phaseId))
        .limit(1);
      if (phase) phaseName = phase.category;
    }

    // Check active auto-rules for this trigger
    const autoRules = await db
      .select()
      .from(threadsAutoRules)
      .where(
        and(
          workspaceFilter(
            threadsAutoRules.workspaceId,
            threadsAutoRules.userId,
            wid,
            uid
          ),
          eq(threadsAutoRules.isActive, true)
        )
      );

    const matchingRules = autoRules.filter((r) => {
      if (triggerType === "phase_complete" && r.type === "시공사진자동")
        return true;
      if (triggerType === "site_complete" && r.type === "시공완료자동")
        return true;
      return false;
    });

    // Generate content drafts for each matching channel
    const results: { channel: string; postId: string; status: string }[] = [];

    // Auto-generate Instagram post for construction completions
    if (
      triggerType === "site_complete" ||
      triggerType === "phase_complete"
    ) {
      const channels = triggerType === "site_complete"
        ? ["instagram", "threads", "x"]
        : ["instagram"];

      for (const channel of channels) {
        const caption = generateAutoCaption(
          channel,
          site.name,
          site.buildingType,
          site.areaPyeong,
          phaseName,
          triggerType
        );

        // Create content record
        const [content] = await db
          .insert(marketingContent)
          .values({
            userId: uid,
            workspaceId: wid,
            siteId,
            targetChannels: [channel],
            contentType:
              triggerType === "site_complete" ? "시공완료" : "시공사진",
            title: `${site.name} ${phaseName || "시공완료"}`,
            body: caption.body,
            tags: caption.hashtags,
            status: "draft",
          })
          .returning();

        // Create scheduled post
        const [post] = await db
          .insert(marketingPosts)
          .values({
            userId: uid,
            workspaceId: wid,
            contentId: content.id,
            channel,
            body: `${caption.body}\n\n${caption.hashtags.map((h: string) => `#${h}`).join(" ")}`,
            hashtags: caption.hashtags,
            mediaUrls: bestPhotos.slice(0, 4).map((p) => p.url),
            status: "draft",
          })
          .returning();

        results.push({
          channel,
          postId: post.id,
          status: "draft",
        });
      }
    }

    // Update auto-rule lastTriggeredAt
    for (const rule of matchingRules) {
      await db
        .update(threadsAutoRules)
        .set({ lastTriggeredAt: new Date() })
        .where(eq(threadsAutoRules.id, rule.id));
    }

    return ok({
      triggered: results.length,
      posts: results,
      message:
        results.length > 0
          ? `${results.length}개 채널에 자동 포스트 초안이 생성되었습니다`
          : "해당 트리거에 매칭되는 자동화 규칙이 없습니다",
    });
  } catch (error) {
    return serverError(error);
  }
}

function generateAutoCaption(
  channel: string,
  siteName: string,
  buildingType: string | null,
  areaPyeong: number | null,
  phaseName: string,
  triggerType: string
): { body: string; hashtags: string[] } {
  const typeLabel = buildingType || "인테리어";
  const areaLabel = areaPyeong ? `${areaPyeong}평` : "";

  // Base hashtags by category
  const baseHashtags = [
    "인테리어",
    "인테리어시공",
    "스몰테이블디자인",
    "인테리어업체",
    "리모델링",
  ];

  // Add building-type specific hashtags
  if (buildingType) {
    const typeHashtags: Record<string, string[]> = {
      아파트: ["아파트인테리어", "아파트리모델링", "아파트시공"],
      빌라: ["빌라인테리어", "빌라리모델링"],
      오피스텔: ["오피스텔인테리어", "원룸인테리어"],
      상가: ["상가인테리어", "매장인테리어", "상업인테리어"],
      주택: ["주택인테리어", "단독주택인테리어"],
    };
    baseHashtags.push(...(typeHashtags[buildingType] || []));
  }

  // Area-based hashtags
  if (areaPyeong) {
    if (areaPyeong <= 20) baseHashtags.push("소형인테리어", "원룸인테리어");
    else if (areaPyeong <= 30)
      baseHashtags.push("20평대인테리어", "30평대인테리어");
    else if (areaPyeong <= 40) baseHashtags.push("30평대인테리어");
    else baseHashtags.push("대형인테리어", "40평대인테리어");
  }

  // Phase-specific hashtags
  if (phaseName) {
    const phaseHashtags: Record<string, string[]> = {
      철거: ["철거공사", "해체공사"],
      목공: ["목공사", "인테리어목공"],
      전기: ["전기공사", "조명시공"],
      설비: ["설비공사", "배관공사"],
      타일: ["타일시공", "욕실타일"],
      도배: ["도배", "벽지시공"],
      마루: ["마루시공", "바닥재"],
      가구: ["붙박이장", "맞춤가구"],
      조명: ["조명설치", "인테리어조명"],
    };
    baseHashtags.push(...(phaseHashtags[phaseName] || [phaseName + "시공"]));
  }

  // Channel-specific formatting
  if (channel === "x") {
    // X: shorter format, max 280 chars
    const body =
      triggerType === "site_complete"
        ? `✨ ${siteName} ${typeLabel} ${areaLabel} 시공 완료!\n\n정성을 다한 결과물, 확인해 보세요.`
        : `🔨 ${siteName} ${phaseName} 공정 완료\n\n${typeLabel} ${areaLabel} 현장 진행 중입니다.`;
    return { body, hashtags: baseHashtags.slice(0, 5) };
  }

  if (channel === "threads") {
    const body =
      triggerType === "site_complete"
        ? `✨ ${siteName} ${typeLabel} ${areaLabel} 시공이 완료되었습니다.\n\n고객님의 꿈꾸던 공간이 현실이 되었습니다.\n공간의 변화, 사진으로 확인해 보세요! 🏠`
        : `🔨 ${siteName} ${phaseName} 공정이 완료되었습니다.\n\n${typeLabel} ${areaLabel} 현장, 한 단계 더 진행됩니다.\n완성을 향해 차근차근! 💪`;
    return { body, hashtags: baseHashtags.slice(0, 10) };
  }

  // Instagram: richest format
  const body =
    triggerType === "site_complete"
      ? `✨ ${siteName} ${typeLabel} ${areaLabel} 시공 완료 ✨\n\n고객님의 꿈꾸던 공간이 현실이 되었습니다.\n\n🏠 ${typeLabel}${areaLabel ? ` ${areaLabel}` : ""}\n📍 스몰테이블디자인그룹\n\n\"공간이 바뀌면, 삶이 바뀝니다.\"\n\n시공 상담 문의는 DM 또는 프로필 링크로! 📩`
      : `🔨 ${siteName} ${phaseName} 공정 완료\n\n${typeLabel}${areaLabel ? ` ${areaLabel}` : ""} 현장에서\n${phaseName} 작업이 마무리되었습니다.\n\n완성을 향해 한 걸음 더! 💪\n\n시공 과정이 궁금하시다면 팔로우 해주세요 👀`;
  return { body, hashtags: baseHashtags.slice(0, 20) };
}

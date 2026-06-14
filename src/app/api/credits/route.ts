import { db } from "@/lib/db";
import { analysisCredits } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { isPromoEligibleUser, startTrialForNewUser } from "@/lib/subscription/trial";
import { isFreePeriodActive } from "@/lib/subscription/free-period";

/** GET: 분석권 잔여 횟수 조회 */
export async function GET() {
  const auth = await requireWorkspaceAuth("settings", "read");
  if (!auth.ok) return auth.response;

  try {
    // 전면 무료화 기간: 분석권 무제한으로 응답 (실제 행은 조회·갱신 안 함)
    if (isFreePeriodActive()) {
      return ok({ total: 0, used: 0, remaining: 0, unlimited: true });
    }

    let [row] = await db
      .select()
      .from(analysisCredits)
      .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, auth.workspaceId, auth.userId))
      .limit(1);

    // 안전망: 가입 시 hook + 명시적 호출이 모두 실패한 프로모 대상자도
    // 첫 분석권 조회 시 자동 부여하여 복구한다. (멱등)
    // 가입 시각이 프로모 윈도우 안에 있는 사용자만 대상 — 기존 가입자 보호.
    if (!row) {
      try {
        if (await isPromoEligibleUser(auth.userId)) {
          const grant = await startTrialForNewUser(auth.userId);
          if (grant.creditsCreated) {
            console.log("[Credits] Lazy grant", { userId: auth.userId, ...grant });
            [row] = await db
              .select()
              .from(analysisCredits)
              .where(workspaceFilter(analysisCredits.workspaceId, analysisCredits.userId, auth.workspaceId, auth.userId))
              .limit(1);
          }
        }
      } catch (e) {
        console.error("[Credits] Lazy grant failed", auth.userId, e);
      }
    }

    if (!row) {
      return ok({ total: 0, used: 0, remaining: 0 });
    }

    return ok({
      total: row.totalCredits,
      used: row.usedCredits,
      remaining: row.totalCredits - row.usedCredits,
    });
  } catch (error) {
    return serverError(error);
  }
}

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";
import { issueBillingKey, generateCustomerKey } from "@/lib/toss";

/**
 * POST /api/billing/billing-key
 * 프론트엔드에서 Toss SDK로 카드 인증 후 authKey를 받아서
 * 빌링키를 발급받고 구독 정보에 저장
 */
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const { authKey } = await request.json();

    if (!authKey) return err("authKey가 필요합니다");

    const customerKey = generateCustomerKey(auth.userId);

    // Toss에 빌링키 발급 요청
    const result = await issueBillingKey({ authKey, customerKey });

    if (!result.ok) {
      return err(`빌링키 발급 실패: ${result.error.message}`);
    }

    const { billingKey, card } = result.data;

    // 기존 구독 확인
    const existing = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
      .limit(1);

    if (existing.length > 0) {
      // 기존 구독에 빌링키 업데이트
      await db
        .update(subscriptions)
        .set({
          tossBillingKey: billingKey,
          tossCustomerKey: customerKey,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existing[0].id));
    } else {
      // 새 구독 생성 (free 상태 + 빌링키)
      await db.insert(subscriptions).values({
        userId: auth.userId,
        plan: "free",
        billingCycle: "monthly",
        status: "active",
        tossBillingKey: billingKey,
        tossCustomerKey: customerKey,
      });
    }

    return ok({
      billingKey,
      card: {
        number: card.number,
        cardType: card.cardType,
        ownerType: card.ownerType,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

/**
 * DELETE /api/billing/billing-key
 * 빌링키(등록 카드) 삭제
 */
export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, auth.userId))
      .limit(1);

    if (!sub || !sub.tossBillingKey) {
      return err("등록된 결제 수단이 없습니다");
    }

    // 유료 플랜 사용 중이면 삭제 불가
    if (sub.plan !== "free" && sub.status === "active") {
      return err("유료 플랜 해지 후 카드를 삭제할 수 있습니다");
    }

    await db
      .update(subscriptions)
      .set({
        tossBillingKey: null,
        tossCustomerKey: null,
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.id, sub.id));

    return ok({ message: "결제 수단이 삭제되었습니다" });
  } catch (error) {
    return serverError(error);
  }
}

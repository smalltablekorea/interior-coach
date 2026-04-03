import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { db } from "@/lib/db";
import { sites, constructionPhases, estimates, expenses, contracts, contractPayments } from "@/lib/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { ok, forbidden, serverError } from "@/lib/api/response";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth("sites", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  const { id: siteId } = await params;

  try {
    // 본인 현장인지 확인
    const [site] = await db
      .select({ id: sites.id })
      .from(sites)
      .where(and(eq(sites.id, siteId), workspaceFilter(sites.workspaceId, sites.userId, wid, uid)));
    if (!site) {
      return forbidden("접근 권한이 없습니다");
    }

  // 1. 공정 진행률 (30점)
  const phases = await db
    .select({
      progress: constructionPhases.progress,
      status: constructionPhases.status,
      plannedEnd: constructionPhases.plannedEnd,
      actualEnd: constructionPhases.actualEnd,
    })
    .from(constructionPhases)
    .where(eq(constructionPhases.siteId, siteId));

  let progressScore = 15; // default when no phases
  if (phases.length > 0) {
    const avgProgress = phases.reduce((s, p) => s + p.progress, 0) / phases.length;
    progressScore = Math.round((avgProgress / 100) * 30);

    // 지연 패널티: 예정 종료일 지난 미완료 공정
    const today = new Date().toISOString().split("T")[0];
    const delayed = phases.filter(
      (p) => p.plannedEnd && p.plannedEnd < today && p.status !== "완료"
    );
    progressScore = Math.max(0, progressScore - delayed.length * 3);
  }

  // 2. 예산 건전성 (30점)
  const [latestEstimate] = await db
    .select({ id: estimates.id, totalAmount: estimates.totalAmount })
    .from(estimates)
    .where(eq(estimates.siteId, siteId))
    .orderBy(sql`${estimates.createdAt} DESC`)
    .limit(1);

  const expenseRows = await db
    .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(eq(expenses.siteId, siteId));

  const totalExpense = expenseRows[0]?.total || 0;
  const totalBudget = latestEstimate?.totalAmount || 0;

  let budgetScore = 20; // default when no budget
  if (totalBudget > 0) {
    const ratio = totalExpense / totalBudget;
    if (ratio <= 0.8) budgetScore = 30;
    else if (ratio <= 0.9) budgetScore = 25;
    else if (ratio <= 1.0) budgetScore = 20;
    else if (ratio <= 1.1) budgetScore = 10;
    else budgetScore = 0;
  }

  // 3. 수금 상태 (20점)
  const payments = await db
    .select({
      status: contractPayments.status,
      dueDate: contractPayments.dueDate,
      amount: contractPayments.amount,
    })
    .from(contractPayments)
    .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
    .where(eq(contracts.siteId, siteId));

  let paymentScore = 10; // default when no payments
  if (payments.length > 0) {
    const total = payments.reduce((s, p) => s + p.amount, 0);
    const paid = payments.filter((p) => p.status === "완납").reduce((s, p) => s + p.amount, 0);
    const paidRatio = total > 0 ? paid / total : 0;

    // 기한 내 수금
    const today = new Date().toISOString().split("T")[0];
    const overdue = payments.filter(
      (p) => p.status === "미수" && p.dueDate && p.dueDate < today
    );
    const overduePenalty = overdue.length * 3;

    paymentScore = Math.max(0, Math.round(paidRatio * 20) - overduePenalty);
  }

  // 4. 이슈/응답 (20점) - Phase 2까지 placeholder
  const issueScore = 10;
  const responseScore = 10;

  const totalScore = progressScore + budgetScore + paymentScore + issueScore + responseScore;

    return ok({
      totalScore,
      breakdown: {
        progress: { score: progressScore, max: 30, label: "공정 진행률" },
        budget: { score: budgetScore, max: 30, label: "예산 건전성" },
        payment: { score: paymentScore, max: 20, label: "수금 상태" },
        issue: { score: issueScore + responseScore, max: 20, label: "이슈/응답" },
      },
      meta: {
        phaseCount: phases.length,
        avgProgress: phases.length > 0 ? Math.round(phases.reduce((s, p) => s + p.progress, 0) / phases.length) : 0,
        budgetRatio: totalBudget > 0 ? Math.round((totalExpense / totalBudget) * 100) : null,
        paymentCount: payments.length,
      },
    });
  } catch (error) {
    return serverError(error);
  }
}

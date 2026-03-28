import { db } from "@/lib/db";
import { sites, constructionPhases, estimates, expenses, contracts, contractPayments } from "@/lib/db/schema";
import { eq, sql, and, inArray } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";

export async function GET() {
  const auth = await requireWorkspaceAuth("dashboard", "read");
  if (!auth.ok) return auth.response;
  const wid = auth.workspaceId;
  const uid = auth.userId;

  try {
    // Get active sites (시공중) — filtered by workspace
    const activeSites = await db
      .select({ id: sites.id, name: sites.name, status: sites.status })
      .from(sites)
      .where(
        and(
          workspaceFilter(sites.workspaceId, sites.userId, wid, uid),
          inArray(sites.status, ["시공중", "계약완료"])
        )
      );

    const scores = await Promise.all(
      activeSites.map(async (site) => {
        // Progress score (30)
        const phases = await db
          .select({ progress: constructionPhases.progress, status: constructionPhases.status, plannedEnd: constructionPhases.plannedEnd })
          .from(constructionPhases)
          .where(eq(constructionPhases.siteId, site.id));

        let progressScore = 15;
        if (phases.length > 0) {
          const avg = phases.reduce((s, p) => s + p.progress, 0) / phases.length;
          progressScore = Math.round((avg / 100) * 30);
          const today = new Date().toISOString().split("T")[0];
          const delayed = phases.filter((p) => p.plannedEnd && p.plannedEnd < today && p.status !== "완료");
          progressScore = Math.max(0, progressScore - delayed.length * 3);
        }

        // Budget score (30)
        const [est] = await db
          .select({ totalAmount: estimates.totalAmount })
          .from(estimates)
          .where(eq(estimates.siteId, site.id))
          .orderBy(sql`${estimates.createdAt} DESC`)
          .limit(1);

        const [exp] = await db
          .select({ total: sql<number>`COALESCE(SUM(${expenses.amount}), 0)` })
          .from(expenses)
          .where(eq(expenses.siteId, site.id));

        const budget = est?.totalAmount || 0;
        const spent = exp?.total || 0;
        let budgetScore = 20;
        if (budget > 0) {
          const ratio = spent / budget;
          if (ratio <= 0.8) budgetScore = 30;
          else if (ratio <= 0.9) budgetScore = 25;
          else if (ratio <= 1.0) budgetScore = 20;
          else if (ratio <= 1.1) budgetScore = 10;
          else budgetScore = 0;
        }

        // Payment score (20)
        const payments = await db
          .select({ status: contractPayments.status, dueDate: contractPayments.dueDate, amount: contractPayments.amount })
          .from(contractPayments)
          .innerJoin(contracts, eq(contractPayments.contractId, contracts.id))
          .where(eq(contracts.siteId, site.id));

        let paymentScore = 10;
        if (payments.length > 0) {
          const total = payments.reduce((s, p) => s + p.amount, 0);
          const paid = payments.filter((p) => p.status === "완납").reduce((s, p) => s + p.amount, 0);
          const ratio = total > 0 ? paid / total : 0;
          const today = new Date().toISOString().split("T")[0];
          const overdue = payments.filter((p) => p.status === "미수" && p.dueDate && p.dueDate < today);
          paymentScore = Math.max(0, Math.round(ratio * 20) - overdue.length * 3);
        }

        const issueScore = 20; // placeholder
        const totalScore = progressScore + budgetScore + paymentScore + issueScore;

        return {
          siteId: site.id,
          siteName: site.name,
          siteStatus: site.status,
          totalScore,
          progress: progressScore,
          budget: budgetScore,
          payment: paymentScore,
          issue: issueScore,
        };
      })
    );

    return ok(scores);
  } catch (error) {
    return serverError(error);
  }
}

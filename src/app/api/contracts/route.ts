import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { contracts, contractPayments, sites } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { ok, serverError } from "@/lib/api/response";
import { validateBody, contractSchema } from "@/lib/api/validate";
import { parsePagination, buildPaginationMeta, countSql } from "@/lib/api/query-helpers";
import { z } from "zod";

const contractCreateSchema = contractSchema.extend({
  payments: z.array(z.object({
    type: z.string().min(1),
    amount: z.number().min(0),
    dueDate: z.string().nullable().optional(),
  })).optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  try {
    const pagination = parsePagination(request);
    const where = and(workspaceFilter(contracts.workspaceId, contracts.userId, auth.workspaceId, auth.userId), isNull(contracts.deletedAt));

    const [{ count: total }] = await db
      .select({ count: countSql() })
      .from(contracts)
      .where(where);

    const rows = await db
      .select({
        id: contracts.id,
        contractAmount: contracts.contractAmount,
        contractDate: contracts.contractDate,
        memo: contracts.memo,
        siteName: sites.name,
        siteId: contracts.siteId,
        createdAt: contracts.createdAt,
      })
      .from(contracts)
      .leftJoin(sites, eq(contracts.siteId, sites.id))
      .where(where)
      .orderBy(desc(contracts.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset);

    const result = await Promise.all(
      rows.map(async (c) => {
        const pays = await db
          .select({
            id: contractPayments.id,
            type: contractPayments.type,
            amount: contractPayments.amount,
            dueDate: contractPayments.dueDate,
            paidDate: contractPayments.paidDate,
            status: contractPayments.status,
          })
          .from(contractPayments)
          .where(eq(contractPayments.contractId, c.id));
        return { ...c, payments: pays };
      })
    );

    return ok(result, buildPaginationMeta(total, pagination));
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const validation = await validateBody(request, contractCreateSchema);
  if (!validation.ok) return validation.response;

  try {
    const { payments, ...contractData } = validation.data;

    const [row] = await db
      .insert(contracts)
      .values({
        userId: auth.userId,
        workspaceId: auth.workspaceId,
        siteId: contractData.siteId ?? null,
        estimateId: contractData.estimateId ?? null,
        contractAmount: contractData.contractAmount,
        contractDate: contractData.contractDate ?? null,
        memo: contractData.memo ?? null,
      })
      .returning();

    if (payments && payments.length > 0) {
      await db.insert(contractPayments).values(
        payments.map((p) => ({
          contractId: row.id,
          type: p.type,
          amount: p.amount,
          dueDate: p.dueDate ?? null,
          status: "미수" as const,
        }))
      );
    }

    return ok(row);
  } catch (error) {
    return serverError(error);
  }
}

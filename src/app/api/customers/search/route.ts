import { NextRequest } from "next/server";
import { and, desc, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { customers } from "@/lib/db/schema";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { searchPattern } from "@/lib/api/query-helpers";
import { ok, serverError } from "@/lib/api/response";

/**
 * GET /api/customers/search
 *   견적/현장 작성 시 고객 자동완성용. 페이지네이션 없는 최대 limit개 (기본 10) 결과.
 *   /api/customers (목록·페이지) 와 분리해 가볍게 — 폼 입력 키마다 호출되므로 응답 필드 최소화.
 *
 *   Query:
 *     q       검색어 — name 또는 phone 부분일치 (필수, 최소 1자)
 *     limit   최대 결과 (기본 10, 최대 30)
 *     exclude 제외할 상태(콤마 구분) — 예) "상담중단/취소"
 *
 *   Response: Array<{ id, name, phone, status, address }>
 *     status 는 칩 색상 표시용으로만 노출. address 는 1-pass 자동채움 hint 용.
 */
export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceAuth("customers", "read");
  if (!auth.ok) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    if (!q) return ok([]);

    const limitRaw = parseInt(searchParams.get("limit") ?? "10", 10);
    const limit = Math.min(Math.max(Number.isFinite(limitRaw) ? limitRaw : 10, 1), 30);

    const exclude = (searchParams.get("exclude") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const conditions = [
      workspaceFilter(customers.workspaceId, customers.userId, auth.workspaceId, auth.userId),
      isNull(customers.deletedAt),
      or(
        sql`${customers.name} ILIKE ${searchPattern(q)}`,
        sql`${customers.phone} ILIKE ${searchPattern(q)}`,
      ),
    ];

    for (const s of exclude) {
      conditions.push(ne(customers.status, s));
    }

    const rows = await db
      .select({
        id: customers.id,
        name: customers.name,
        phone: customers.phone,
        status: customers.status,
        address: customers.address,
      })
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.updatedAt))
      .limit(limit);

    return ok(rows);
  } catch (e) {
    return serverError(e);
  }
}

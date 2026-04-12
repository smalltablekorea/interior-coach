import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { estimates, estimateItems, sites, customers } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { workspaceFilter } from "@/lib/workspace/query-helpers";
import { notFound, err } from "@/lib/api/response";

// CSV(Excel 호환) 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireWorkspaceAuth();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const format = new URL(request.url).searchParams.get("format") || "csv";

  if (format !== "csv") return err("현재 CSV 형식만 지원됩니다.");

  const [row] = await db
    .select({
      id: estimates.id,
      totalAmount: estimates.totalAmount,
      profitRate: estimates.profitRate,
      overheadRate: estimates.overheadRate,
      vatEnabled: estimates.vatEnabled,
      metadata: estimates.metadata,
      siteName: sites.name,
      customerName: customers.name,
      createdAt: estimates.createdAt,
    })
    .from(estimates)
    .leftJoin(sites, eq(estimates.siteId, sites.id))
    .leftJoin(customers, eq(sites.customerId, customers.id))
    .where(
      and(
        eq(estimates.id, id),
        workspaceFilter(estimates.workspaceId, estimates.userId, auth.workspaceId, auth.userId),
        isNull(estimates.deletedAt)
      )
    );

  if (!row) return notFound("견적을 찾을 수 없습니다");

  const items = await db
    .select()
    .from(estimateItems)
    .where(eq(estimateItems.estimateId, id))
    .orderBy(estimateItems.sortOrder);

  const meta = (row.metadata as Record<string, unknown>) || {};
  const siteName = row.siteName || (meta.title as string) || "견적서";

  // BOM + CSV 생성 (한글 호환)
  const BOM = "\uFEFF";
  const lines: string[] = [];

  // 헤더
  lines.push(`견적서 - ${siteName}`);
  lines.push(`고객명,${row.customerName || (meta.clientName as string) || ""}`);
  lines.push(`작성일,${row.createdAt?.toLocaleDateString("ko-KR") || ""}`);
  lines.push(`총액,"${(row.totalAmount ?? 0).toLocaleString()}원"`);
  lines.push("");
  lines.push("공종,항목명,단위,수량,단가,금액,비고");

  for (const item of items) {
    const cols = [
      escapeCsv(item.category),
      escapeCsv(item.itemName),
      escapeCsv(item.unit || "식"),
      String(item.quantity ?? 1),
      `"${(item.unitPrice ?? 0).toLocaleString()}"`,
      `"${(item.amount ?? 0).toLocaleString()}"`,
      escapeCsv(item.memo || ""),
    ];
    lines.push(cols.join(","));
  }

  // 합계
  lines.push("");
  const directTotal = items.reduce((s, i) => s + (i.amount ?? 0), 0);
  lines.push(`,,,,공사비 합계,"${directTotal.toLocaleString()}",`);

  if (row.overheadRate && row.overheadRate > 0) {
    const overhead = Math.round(directTotal * (row.overheadRate / 100));
    lines.push(`,,,,경비(${row.overheadRate}%),"${overhead.toLocaleString()}",`);
  }
  if (row.profitRate && row.profitRate > 0) {
    const profit = Math.round(directTotal * (row.profitRate / 100));
    lines.push(`,,,,이윤(${row.profitRate}%),"${profit.toLocaleString()}",`);
  }
  if (row.vatEnabled) {
    lines.push(`,,,,부가세(10%),"${Math.round((row.totalAmount ?? 0) / 11).toLocaleString()}",`);
  }
  lines.push(`,,,,총 합계,"${(row.totalAmount ?? 0).toLocaleString()}",`);

  const csv = BOM + lines.join("\n");
  const fileName = `견적서_${siteName}_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
    },
  });
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

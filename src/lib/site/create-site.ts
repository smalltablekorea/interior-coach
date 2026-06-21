import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { withTransaction, type TxClient } from "@/lib/db/tx";
import {
  contracts,
  customers,
  constructionPhases,
  paymentSplits,
  siteSchedules,
  sites,
} from "@/lib/db/schema";
import { daysForTrade, scaleDaysByArea, tasksForTrade } from "@/lib/site/trade-mapping";
import {
  validatePaymentSplits,
  paymentSplitInputSchema,
} from "@/lib/site/payment-splits";

// 입력 스키마 — 폼/서버 액션 공용.
export const createSiteInputSchema = z.object({
  // 현장
  name: z.string().trim().min(1, "현장명을 입력해주세요"),
  address: z.string().trim().optional().nullable(),
  areaPyeong: z.number().positive().optional().nullable(),
  scope: z.string().trim().optional().nullable(),
  budget: z.number().int().nonnegative().optional().nullable(),
  startDate: z.string().min(1, "착수일을 입력해주세요"),
  endDate: z.string().optional().nullable(),
  trades: z.array(z.string().min(1)).min(1, "공종을 하나 이상 선택해주세요"),

  // 고객 — 이름 또는 연락처 중 하나는 필수 (조회 키로 사용)
  customer: z
    .object({
      name: z.string().trim().min(1, "고객명을 입력해주세요"),
      phone: z.string().trim().optional().nullable(),
    })
    .refine((c) => !!c.name || !!c.phone, {
      message: "고객명 또는 연락처가 필요합니다",
    }),

  // 계약 / 대금분할
  contractAmount: z.number().int().positive("총 계약금액을 입력해주세요"),
  contractDate: z.string().optional().nullable(),
  paymentSplits: z.array(paymentSplitInputSchema).min(2).max(6),
});

export type CreateSiteInput = z.infer<typeof createSiteInputSchema>;

export interface CreateSiteAuthCtx {
  userId: string;
  workspaceId: string | null;
}

export type CreateSiteResult =
  | {
      ok: true;
      data: {
        siteId: string;
        customerId: string;
        contractId: string;
        phaseIds: string[];
        splitIds: string[];
        scheduleIds: string[];
      };
    }
  | { ok: false; error: string };

/**
 * 폼 1회 제출로 고객→현장→공정→계약→대금분할→일정 까지 한 트랜잭션으로 생성.
 * 중간에 어디서 실패해도 전부 ROLLBACK 된다.
 */
export async function createSiteWithChildren(
  rawInput: unknown,
  auth: CreateSiteAuthCtx,
): Promise<CreateSiteResult> {
  // 1) 입력 형식 검증
  const parsed = createSiteInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "입력 형식 오류" };
  }
  const input = parsed.data;

  // 2) 대금분할 검증 (개수 + 합계)
  const splitsCheck = validatePaymentSplits(input.paymentSplits, input.contractAmount);
  if (!splitsCheck.ok) return { ok: false, error: splitsCheck.error };
  const splits = splitsCheck.splits;

  try {
    const result = await withTransaction(async (tx) => {
      // 3) 고객 — phone 우선, 없으면 name 으로 조회 → 있으면 연결, 없으면 신규
      const customerId = await findOrCreateCustomer(tx, input.customer, auth);

      // 4) 현장 생성
      const [site] = await tx
        .insert(sites)
        .values({
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          customerId,
          name: input.name,
          address: input.address ?? null,
          areaPyeong: input.areaPyeong ?? null,
          scope: input.scope ?? null,
          budget: input.budget ?? 0,
          startDate: input.startDate,
          endDate: input.endDate ?? null,
          trades: input.trades,
          status: "계약완료",
        })
        .returning({ id: sites.id });

      // 5) 공종별 윈도우 계산 — 착수일부터 표준 소요일을 순차 누적.
      //    공정(plannedStart/End)과 일정(siteSchedules) 모두 같은 윈도우를 공유해
      //    /api/schedule 에서 월 필터로 즉시 잡힌다.
      const tradeWindows = new Map<string, { startISO: string; endISO: string }>();
      let cursor = parseDate(input.startDate);
      for (const trade of input.trades) {
        // trade-mapping 의 30평 기준값을 실제 평수에 비례 보정.
        const days = scaleDaysByArea(daysForTrade(trade), input.areaPyeong ?? null);
        const start = cursor;
        const end = addDays(cursor, days - 1);
        tradeWindows.set(trade, { startISO: toISODate(start), endISO: toISODate(end) });
        cursor = addDays(end, 1);
      }

      // 6) 공정 — 선택된 공종별로 기본 작업 목록을 펼쳐 행 단위로 삽입.
      //    같은 공종의 모든 task 는 그 공종의 윈도우 전체를 plannedStart/End 로 공유.
      const phaseRows: {
        category: string;
        taskName: string;
        sortOrder: number;
        plannedStart: string;
        plannedEnd: string;
      }[] = [];
      let phaseSort = 0;
      for (const trade of input.trades) {
        const win = tradeWindows.get(trade)!;
        for (const task of tasksForTrade(trade)) {
          phaseRows.push({
            category: trade,
            taskName: task,
            sortOrder: phaseSort++,
            plannedStart: win.startISO,
            plannedEnd: win.endISO,
          });
        }
      }
      const insertedPhases = phaseRows.length
        ? await tx
            .insert(constructionPhases)
            .values(
              phaseRows.map((r) => ({
                userId: auth.userId,
                workspaceId: auth.workspaceId,
                siteId: site.id,
                category: r.category,
                taskName: r.taskName,
                sortOrder: r.sortOrder,
                plannedStart: r.plannedStart,
                plannedEnd: r.plannedEnd,
                status: "예정" as const,
                progress: 0,
              })),
            )
            .returning({ id: constructionPhases.id })
        : [];

      // 7) 계약
      const [contract] = await tx
        .insert(contracts)
        .values({
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          siteId: site.id,
          contractAmount: input.contractAmount,
          contractDate: input.contractDate ?? null,
        })
        .returning({ id: contracts.id });

      // 8) 대금분할
      const insertedSplits = await tx
        .insert(paymentSplits)
        .values(
          splits.map((s, i) => ({
            contractId: contract.id,
            sortOrder: i,
            itemName: s.itemName,
            amount: s.amount,
            status: s.status,
            scheduledDate: s.scheduledDate ?? null,
          })),
        )
        .returning({ id: paymentSplits.id });

      // 9) 일정 — 공종 단위 캘린더 항목 (5)에서 만든 윈도우 그대로 사용
      const scheduleValues: (typeof siteSchedules.$inferInsert)[] = [];
      let scheduleSort = 0;
      for (const trade of input.trades) {
        const win = tradeWindows.get(trade)!;
        scheduleValues.push({
          userId: auth.userId,
          workspaceId: auth.workspaceId,
          siteId: site.id,
          trade,
          taskName: null,
          startDate: win.startISO,
          endDate: win.endISO,
          sortOrder: scheduleSort++,
        });
      }
      const insertedSchedules = scheduleValues.length
        ? await tx
            .insert(siteSchedules)
            .values(scheduleValues)
            .returning({ id: siteSchedules.id })
        : [];

      return {
        siteId: site.id,
        customerId,
        contractId: contract.id,
        phaseIds: insertedPhases.map((p) => p.id),
        splitIds: insertedSplits.map((s) => s.id),
        scheduleIds: insertedSchedules.map((s) => s.id),
      };
    });

    return { ok: true, data: result };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "현장 생성 중 오류";
    return { ok: false, error: msg };
  }
}

async function findOrCreateCustomer(
  tx: TxClient,
  input: { name: string; phone?: string | null },
  auth: CreateSiteAuthCtx,
): Promise<string> {
  const workspaceMatch = auth.workspaceId
    ? eq(customers.workspaceId, auth.workspaceId)
    : eq(customers.userId, auth.userId);

  const phone = input.phone?.trim() || null;
  const name = input.name.trim();

  // 연락처 있으면 phone 우선, 없으면 name 으로 조회
  const lookup = phone
    ? and(workspaceMatch, isNull(customers.deletedAt), eq(customers.phone, phone))
    : and(workspaceMatch, isNull(customers.deletedAt), eq(customers.name, name));

  const [existing] = await tx
    .select({ id: customers.id })
    .from(customers)
    .where(lookup)
    .limit(1);

  if (existing) return existing.id;

  const [created] = await tx
    .insert(customers)
    .values({
      userId: auth.userId,
      workspaceId: auth.workspaceId,
      name,
      phone,
    })
    .returning({ id: customers.id });

  return created.id;
}

function parseDate(iso: string): Date {
  // 'YYYY-MM-DD' UTC 자정으로 고정 — 시간대 휘둘리지 않게.
  const [y, m, d] = iso.split("-").map((s) => parseInt(s, 10));
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
}

function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

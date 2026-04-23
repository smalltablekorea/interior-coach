/**
 * 시공 일정 알림 크론 — D-3, D-1 고객 SMS
 * AI-26: 실시간 알림 시스템
 * 
 * Vercel Cron: 매일 09:00 KST 실행
 * 진행예정 공정 D-3, D-1에 해당하는 건에 고객 SMS 발송
 */

import { createCronRoute } from "@/lib/cron/monitor";
import { db } from "@/lib/db";
import { constructionPhases, sites, customers } from "@/lib/db/schema";
import { eq, and, gte, lte, isNull } from "drizzle-orm";
import { sendSms } from "@/lib/solapi";
import { buildScheduleReminderSms } from "@/lib/notifications/email-templates";

export const POST = createCronRoute({
  name: "notifications/schedule-reminder",
  handler: async () => {
    const today = new Date();
    const kstOffset = 9 * 60 * 60 * 1000;
    const kstToday = new Date(today.getTime() + kstOffset);
    const kstDateStr = kstToday.toISOString().slice(0, 10);

    // D-3 and D-1 target dates
    const d3 = addDays(kstDateStr, 3);
    const d1 = addDays(kstDateStr, 1);

    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const { targetDate, daysUntil } of [
      { targetDate: d3, daysUntil: 3 },
      { targetDate: d1, daysUntil: 1 },
    ]) {
      // 해당 날짜에 시작하는 공정 조회
      const phases = await db
        .select({
          phaseId: constructionPhases.id,
          category: constructionPhases.category,
          plannedStart: constructionPhases.plannedStart,
          siteId: constructionPhases.siteId,
          siteName: sites.name,
          customerId: sites.customerId,
        })
        .from(constructionPhases)
        .innerJoin(sites, eq(constructionPhases.siteId, sites.id))
        .where(
          and(
            eq(constructionPhases.plannedStart, targetDate),
            eq(constructionPhases.status, "대기"),
            isNull(sites.deletedAt),
          ),
        );

      for (const phase of phases) {
        if (!phase.customerId) {
          skipped++;
          continue;
        }

        // 고객 정보 조회
        const [customer] = await db
          .select({ name: customers.name, phone: customers.phone })
          .from(customers)
          .where(eq(customers.id, phase.customerId));

        if (!customer?.phone) {
          skipped++;
          continue;
        }

        // SMS 발송
        const smsBody = buildScheduleReminderSms({
          customerName: customer.name,
          siteName: phase.siteName || "",
          scheduledDate: targetDate,
          daysUntil,
          category: phase.category || "시공",
          companyName: "인테리어코치",
        });

        const result = await sendSms(customer.phone, smsBody);
        if (result.success) {
          sent++;
        } else {
          failed++;
        }
      }
    }

    return {
      processed: sent + skipped + failed,
      metadata: { sent, skipped, failed, checkedDates: [d1, d3] },
    };
  },
});

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

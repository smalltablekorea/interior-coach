import { NextRequest } from "next/server";
import { and, desc, eq, gt, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { demoRequests } from "@/lib/db/schema";
import { validateBody, demoRequestSchema } from "@/lib/api/validate";
import { enforceApiRateLimit } from "@/lib/api/rate-limit";
import { ok, err, serverError } from "@/lib/api/response";
import { requireSystemAdmin } from "@/lib/api-auth";
import { sendSms } from "@/lib/solapi";

const ADMIN_NOTIFY_NUMBER =
  process.env.DEMO_REQUEST_NOTIFY_NUMBER ||
  process.env.ADMIN_PHONE ||
  "";

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/**
 * POST /api/demo-request — 랜딩페이지 데모 신청 접수
 * - IP당 분당 3회 제한
 * - 같은 이메일+전화 24h 내 재신청 차단
 * - Solapi SMS: 관리자 알림 + 신청자 접수 확인 (fire-and-forget)
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const gate = enforceApiRateLimit(`ip:${ip}`, {
    bucket: "demo-request",
    max: 3,
    windowMs: 60_000,
  });
  if (!gate.ok) return gate.response;

  const parsed = await validateBody(request, demoRequestSchema);
  if (!parsed.ok) return parsed.response;
  const input = parsed.data;

  try {
    // 24h 내 동일 이메일 또는 전화 재신청 차단
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await db
      .select({ id: demoRequests.id })
      .from(demoRequests)
      .where(
        and(
          gt(demoRequests.createdAt, dayAgo),
          or(
            eq(demoRequests.email, input.email),
            eq(demoRequests.phone, input.phone),
          ),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return err(
        "최근 24시간 내 동일한 연락처/이메일로 신청한 내역이 있습니다. 곧 연락드리겠습니다.",
        409,
      );
    }

    const [created] = await db
      .insert(demoRequests)
      .values({
        companyName: input.companyName,
        ownerName: input.ownerName,
        phone: input.phone,
        email: input.email,
        companySize: input.companySize,
        currentPain: input.currentPain ?? null,
        source: input.source ?? null,
      })
      .returning({ id: demoRequests.id, createdAt: demoRequests.createdAt });

    // fire-and-forget SMS — 실패해도 응답은 성공
    void notifyDemoRequest(input, created.id).catch((e) => {
      console.error("[demo-request] SMS 실패:", e);
    });

    return ok({
      success: true,
      id: created.id,
      message: "데모 신청이 접수되었습니다. 영업일 기준 24시간 내 연락드립니다.",
    });
  } catch (e) {
    return serverError(e);
  }
}

async function notifyDemoRequest(
  input: {
    companyName: string;
    ownerName: string;
    phone: string;
    email: string;
  },
  id: string,
) {
  const adminText = `[인테리어코치] 새 데모 신청\n회사: ${input.companyName}\n담당: ${input.ownerName}\n연락처: ${input.phone}\n이메일: ${input.email}`;
  const userText = `[인테리어코치] ${input.ownerName}님, 데모 신청이 접수되었습니다. 영업일 기준 24시간 내에 연락드리겠습니다.`;

  const tasks: Promise<unknown>[] = [];
  if (ADMIN_NOTIFY_NUMBER) {
    tasks.push(sendSms(ADMIN_NOTIFY_NUMBER, adminText, true));
  }
  tasks.push(sendSms(input.phone, userText, false));
  const results = await Promise.allSettled(tasks);

  const anyOk = results.some(
    (r) => r.status === "fulfilled" && (r.value as { success?: boolean }).success,
  );
  if (anyOk) {
    await db
      .update(demoRequests)
      .set({ notifiedAt: new Date() })
      .where(eq(demoRequests.id, id));
  }
}

/**
 * GET /api/demo-request — 관리자 전용 신청 목록 조회
 * 관리자 대시보드에서 동일 기능이 필요하면 /api/admin/demo-requests를 사용.
 */
export async function GET() {
  const auth = await requireSystemAdmin();
  if (!auth.ok) return auth.response;

  try {
    const rows = await db
      .select()
      .from(demoRequests)
      .orderBy(desc(demoRequests.createdAt))
      .limit(200);
    return ok({ items: rows, total: rows.length });
  } catch (e) {
    return serverError(e);
  }
}

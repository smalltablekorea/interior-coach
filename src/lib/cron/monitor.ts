/**
 * CRON 실행 모니터링 (AI-14)
 *
 * Vercel CRON 핸들러를 감싸는 공용 래퍼:
 * 1. `CRON_SECRET` 인증 확인
 * 2. 시작/종료 시각 기록 후 `cron_execution_logs` 테이블에 적재
 * 3. 실패 시 Slack 웹훅 / 이메일 알림 발송
 * 4. 최근 연속 실패가 `ESCALATION_THRESHOLD` 이상이면 `[CRITICAL]` 알림으로 에스컬레이션
 *
 * 알림 채널은 환경 변수로 제어한다:
 * - `CRON_ALERT_SLACK_WEBHOOK`: Slack Incoming Webhook URL
 * - `CRON_ALERT_EMAIL`: 관리자 이메일 (Resend)
 * - `RESEND_API_KEY`: 이메일 발송용 Resend API 키
 *
 * 사용 예:
 * ```ts
 * export const POST = createCronRoute({
 *   name: "notifications/process",
 *   handler: async () => {
 *     const r = await processQueue();
 *     return { processed: r.processed, metadata: r };
 *   },
 * });
 * ```
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cronExecutionLogs } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Resend } from "resend";

/** 연속 실패 N회 이상 시 에스컬레이션 알림 */
export const ESCALATION_THRESHOLD = 3;

export interface CronHandlerResult {
  /** 처리 건수 (예: 큐에서 처리된 메시지 수) */
  processed?: number;
  /** 로그에 함께 저장할 추가 지표 */
  metadata?: Record<string, unknown>;
}

export interface CronRouteOptions {
  /** 로그/알림에 표시될 CRON 이름 (예: "qna/generate") */
  name: string;
  /** 실제 CRON 작업. 에러를 throw 하면 실패로 기록된다. */
  handler: (request: Request) => Promise<CronHandlerResult | void>;
  /**
   * HTTP 메서드 검증 없이 인증만 확인한다. 기본값은 `true`.
   * Vercel CRON은 GET으로 호출되지만 일부 핸들러는 POST로 구현되어 있어도 문제가 없다.
   */
  requireAuth?: boolean;
}

interface AlertChannels {
  slackWebhookUrl?: string | null;
  alertEmail?: string | null;
  resendApiKey?: string | null;
  fromEmail?: string | null;
}

/** 환경 변수에서 알림 채널 설정을 읽어온다. 테스트 시 주입 가능하도록 인자 분리. */
export function getAlertChannels(): AlertChannels {
  return {
    slackWebhookUrl: process.env.CRON_ALERT_SLACK_WEBHOOK?.trim() || null,
    alertEmail: process.env.CRON_ALERT_EMAIL?.trim() || null,
    resendApiKey: process.env.RESEND_API_KEY?.trim() || null,
    fromEmail: process.env.RESEND_FROM_EMAIL?.trim() || "noreply@interiorcoach.kr",
  };
}

/** 인증 검증. CRON_SECRET 미설정 시 항상 401로 막아 실수로 공개되는 것을 방지한다. */
function verifyCronAuth(request: Request): { ok: true } | { ok: false; response: NextResponse } {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return {
      ok: false,
      response: NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true };
}

/** cronExecutionLogs에 적재. DB 실패가 CRON 핸들러 전체를 실패시키지 않도록 내부 try-catch. */
async function insertLog(row: {
  cronName: string;
  success: boolean;
  processed?: number;
  durationMs: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  errorStack?: string;
  startedAt: Date;
}): Promise<void> {
  try {
    await db.insert(cronExecutionLogs).values({
      cronName: row.cronName,
      success: row.success,
      processed: row.processed ?? 0,
      durationMs: row.durationMs,
      metadata: row.metadata ?? null,
      errorMessage: row.errorMessage ?? null,
      errorStack: row.errorStack ?? null,
      startedAt: row.startedAt,
    });
  } catch (logError) {
    console.error(`[cron:${row.cronName}] Failed to persist execution log`, logError);
  }
}

/** 방금 기록된 실패를 포함해 최근 N개 실행이 모두 실패였는지 판단 */
export async function countRecentConsecutiveFailures(cronName: string, limit: number): Promise<number> {
  try {
    const rows = await db
      .select({ success: cronExecutionLogs.success })
      .from(cronExecutionLogs)
      .where(eq(cronExecutionLogs.cronName, cronName))
      .orderBy(desc(cronExecutionLogs.completedAt))
      .limit(limit);

    let streak = 0;
    for (const row of rows) {
      if (row.success) break;
      streak++;
    }
    return streak;
  } catch (error) {
    console.error(`[cron:${cronName}] Failed to query consecutive failures`, error);
    return 0;
  }
}

/** Slack Incoming Webhook 발송 */
async function sendSlackAlert(webhookUrl: string, text: string): Promise<void> {
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) {
      console.error(`[cron:alert] Slack webhook responded ${res.status}`);
    }
  } catch (error) {
    console.error(`[cron:alert] Slack webhook error`, error);
  }
}

/** Resend 이메일 발송 */
async function sendEmailAlert(
  channels: AlertChannels,
  subject: string,
  body: string,
): Promise<void> {
  if (!channels.resendApiKey || !channels.alertEmail) return;
  try {
    const resend = new Resend(channels.resendApiKey);
    await resend.emails.send({
      from: `인테리어코치 알림 <${channels.fromEmail || "noreply@interiorcoach.kr"}>`,
      to: channels.alertEmail,
      subject,
      text: body,
    });
  } catch (error) {
    console.error(`[cron:alert] Email send error`, error);
  }
}

export interface FailureAlertContext {
  cronName: string;
  errorMessage: string;
  errorStack?: string;
  durationMs: number;
  startedAt: Date;
  consecutiveFailures: number;
  channels?: AlertChannels;
}

/** 실패 알림 (Slack + 이메일). 테스트에서 채널을 직접 주입할 수 있다. */
export async function sendCronFailureAlert(ctx: FailureAlertContext): Promise<{
  slackSent: boolean;
  emailSent: boolean;
  escalated: boolean;
}> {
  const channels = ctx.channels ?? getAlertChannels();
  const escalated = ctx.consecutiveFailures >= ESCALATION_THRESHOLD;
  const severity = escalated ? "[CRITICAL]" : "[FAIL]";
  const escalationNote = escalated
    ? `\n*연속 실패 ${ctx.consecutiveFailures}회* — 즉시 확인 필요`
    : "";

  const subject = `${severity} CRON 실패: ${ctx.cronName}`;
  const textBody =
    `${severity} ${ctx.cronName} 실패${escalationNote}\n` +
    `시작: ${ctx.startedAt.toISOString()}\n` +
    `소요: ${ctx.durationMs}ms\n` +
    `에러: ${ctx.errorMessage}` +
    (ctx.errorStack ? `\n\n${ctx.errorStack.split("\n").slice(0, 10).join("\n")}` : "");

  let slackSent = false;
  let emailSent = false;

  if (channels.slackWebhookUrl) {
    await sendSlackAlert(channels.slackWebhookUrl, textBody);
    slackSent = true;
  }
  if (channels.alertEmail && channels.resendApiKey) {
    await sendEmailAlert(channels, subject, textBody);
    emailSent = true;
  }

  if (!slackSent && !emailSent) {
    // 알림 채널 미설정 시 최소한 로그는 남긴다.
    console.warn(`[cron:alert] No alert channels configured; ${subject}`);
  }
  return { slackSent, emailSent, escalated };
}

/**
 * CRON 라우트 핸들러 생성기.
 *
 * 성공 시: 200 + `{ success, processed, durationMs, metadata }`
 * 실패 시: 500 + `{ success: false, error, durationMs }` + 알림
 * 미인증: 401 + `{ success: false, error: "Unauthorized" }`
 */
export function createCronRoute(
  options: CronRouteOptions,
): (request: Request) => Promise<NextResponse> {
  const { name, handler, requireAuth = true } = options;

  return async function cronRoute(request: Request): Promise<NextResponse> {
    if (requireAuth) {
      const auth = verifyCronAuth(request);
      if (!auth.ok) return auth.response;
    }

    const startedAt = new Date();
    const startMs = Date.now();

    try {
      const result = (await handler(request)) ?? {};
      const durationMs = Date.now() - startMs;

      await insertLog({
        cronName: name,
        success: true,
        processed: result.processed,
        metadata: result.metadata,
        durationMs,
        startedAt,
      });

      return NextResponse.json({
        success: true,
        cron: name,
        processed: result.processed ?? 0,
        durationMs,
        metadata: result.metadata,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      const durationMs = Date.now() - startMs;
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      console.error(`[cron:${name}] Fatal error:`, error);

      await insertLog({
        cronName: name,
        success: false,
        durationMs,
        errorMessage,
        errorStack,
        startedAt,
      });

      // 방금 기록된 실패를 포함해 연속 실패 횟수 조회
      const consecutiveFailures = await countRecentConsecutiveFailures(
        name,
        ESCALATION_THRESHOLD + 1,
      );

      await sendCronFailureAlert({
        cronName: name,
        errorMessage,
        errorStack,
        durationMs,
        startedAt,
        consecutiveFailures,
      });

      return NextResponse.json(
        {
          success: false,
          cron: name,
          error: errorMessage,
          durationMs,
          timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }
  };
}

/** 최근 실행 요약 (관리자 대시보드 등에서 활용). 현재는 헬퍼만 노출한다. */
export async function getRecentCronRuns(cronName: string, limit = 20) {
  return db
    .select()
    .from(cronExecutionLogs)
    .where(eq(cronExecutionLogs.cronName, cronName))
    .orderBy(desc(cronExecutionLogs.completedAt))
    .limit(limit);
}

/** 테스트/디버그용: 성공만 / 실패만 조회 */
export async function getRecentCronFailures(cronName: string, limit = 10) {
  return db
    .select()
    .from(cronExecutionLogs)
    .where(and(eq(cronExecutionLogs.cronName, cronName), eq(cronExecutionLogs.success, false)))
    .orderBy(desc(cronExecutionLogs.completedAt))
    .limit(limit);
}

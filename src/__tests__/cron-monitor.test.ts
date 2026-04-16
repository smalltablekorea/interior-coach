import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// DB는 스키마 모듈을 import하므로 전체를 가벼운 목업으로 대체한다.
// 모든 쿼리 빌더 체인을 no-op으로 돌려 실제 DB 접근이 일어나지 않게 한다.
const insertedRows: Array<Record<string, unknown>> = [];
let queryReturn: Array<{ success: boolean }> = [];

vi.mock("@/lib/db", () => {
  const chain = {
    values: vi.fn(async (row: Record<string, unknown>) => {
      insertedRows.push(row);
    }),
    from: vi.fn(function (this: unknown) {
      return this;
    }),
    where: vi.fn(function (this: unknown) {
      return this;
    }),
    orderBy: vi.fn(function (this: unknown) {
      return this;
    }),
    limit: vi.fn(async () => queryReturn),
  };
  // 체인 메서드가 self 반환하도록 this 바인딩
  (chain.from as unknown as Mock).mockReturnValue(chain);
  (chain.where as unknown as Mock).mockReturnValue(chain);
  (chain.orderBy as unknown as Mock).mockReturnValue(chain);

  return {
    db: {
      insert: vi.fn(() => chain),
      select: vi.fn(() => chain),
    },
  };
});

// Resend 모듈도 목업 — 실제 네트워크 호출이 일어나지 않도록 한다.
const resendSendMock = vi.fn(async () => ({ data: { id: "msg_mock" }, error: null }));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: resendSendMock };
  },
}));

type Mock = ReturnType<typeof vi.fn>;

import {
  createCronRoute,
  sendCronFailureAlert,
  countRecentConsecutiveFailures,
  ESCALATION_THRESHOLD,
} from "@/lib/cron/monitor";

const CRON_SECRET = "test-secret";

function cronRequest(url = "https://app.test/api/cron/qna/generate"): Request {
  return new Request(url, {
    method: "GET",
    headers: { authorization: `Bearer ${CRON_SECRET}` },
  });
}

describe("createCronRoute — AI-14 CRON 모니터링 래퍼", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    insertedRows.length = 0;
    queryReturn = [];
    process.env.CRON_SECRET = CRON_SECRET;
    delete process.env.CRON_ALERT_SLACK_WEBHOOK;
    delete process.env.CRON_ALERT_EMAIL;
    delete process.env.RESEND_API_KEY;
    resendSendMock.mockClear();
    global.fetch = vi.fn(async () => new Response("ok", { status: 200 })) as unknown as typeof fetch;
  });
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("인증 실패 시 401을 반환하고 로그를 적재하지 않는다", async () => {
    const handler = vi.fn(async () => ({ processed: 0 }));
    const route = createCronRoute({ name: "test/auth", handler });

    const res = await route(new Request("https://app.test/x", { headers: {} }));
    expect(res.status).toBe(401);
    expect(handler).not.toHaveBeenCalled();
    expect(insertedRows).toHaveLength(0);
  });

  it("성공 시 success=true와 processed 수를 로그에 기록하고 200을 반환한다", async () => {
    const route = createCronRoute({
      name: "test/success",
      handler: async () => ({ processed: 7, metadata: { kind: "demo" } }),
    });

    const res = await route(cronRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.processed).toBe(7);
    expect(body.cron).toBe("test/success");
    expect(body.metadata).toEqual({ kind: "demo" });

    expect(insertedRows).toHaveLength(1);
    const row = insertedRows[0];
    expect(row.cronName).toBe("test/success");
    expect(row.success).toBe(true);
    expect(row.processed).toBe(7);
    expect(row.errorMessage).toBeNull();
    expect(row.metadata).toEqual({ kind: "demo" });
  });

  it("핸들러가 throw하면 실패 로그를 기록하고 500을 반환한다", async () => {
    const route = createCronRoute({
      name: "test/failure",
      handler: async () => {
        throw new Error("boom");
      },
    });

    const res = await route(cronRequest());
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe("boom");
    expect(body.cron).toBe("test/failure");

    expect(insertedRows).toHaveLength(1);
    expect(insertedRows[0].success).toBe(false);
    expect(insertedRows[0].errorMessage).toBe("boom");
    expect(typeof insertedRows[0].errorStack).toBe("string");
  });

  it("Slack 웹훅이 설정되어 있으면 실패 시 알림을 보낸다", async () => {
    process.env.CRON_ALERT_SLACK_WEBHOOK = "https://hooks.slack.com/services/FAKE/HOOK";
    const route = createCronRoute({
      name: "test/alert",
      handler: async () => {
        throw new Error("db offline");
      },
    });

    await route(cronRequest());

    const fetchMock = global.fetch as unknown as Mock;
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://hooks.slack.com/services/FAKE/HOOK");
    expect(init.method).toBe("POST");
    const payload = JSON.parse(init.body);
    expect(payload.text).toContain("test/alert");
    expect(payload.text).toContain("db offline");
  });

  it("이메일 채널이 설정되어 있으면 Resend로 발송한다", async () => {
    process.env.CRON_ALERT_EMAIL = "ops@example.com";
    process.env.RESEND_API_KEY = "rs_test";

    const route = createCronRoute({
      name: "test/email",
      handler: async () => {
        throw new Error("queue stuck");
      },
    });

    await route(cronRequest());

    expect(resendSendMock).toHaveBeenCalledTimes(1);
    const call = (resendSendMock.mock.calls as unknown as Array<Array<{
      to: string;
      subject: string;
      text: string;
    }>>)[0][0];
    expect(call.to).toBe("ops@example.com");
    expect(call.subject).toContain("test/email");
    expect(call.text).toContain("queue stuck");
  });
});

describe("countRecentConsecutiveFailures", () => {
  beforeEach(() => {
    queryReturn = [];
  });

  it("가장 최근 성공 전까지의 연속 실패 수를 센다", async () => {
    queryReturn = [
      { success: false },
      { success: false },
      { success: false },
      { success: true },
      { success: false },
    ];
    const count = await countRecentConsecutiveFailures("test/streak", 5);
    expect(count).toBe(3);
  });

  it("가장 최근 실행이 성공이면 0을 반환한다", async () => {
    queryReturn = [{ success: true }, { success: false }];
    const count = await countRecentConsecutiveFailures("test/streak", 5);
    expect(count).toBe(0);
  });

  it("실행 이력이 없으면 0을 반환한다", async () => {
    queryReturn = [];
    const count = await countRecentConsecutiveFailures("test/streak", 5);
    expect(count).toBe(0);
  });
});

describe("sendCronFailureAlert — 에스컬레이션", () => {
  beforeEach(() => {
    (global.fetch as unknown as Mock | undefined)?.mockClear?.();
    global.fetch = vi.fn(async () => new Response("ok", { status: 200 })) as unknown as typeof fetch;
    resendSendMock.mockClear();
  });

  it("연속 실패가 임계치 미만이면 [FAIL] 알림을 보낸다", async () => {
    const result = await sendCronFailureAlert({
      cronName: "test/norm",
      errorMessage: "err",
      durationMs: 100,
      startedAt: new Date("2026-04-16T00:00:00Z"),
      consecutiveFailures: 1,
      channels: { slackWebhookUrl: "https://hooks.slack.com/services/X" },
    });
    expect(result.escalated).toBe(false);
    expect(result.slackSent).toBe(true);
    const fetchMock = global.fetch as unknown as Mock;
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain("[FAIL]");
    expect(body.text).not.toContain("[CRITICAL]");
  });

  it("연속 실패가 임계치 이상이면 [CRITICAL]로 에스컬레이션한다", async () => {
    const result = await sendCronFailureAlert({
      cronName: "test/crit",
      errorMessage: "err",
      durationMs: 100,
      startedAt: new Date("2026-04-16T00:00:00Z"),
      consecutiveFailures: ESCALATION_THRESHOLD,
      channels: { slackWebhookUrl: "https://hooks.slack.com/services/X" },
    });
    expect(result.escalated).toBe(true);
    const fetchMock = global.fetch as unknown as Mock;
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.text).toContain("[CRITICAL]");
    expect(body.text).toContain(`연속 실패 ${ESCALATION_THRESHOLD}회`);
  });

  it("채널이 모두 비어있으면 아무 전송도 하지 않는다", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const result = await sendCronFailureAlert({
      cronName: "test/none",
      errorMessage: "err",
      durationMs: 100,
      startedAt: new Date(),
      consecutiveFailures: 1,
      channels: {},
    });
    expect(result.slackSent).toBe(false);
    expect(result.emailSent).toBe(false);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

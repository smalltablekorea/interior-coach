import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import * as crypto from "crypto";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;

  try {
    const [channel] = await db
      .select()
      .from(marketingChannels)
      .where(
        and(
          eq(marketingChannels.channel, "sms"),
          eq(marketingChannels.userId, auth.userId)
        )
      );

    if (!channel || !channel.isActive) {
      return NextResponse.json(
        { error: "SMS 서비스가 연결되지 않았습니다." },
        { status: 401 }
      );
    }

    const settings = channel.settings as {
      apiKey?: string;
      apiSecret?: string;
      senderPhone?: string;
    } | null;

    if (!settings?.apiKey || !settings?.apiSecret) {
      return NextResponse.json(
        { error: "Solapi API 키가 설정되지 않았습니다." },
        { status: 400 }
      );
    }

    // Solapi HMAC authentication
    const date = new Date().toISOString();
    const salt = crypto.randomBytes(32).toString("hex");
    const signature = crypto
      .createHmac("sha256", settings.apiSecret)
      .update(date + salt)
      .digest("hex");

    const authHeader = `HMAC-SHA256 apiKey=${settings.apiKey}, date=${date}, salt=${salt}, signature=${signature}`;

    // Fetch message statistics
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);

    const statsResp = await fetch(
      `https://api.solapi.com/messages/v4/statistics?startDate=${thirtyDaysAgo.toISOString()}&endDate=${now.toISOString()}`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    let stats = {
      totalSent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
    };

    if (statsResp.ok) {
      const statsData = await statsResp.json();
      if (statsData) {
        stats.totalSent = statsData.count?.total || 0;
        stats.delivered = statsData.count?.success || 0;
        stats.failed = statsData.count?.fail || 0;
        stats.pending = statsData.count?.pending || 0;
      }
    }

    // Fetch recent messages
    const messagesResp = await fetch(
      `https://api.solapi.com/messages/v4/list?limit=20&startDate=${thirtyDaysAgo.toISOString()}&endDate=${now.toISOString()}`,
      {
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
      }
    );

    let recentMessages: {
      messageId: string;
      to: string;
      text: string;
      status: string;
      sentAt: string;
    }[] = [];

    if (messagesResp.ok) {
      const messagesData = await messagesResp.json();
      recentMessages = (messagesData.messageList || [])
        .slice(0, 20)
        .map(
          (m: {
            messageId?: string;
            to?: string;
            text?: string;
            statusCode?: string;
            dateCreated?: string;
          }) => ({
            messageId: m.messageId || "",
            to: m.to ? m.to.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2") : "",
            text: (m.text || "").slice(0, 50),
            status: m.statusCode || "unknown",
            sentAt: m.dateCreated || "",
          })
        );
    }

    // Fetch balance
    let balance = 0;
    try {
      const balanceResp = await fetch(
        "https://api.solapi.com/cash/v1/balance",
        {
          headers: {
            Authorization: authHeader,
            "Content-Type": "application/json",
          },
        }
      );
      if (balanceResp.ok) {
        const balanceData = await balanceResp.json();
        balance = balanceData.balance || 0;
      }
    } catch {
      // Balance is optional
    }

    return NextResponse.json({
      account: {
        senderPhone: settings.senderPhone,
        balance,
      },
      stats,
      recentMessages,
      syncedAt: new Date().toISOString(),
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "SMS 데이터 조회 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

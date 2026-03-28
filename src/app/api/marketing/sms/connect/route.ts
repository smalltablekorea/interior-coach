import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { requireAuth } from "@/lib/api-auth";
import { ok, err, serverError } from "@/lib/api/response";

const CHANNEL = "sms";

export async function GET() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const [channel] = await db
      .select({
        id: marketingChannels.id,
        accountName: marketingChannels.accountName,
        accountId: marketingChannels.accountId,
        isActive: marketingChannels.isActive,
        settings: marketingChannels.settings,
      })
      .from(marketingChannels)
      .where(and(eq(marketingChannels.channel, CHANNEL), eq(marketingChannels.userId, auth.userId)));

    if (!channel || !channel.isActive) {
      return ok({ connected: false });
    }

    const settings = channel.settings as { senderPhone?: string } | null;

    return ok({
      connected: true,
      accountName: channel.accountName || "Solapi",
      accountId: channel.accountId,
      senderPhone: settings?.senderPhone || null,
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    const body = await request.json();
    const { apiKey, apiSecret, senderPhone } = body;

    if (!apiKey || !apiSecret || !senderPhone) {
      return err("API Key, API Secret, 발신번호를 모두 입력해주세요");
    }

    const [existing] = await db
      .select()
      .from(marketingChannels)
      .where(and(eq(marketingChannels.channel, CHANNEL), eq(marketingChannels.userId, auth.userId)));

    const payload = {
      accountName: `Solapi (${senderPhone})`,
      accountId: apiKey,
      accessToken: apiKey,
      isActive: true,
      settings: {
        apiKey,
        apiSecret,
        senderPhone,
      },
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(marketingChannels)
        .set(payload)
        .where(and(eq(marketingChannels.id, existing.id), eq(marketingChannels.userId, auth.userId)));
    } else {
      await db.insert(marketingChannels).values({
        userId: auth.userId,
        channel: CHANNEL,
        ...payload,
      });
    }

    return ok({
      connected: true,
      accountName: `Solapi (${senderPhone})`,
      message: "SMS 서비스가 연결되었습니다.",
    });
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE() {
  const auth = await requireAuth();
  if (!auth.ok) return auth.response;
  try {
    await db
      .update(marketingChannels)
      .set({ isActive: false, accessToken: null, settings: null, updatedAt: new Date() })
      .where(and(eq(marketingChannels.channel, CHANNEL), eq(marketingChannels.userId, auth.userId)));

    return ok({ connected: false, message: "연결이 해제되었습니다." });
  } catch (error) {
    return serverError(error);
  }
}

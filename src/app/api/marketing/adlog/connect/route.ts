import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { marketingChannels } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const ADLOG_BASE = "https://adlog.kr";
const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36";

// 애드로그 계정 연결 상태 조회
export async function GET() {
  try {
    const [channel] = await db
      .select({
        id: marketingChannels.id,
        accountName: marketingChannels.accountName,
        accountId: marketingChannels.accountId,
        isActive: marketingChannels.isActive,
        settings: marketingChannels.settings,
        updatedAt: marketingChannels.updatedAt,
      })
      .from(marketingChannels)
      .where(eq(marketingChannels.channel, "adlog"));

    if (!channel) {
      return NextResponse.json({ connected: false });
    }

    const settings = channel.settings as { lastSyncAt?: string } | null;

    return NextResponse.json({
      connected: channel.isActive ?? false,
      accountName: channel.accountName,
      accountId: channel.accountId,
      lastSyncAt: settings?.lastSyncAt || null,
      updatedAt: channel.updatedAt,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "연결 상태 조회 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 애드로그 계정 연결 (로그인 테스트 + 크리덴셜 저장)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { adlogId, adlogPassword } = body;

  if (!adlogId || !adlogPassword) {
    return NextResponse.json(
      { error: "아이디와 비밀번호를 입력해주세요" },
      { status: 400 },
    );
  }

  try {
    const ok = await testAdlogLogin(adlogId, adlogPassword);

    if (!ok) {
      return NextResponse.json(
        { error: "애드로그 로그인에 실패했습니다. 아이디/비밀번호를 확인해주세요." },
        { status: 401 },
      );
    }

    const [existing] = await db
      .select()
      .from(marketingChannels)
      .where(eq(marketingChannels.channel, "adlog"));

    const payload = {
      accountName: adlogId,
      accountId: adlogId,
      isActive: true,
      settings: {
        adlogId,
        adlogPassword,
        lastSyncAt: new Date().toISOString(),
      },
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(marketingChannels)
        .set(payload)
        .where(eq(marketingChannels.id, existing.id));
    } else {
      await db.insert(marketingChannels).values({
        userId: "system",
        channel: "adlog",
        ...payload,
      });
    }

    return NextResponse.json({
      connected: true,
      accountName: adlogId,
      message: "애드로그 계정이 연결되었습니다.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "연결 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 애드로그 계정 연결 해제
export async function DELETE() {
  try {
    await db
      .update(marketingChannels)
      .set({ isActive: false, settings: null, updatedAt: new Date() })
      .where(eq(marketingChannels.channel, "adlog"));

    return NextResponse.json({
      connected: false,
      message: "연결이 해제되었습니다.",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "연결 해제 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// 애드로그 로그인 테스트
async function testAdlogLogin(id: string, pw: string): Promise<boolean> {
  try {
    const res = await fetch(`${ADLOG_BASE}/bbs/login_check.php`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": UA,
        Referer: `${ADLOG_BASE}/adlog/`,
      },
      body: new URLSearchParams({ mb_id: id, mb_password: pw, url: "/adlog/" }),
      redirect: "manual",
    });

    // 로그인 성공 시 302 + adsession 쿠키
    const raw = res.headers.get("set-cookie") || "";
    return raw.includes("adsession") || res.status === 302;
  } catch {
    return true; // 네트워크 오류 시에도 크리덴셜 저장
  }
}

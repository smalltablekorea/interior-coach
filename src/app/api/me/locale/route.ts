import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";

import { db } from "@/lib/db";
import { user } from "@/lib/db/schema";
import { auth } from "@/lib/auth";
import { ok, err, serverError } from "@/lib/api/response";
import { isSupportedLocale, SUPPORTED_LOCALES } from "@/i18n/routing";

/**
 * PATCH /api/me/locale
 *   로그인 사용자의 언어 선호를 변경한다.
 *   - user.preferred_locale 갱신
 *   - NEXT_LOCALE 쿠키 갱신 (next-intl 이 next 요청부터 즉시 사용)
 *
 *   body: { locale: "ko" | "en" }
 *
 *   비로그인 상태에서는 401. 비로그인 사용자가 토글하는 경우엔
 *   클라이언트에서 next-intl 의 setRequestLocale 등으로 직접 NEXT_LOCALE 쿠키만 굽도록 한다.
 */
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) return err("로그인이 필요합니다", 401);

    const body = (await req.json().catch(() => ({}))) as { locale?: unknown };
    const locale = body.locale;
    if (!isSupportedLocale(locale)) {
      return err(`locale 은 ${SUPPORTED_LOCALES.join("/")} 중 하나여야 합니다`);
    }

    await db
      .update(user)
      .set({ preferredLocale: locale, updatedAt: new Date() })
      .where(eq(user.id, session.user.id));

    // NEXT_LOCALE 쿠키 갱신 — next-intl 기본 쿠키명. 1년.
    const jar = await cookies();
    jar.set("NEXT_LOCALE", locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return ok({ locale });
  } catch (e) {
    return serverError(e);
  }
}

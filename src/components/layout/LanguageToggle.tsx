"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "use-intl";
import { Globe, Check, ChevronDown } from "lucide-react";
import { SUPPORTED_LOCALES, type Locale } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { apiFetch } from "@/lib/api-client";

interface Props {
  /** 콤팩트한 헤더에서는 텍스트 없이 글로브 아이콘만 노출. 기본 false. */
  iconOnly?: boolean;
}

const LABELS: Record<Locale, { native: string; short: string }> = {
  ko: { native: "한국어", short: "한" },
  en: { native: "English", short: "EN" },
};

/**
 * 로그인 전/후 공통 헤더에 들어가는 한국어/English 토글.
 *
 *  - 현재 경로·쿼리·해시를 유지한 채 locale 만 바꿔 이동 (useRouter.replace).
 *  - 로그인 사용자인 경우 PATCH /api/me/locale 도 백그라운드 호출해
 *    DB 의 preferred_locale 을 갱신한다 (실패해도 UI 전환은 진행).
 *  - 토글 직후 useTransition 으로 깜빡임 최소화.
 */
export default function LanguageToggle({ iconOnly = false }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("locale");
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const containerRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 드롭다운 닫기
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const switchTo = (next: Locale) => {
    if (next === locale) {
      setOpen(false);
      return;
    }
    setOpen(false);
    // 1) NEXT_LOCALE 쿠키를 클라이언트에서 즉시 설정 (비로그인도 동작)
    if (typeof document !== "undefined") {
      document.cookie = `NEXT_LOCALE=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    // 2) 로그인 사용자면 서버에도 저장 — 응답을 기다리지 않음 (실패 무시)
    apiFetch("/api/me/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
    // 3) 페이지 새로고침 — 다음 SSR 이 쿠키를 읽어 messages 를 교체.
    //    폴더 [locale]/ 마이그레이션 전이라 URL 은 그대로 유지.
    startTransition(() => {
      window.location.reload();
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-colors ${
          pending ? "opacity-60" : ""
        }`}
        title={t("switchTo", { name: LABELS[locale === "ko" ? "en" : "ko"].native })}
      >
        <Globe size={12} />
        {!iconOnly && (
          <span className="font-medium">{LABELS[locale].short}</span>
        )}
        <ChevronDown size={10} />
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 mt-1 min-w-[140px] rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg z-40 overflow-hidden"
        >
          {SUPPORTED_LOCALES.map((loc) => {
            const active = loc === locale;
            return (
              <li key={loc}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => switchTo(loc)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    active
                      ? "bg-[var(--green)]/10 text-[var(--green)]"
                      : "hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{LABELS[loc].native}</span>
                  {active && <Check size={12} />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "use-intl";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { SUPPORTED_LOCALES, DEFAULT_LOCALE, type Locale } from "@/i18n/routing";
import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
 * 헤더의 한국어/English 토글.
 *
 * 폴더 [locale]/ 마이그레이션 이후 URL prefix 가 정답. 따라서:
 *  - i18n router.replace 로 같은 경로에서 locale 만 갈아끼움
 *    /sites + ko → /sites  (default 라 prefix 없음 — as-needed)
 *    /sites + en → /en/sites
 *    /en/sites + ko → /sites
 *  - SSR 폴백 + DB 저장을 위해 NEXT_LOCALE 쿠키 + PATCH /api/me/locale 도 호출
 *    (실패해도 UI 전환은 진행)
 *
 * router.replace 가 클라이언트 사이드 라우팅으로 URL 을 갱신 — full reload 없이
 * locale 만 바뀌어 깜빡임 최소화. useTransition 으로 그래도 남는 작은 지연 처리.
 */
export default function LanguageToggle({ iconOnly = false }: Props) {
  const locale = useLocale() as Locale;
  const t = useTranslations("locale");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
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
    // 1) NEXT_LOCALE 쿠키 — 외부 링크로 들어왔을 때 SSR 폴백용. 클라이언트에서 set.
    if (typeof document !== "undefined") {
      // 만료 1년. SameSite=Lax 가 OAuth 콜백 호환.
      document.cookie = `NEXT_LOCALE=${next}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    }
    // 2) 로그인 사용자면 서버 DB(user.preferred_locale) 에도 저장. 응답 안 기다림.
    apiFetch("/api/me/locale", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    }).catch(() => {});
    // 3) URL 의 locale prefix 교체 — i18n router 가 as-needed 정책에 맞게 처리.
    //    default(ko) 로 바꾸면 prefix 제거, en 으로 바꾸면 /en/ 추가.
    //    쿼리 보존: 현재 search 가 있으면 그대로 넘김.
    const query: Record<string, string> = {};
    searchParams?.forEach((v, k) => {
      query[k] = v;
    });
    startTransition(() => {
      router.replace(
        { pathname: pathname || "/", query },
        { locale: next },
      );
      // router.replace 로 RSC 다시 가져오기 위해 새로고침 트리거.
      // (locale 만 바뀌면 같은 경로라 RSC payload 가 재요청되지 않을 수 있음)
      router.refresh();
    });
  };

  const nextLocaleForHint = locale === DEFAULT_LOCALE ? "en" : DEFAULT_LOCALE;

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
        title={t("switchTo", { name: LABELS[nextLocaleForHint].native })}
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

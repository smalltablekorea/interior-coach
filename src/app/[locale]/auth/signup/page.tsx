"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  Building2,
  Mail,
  Lock,
  User,
  Phone,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
} from "lucide-react";
import { signIn, signUp } from "@/lib/auth-client";
import { ExpiringBlock } from "@/components/util/ExpiringBlock";

/**
 * 회원가입 직후: 워크스페이스가 없으면 setup?tab=create 로 보내 업체명 입력.
 * (로그인 페이지와 동일한 헬퍼)
 */
async function resolveWorkspaceAndRedirect(
  redirect: string,
  router: AppRouterInstance,
) {
  try {
    const res = await fetch("/api/workspaces", { credentials: "include" });
    if (res.ok) {
      const raw = await res.json();
      const data = (raw?.data ?? raw) as {
        workspaces?: { id: string }[];
        activeWorkspaceId?: string | null;
      };
      const list = data.workspaces ?? [];
      if (list.length > 0) {
        const targetId =
          (data.activeWorkspaceId &&
            list.find((w) => w.id === data.activeWorkspaceId)?.id) ||
          list[0].id;
        if (targetId !== data.activeWorkspaceId) {
          await fetch("/api/workspaces/active", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ workspaceId: targetId }),
          }).catch(() => {});
        }
        document.cookie = "has_workspace=1; path=/; max-age=31536000";
        router.push(redirect);
        return;
      }
    }
  } catch {
    // fallthrough
  }
  router.push("/workspace/setup?tab=create");
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-[var(--muted)]">로딩 중...</p>
        </div>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect =
    searchParams.get("callbackUrl") || searchParams.get("redirect") || "/dashboard";

  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "kakao" | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [providers, setProviders] = useState<{ google: boolean; kakao: boolean }>(
    { google: false, kakao: false },
  );

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setProviders({ google: !!data.google, kakao: !!data.kakao });
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    if (form.password.length < 8) {
      setErrorMsg("비밀번호는 8자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    try {
      const res = await signUp.email({
        email: form.email,
        password: form.password,
        name: form.name,
      });
      if (res.error) {
        setErrorMsg(
          res.error.message?.toLowerCase().includes("already")
            ? "이미 등록된 이메일입니다. 로그인해 주세요."
            : res.error.message || "회원가입에 실패했습니다. 다시 시도해주세요.",
        );
        setIsLoading(false);
        return;
      }

      // 업체명·연락처가 들어오면 워크스페이스 생성 시 사용. 가입 직후 자동 생성 시도.
      // 실패해도 흐름은 막지 않되, 실제 생성 성공 여부에 따라 cookie를 다르게 설정.
      let workspaceCreated = false;
      if (form.companyName.trim()) {
        try {
          const wsRes = await fetch("/api/workspace", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: form.companyName.trim(),
              ceoName: form.name.trim() || undefined,
              phone: form.phone.trim() || undefined,
            }),
          });
          if (wsRes.ok) {
            workspaceCreated = true;
            document.cookie = "has_workspace=1; path=/; max-age=31536000";
          } else {
            console.error("[Signup] workspace creation failed", await wsRes.text());
          }
        } catch (e) {
          console.error("[Signup] workspace creation error", e);
        }
      }

      setSuccessMsg(
        workspaceCreated
          ? "계정과 워크스페이스가 생성되었습니다. 대시보드로 이동합니다."
          : "계정이 생성되었습니다. 워크스페이스 설정으로 이동합니다.",
      );
      setTimeout(() => {
        resolveWorkspaceAndRedirect(redirect, router);
      }, 800);
    } catch {
      setErrorMsg("회원가입에 실패했습니다. 다시 시도해주세요.");
      setIsLoading(false);
    }
  }

  async function handleSocial(provider: "google" | "kakao") {
    setErrorMsg("");
    setSocialLoading(provider);
    try {
      const res = await signIn.social({ provider, callbackURL: redirect });
      if (res.error) {
        setErrorMsg(
          provider === "google"
            ? "Google 가입에 실패했습니다. 다시 시도해주세요."
            : "카카오 가입에 실패했습니다. 다시 시도해주세요.",
        );
      }
    } catch {
      setErrorMsg("소셜 가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSocialLoading(null);
    }
  }

  const busy = isLoading || socialLoading !== null;

  const fields = [
    {
      id: "companyName",
      label: "업체명",
      placeholder: "스몰테이블디자인그룹",
      icon: Building2,
      key: "companyName" as const,
      type: "text",
    },
    {
      id: "name",
      label: "담당자 이름",
      placeholder: "홍길동",
      icon: User,
      key: "name" as const,
      type: "text",
    },
    {
      id: "phone",
      label: "연락처",
      placeholder: "010-1234-5678",
      icon: Phone,
      key: "phone" as const,
      type: "tel",
    },
    {
      id: "email",
      label: "이메일",
      placeholder: "email@company.co.kr",
      icon: Mail,
      key: "email" as const,
      type: "email",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--background)] px-4 py-12">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--green)] opacity-[0.06] blur-[80px]" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* 로고 */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--green)]/10 emerald-glow">
            <Building2 className="h-6 w-6 text-[var(--green)]" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">
              인테리어코치
            </h1>
            <ExpiringBlock
              until="2026-08-01T00:00:00+09:00"
              fallback={
                <p className="mt-1 text-sm text-[var(--muted)]">
                  14일 무료 체험 · 카드 등록 불필요
                </p>
              }
            >
              <p className="mt-1 text-sm text-[var(--green)] font-medium">
                🎉 7/31까지 전체 기능 무료
              </p>
              <p className="mt-0.5 text-xs text-[var(--muted)]">
                카드 등록 불필요 · 모든 Pro 기능 즉시 사용
              </p>
            </ExpiringBlock>
          </div>
        </div>

        {/* 가입 카드 */}
        <div className="glass rounded-2xl p-8">
          <h2 className="mb-6 text-lg font-semibold text-[var(--foreground)]">
            무료로 시작하기
          </h2>

          {errorMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 flex items-start gap-2 rounded-xl bg-[var(--green)]/10 px-3 py-2.5 text-sm text-[var(--green)]">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {fields.map(({ id, label, placeholder, icon: Icon, key, type }) => (
              <div key={id} className="flex flex-col gap-2">
                <label htmlFor={id} className="text-sm text-[var(--muted)]">
                  {label}
                </label>
                <div className="relative">
                  <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                  <input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-transparent border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 focus:outline-none focus:border-[var(--green)]/60 focus:ring-2 focus:ring-[var(--green)]/20"
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            ))}

            <div className="flex flex-col gap-2">
              <label htmlFor="password" className="text-sm text-[var(--muted)]">
                비밀번호 (8자 이상)
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-transparent border border-[var(--border)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted)]/70 focus:outline-none focus:border-[var(--green)]/60 focus:ring-2 focus:ring-[var(--green)]/20"
                  value={form.password}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, password: e.target.value }))
                  }
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-[var(--foreground)]"
                  aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="mt-2 w-full py-2.5 rounded-xl bg-[var(--green)] text-black font-semibold hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50"
            >
              {isLoading ? "계정 생성 중..." : "무료 회원가입"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">또는</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* Social */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => providers.google && handleSocial("google")}
              disabled={busy || !providers.google}
              title={providers.google ? "Google로 시작하기" : "Google OAuth 설정 준비 중"}
              className="w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-white/[0.04] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "google" ? (
                <span>처리 중...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  {providers.google ? "Google로 시작하기" : "Google (준비 중)"}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => providers.kakao && handleSocial("kakao")}
              disabled={busy || !providers.kakao}
              title={providers.kakao ? "카카오로 시작하기" : "카카오 OAuth 설정 준비 중"}
              className="w-full py-2.5 rounded-xl bg-[#FEE500] text-[#191919] text-sm font-medium hover:bg-[#FDD835] transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {socialLoading === "kakao" ? (
                <span>처리 중...</span>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#191919"
                      d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.54-.96 3.47-1 3.64 0 0-.02.08.04.11.06.03.13 0 .13 0 .67-.1 3.87-2.54 4.48-2.97.55.08 1.12.12 1.69.12 5.52 0 10-3.58 10-7.94S17.52 3 12 3z"
                    />
                  </svg>
                  {providers.kakao ? "카카오로 시작하기" : "카카오 (준비 중)"}
                </>
              )}
            </button>

            {(!providers.google || !providers.kakao) && (
              <p className="text-[11px] text-[var(--muted)] text-center leading-relaxed pt-1">
                소셜 가입은 OAuth 키 등록 후 활성화됩니다. <br />
                지금은 이메일로 가입해 주세요.
              </p>
            )}
          </div>

          <p className="mt-5 text-center text-xs text-[var(--muted)]">
            가입 시 이용약관 및 개인정보처리방침에 동의합니다
          </p>
        </div>

        <p className="mt-6 text-center text-sm text-[var(--muted)]">
          이미 계정이 있으신가요?{" "}
          <Link
            href={`/auth/login${redirect !== "/dashboard" ? `?callbackUrl=${encodeURIComponent(redirect)}` : ""}`}
            className="text-[var(--green)] hover:underline font-medium"
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}

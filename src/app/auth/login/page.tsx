"use client";

import { useState, Suspense } from "react";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("callbackUrl") || searchParams.get("redirect") || "/dashboard";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "kakao" | null>(null);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const res = await signUp.email({ email, password, name });
        if (res.error) {
          setError(res.error.message || "회원가입에 실패했습니다. 다시 시도해주세요.");
          setLoading(false);
          return;
        }
      } else {
        const res = await signIn.email({ email, password });
        if (res.error) {
          setError(res.error.message || "이메일 또는 비밀번호를 확인해주세요.");
          setLoading(false);
          return;
        }
      }
      router.push(redirect);
    } catch {
      setError(
        mode === "login"
          ? "이메일 또는 비밀번호를 확인해주세요."
          : "회원가입에 실패했습니다. 다시 시도해주세요."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "google" | "kakao") => {
    setError("");
    setSocialLoading(provider);
    try {
      const res = await signIn.social({
        provider,
        callbackURL: redirect,
      });
      if (res.error) {
        setError(
          provider === "google"
            ? "Google 로그인에 실패했습니다. 다시 시도해주세요."
            : "카카오 로그인에 실패했습니다. 다시 시도해주세요."
        );
      }
    } catch {
      setError("소셜 로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSocialLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--background)]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--green)]">인테리어코치</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            인테리어 업체 업무 관리 플랫폼
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleEmailAuth} className="space-y-4">
          {mode === "signup" && (
            <input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
            />
          )}
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
          />
          <div className="relative">
            <input
              type={showPw ? "text" : "password"}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)]"
            >
              {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="text-sm text-[var(--red)]">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[var(--green)] text-black font-bold hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50"
          >
            {loading
              ? "처리 중..."
              : mode === "login"
              ? "로그인"
              : "회원가입"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-[var(--border)]" />
          <span className="text-xs text-[var(--muted)]">또는</span>
          <div className="flex-1 h-px bg-[var(--border)]" />
        </div>

        {/* Social Login */}
        <div className="space-y-3">
          <button
            onClick={() => handleSocialSignIn("google")}
            disabled={socialLoading !== null || loading}
            className="w-full py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {socialLoading === "google" ? (
              <span>처리 중...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google로 계속하기
              </>
            )}
          </button>

          <button
            onClick={() => handleSocialSignIn("kakao")}
            disabled={socialLoading !== null || loading}
            className="w-full py-3 rounded-xl bg-[#FEE500] text-[#191919] text-sm font-medium hover:bg-[#FDD835] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {socialLoading === "kakao" ? (
              <span>처리 중...</span>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#191919" d="M12 3C6.48 3 2 6.58 2 10.94c0 2.8 1.86 5.27 4.66 6.67-.15.54-.96 3.47-1 3.64 0 0-.02.08.04.11.06.03.13 0 .13 0 .67-.1 3.87-2.54 4.48-2.97.55.08 1.12.12 1.69.12 5.52 0 10-3.58 10-7.94S17.52 3 12 3z" />
                </svg>
                카카오로 계속하기
              </>
            )}
          </button>
        </div>

        {/* Toggle Mode */}
        <p className="text-center text-sm text-[var(--muted)] mt-6">
          {mode === "login" ? "계정이 없으신가요?" : "이미 계정이 있으신가요?"}{" "}
          <button
            onClick={() => {
              setMode(mode === "login" ? "signup" : "login");
              setError("");
            }}
            className="text-[var(--green)] hover:underline"
          >
            {mode === "login" ? "회원가입" : "로그인"}
          </button>
        </p>
      </div>
    </div>
  );
}

"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { isAgencyOperator } from "@/lib/agency/operator";

export default function AgencyLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="p-6 text-sm text-[var(--muted)]">불러오는 중…</div>;
  }

  if (!isAgencyOperator(user?.email)) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 rounded-2xl border border-[var(--border)] text-center">
        <h1 className="text-lg font-bold mb-2">접근 권한 없음</h1>
        <p className="text-sm text-[var(--muted)]">
          마케팅 대행 콘솔은 스몰테이블 운영자만 접근할 수 있습니다.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export default function SettingsPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6 animate-fade-up">
      <h1 className="text-2xl font-bold">설정</h1>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-4">계정 정보</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--muted)]">이름</span>
            <span className="text-sm">{user?.name || "-"}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-[var(--border)]">
            <span className="text-sm text-[var(--muted)]">이메일</span>
            <span className="text-sm">{user?.email || "-"}</span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <h2 className="text-lg font-semibold mb-2">앱 정보</h2>
        <p className="text-sm text-[var(--muted)]">인테리어코치 v0.1.0</p>
      </div>
    </div>
  );
}

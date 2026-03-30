"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Users, ArrowRight, Loader2 } from "lucide-react";

type Tab = "create" | "join";

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("create");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create form
  const [name, setName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [phone, setPhone] = useState("");

  // Join form
  const [inviteCode, setInviteCode] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("업체명을 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, ceoName, businessNumber, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      document.cookie = "has_workspace=1; path=/; max-age=31536000";
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "생성 실패");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) {
      setError("초대코드를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspace/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inviteCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      document.cookie = "has_workspace=1; path=/; max-age=31536000";
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "참여 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            워크스페이스 설정
          </h1>
          <p className="text-[var(--muted)] mt-2">
            인테리어코치를 시작하려면 워크스페이스를 만들거나 참여하세요.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setTab("create"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === "create"
                ? "bg-[var(--green)] text-white"
                : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Building2 size={18} />
            새로 만들기
          </button>
          <button
            onClick={() => { setTab("join"); setError(""); }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === "join"
                ? "bg-[var(--green)] text-white"
                : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Users size={18} />
            참여하기
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-6">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {tab === "create" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  업체명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="예: OO인테리어"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  대표자명
                </label>
                <input
                  type="text"
                  value={ceoName}
                  onChange={(e) => setCeoName(e.target.value)}
                  placeholder="선택사항"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    사업자번호
                  </label>
                  <input
                    type="text"
                    value={businessNumber}
                    onChange={(e) => setBusinessNumber(e.target.value)}
                    placeholder="선택사항"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                    연락처
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="선택사항"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50"
                  />
                </div>
              </div>
              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--green)] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                워크스페이스 만들기
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">
                  초대코드
                </label>
                <input
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="8자리 초대코드 입력"
                  maxLength={8}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50 text-center text-lg tracking-widest font-mono"
                />
              </div>
              <p className="text-xs text-[var(--muted)]">
                워크스페이스 관리자에게 초대코드를 받아 입력하세요.
              </p>
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--green)] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                워크스페이스 참여
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Users,
  ArrowRight,
  Loader2,
  Check,
  Plus,
} from "lucide-react";

type Tab = "select" | "create" | "join";

interface WorkspaceItem {
  id: string;
  name: string;
  slug?: string | null;
  plan?: string | null;
  role: string;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "오너",
  admin: "관리자",
  manager: "매니저",
  member: "멤버",
  viewer: "뷰어",
};

export default function WorkspaceSetupPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("select");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 기존 워크스페이스 목록
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  // Create form
  const [name, setName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [phone, setPhone] = useState("");

  // Join form
  const [inviteCode, setInviteCode] = useState("");

  // 마운트 시 워크스페이스 목록 조회
  useEffect(() => {
    fetch("/api/workspaces", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const list: WorkspaceItem[] = data?.data?.workspaces ?? data?.workspaces ?? [];
        setWorkspaces(list);
        setActiveId(data?.data?.activeWorkspaceId ?? data?.activeWorkspaceId ?? null);
        // 기존 워크스페이스가 없으면 바로 create 탭
        if (list.length === 0) setTab("create");
      })
      .catch(() => {})
      .finally(() => setListLoading(false));
  }, []);

  const handleSelect = async (workspaceId: string) => {
    if (switching) return;
    setSwitching(workspaceId);
    setError("");
    try {
      const res = await fetch("/api/workspaces/active", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ workspaceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.error || "전환 실패");
      document.cookie = "has_workspace=1; path=/; max-age=31536000";
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "전환 실패");
      setSwitching(null);
    }
  };

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
      if (!res.ok) throw new Error(data.error?.message || data.error || "생성 실패");
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
      if (!res.ok) throw new Error(data.error?.message || data.error || "참여 실패");
      document.cookie = "has_workspace=1; path=/; max-age=31536000";
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "참여 실패");
    } finally {
      setLoading(false);
    }
  };

  const hasExisting = workspaces.length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">
            {hasExisting ? "워크스페이스 선택" : "워크스페이스 설정"}
          </h1>
          <p className="text-[var(--muted)] mt-2">
            {hasExisting
              ? "들어갈 워크스페이스를 선택하거나, 새로 만드세요."
              : "인테리어코치를 시작하려면 워크스페이스를 만들거나 참여하세요."}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          {hasExisting && (
            <button
              onClick={() => {
                setTab("select");
                setError("");
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === "select"
                  ? "bg-[var(--green)] text-white"
                  : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Check size={18} />내 워크스페이스 ({workspaces.length})
            </button>
          )}
          <button
            onClick={() => {
              setTab("create");
              setError("");
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-medium transition-all ${
              tab === "create"
                ? "bg-[var(--green)] text-white"
                : "bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <Building2 size={18} />
            {hasExisting ? "새로 만들기" : "새로 만들기"}
          </button>
          <button
            onClick={() => {
              setTab("join");
              setError("");
            }}
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

          {tab === "select" && (
            <div className="space-y-2">
              {listLoading ? (
                <div className="flex items-center justify-center py-8 text-[var(--muted)]">
                  <Loader2 size={20} className="animate-spin" />
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-6">
                  등록된 워크스페이스가 없습니다. 새로 만들거나 초대코드로 참여하세요.
                </p>
              ) : (
                <>
                  {workspaces.map((w) => {
                    const isActive = w.id === activeId;
                    const isLoading = switching === w.id;
                    return (
                      <button
                        key={w.id}
                        onClick={() => handleSelect(w.id)}
                        disabled={!!switching}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left disabled:opacity-50 ${
                          isActive
                            ? "border-[var(--green)] bg-[var(--green)]/5"
                            : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-white/[0.03]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                              isActive
                                ? "bg-[var(--green)]/15"
                                : "bg-white/[0.04]"
                            }`}
                          >
                            <Building2
                              size={18}
                              className={
                                isActive
                                  ? "text-[var(--green)]"
                                  : "text-[var(--muted)]"
                              }
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                              {w.name}
                            </p>
                            <p className="text-xs text-[var(--muted)] mt-0.5">
                              {ROLE_LABELS[w.role] ?? w.role}
                              {w.plan ? ` · ${w.plan}` : ""}
                              {isActive ? " · 현재 활성" : ""}
                            </p>
                          </div>
                        </div>
                        {isLoading ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-[var(--muted)] shrink-0"
                          />
                        ) : (
                          <ArrowRight
                            size={16}
                            className="text-[var(--muted)] shrink-0"
                          />
                        )}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setTab("create")}
                    className="w-full flex items-center justify-center gap-2 mt-3 py-3 rounded-xl border border-dashed border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:border-[var(--border-hover)] transition-colors"
                  >
                    <Plus size={16} />
                    새 워크스페이스 만들기
                  </button>
                </>
              )}
            </div>
          )}

          {tab === "create" && (
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
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
                워크스페이스 만들기
              </button>
            </div>
          )}

          {tab === "join" && (
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
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <ArrowRight size={18} />
                )}
                워크스페이스 참여
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Building2,
  Users,
  ArrowRight,
  Loader2,
  Check,
  Plus,
  Pencil,
  Trash2,
  X,
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

/**
 * 010-XXXX-XXXX 형식으로 자동 포맷팅.
 * 숫자만 입력해도 자동 하이픈 삽입.
 * 010 으로 시작하지 않는 경우엔 011/016 등 옛 번호도 010 으로 강제 X (그냥 raw 표시)
 */
function formatKoreanPhone(value: string): string {
  // 숫자만 추출 (붙여넣기 시 하이픈/공백 자동 제거)
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length < 4) return digits;
  if (digits.length < 8) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}

export default function WorkspaceSetupPage() {
  return (
    <Suspense fallback={<SetupFallback />}>
      <WorkspaceSetupInner />
    </Suspense>
  );
}

function SetupFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <Loader2 size={20} className="animate-spin text-[var(--muted)]" />
    </div>
  );
}

function WorkspaceSetupInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 헤더 셀렉터 등에서 명시적으로 워크스페이스를 바꾸려는 경우 자동 진입 금지.
  const manualMode =
    searchParams.get("manual") === "1" ||
    searchParams.get("switch") === "1" ||
    searchParams.get("tab") != null;
  const queryTab = searchParams.get("tab");
  const initialTab: Tab =
    queryTab === "create" || queryTab === "join" || queryTab === "select"
      ? (queryTab as Tab)
      : "select";

  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 기존 워크스페이스 목록
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [autoEntering, setAutoEntering] = useState(false);

  // 이름 변경 / 삭제
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Create form
  const [name, setName] = useState("");
  const [ceoName, setCeoName] = useState("");
  const [businessNumber, setBusinessNumber] = useState("");
  const [phone, setPhone] = useState("");

  // Join form
  const [inviteCode, setInviteCode] = useState("");

  // 마운트 시 워크스페이스 목록 조회
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/workspaces", { credentials: "include" });
        const data = r.ok ? await r.json() : null;
        if (cancelled) return;
        const list: WorkspaceItem[] = data?.data?.workspaces ?? data?.workspaces ?? [];
        const active: string | null = data?.data?.activeWorkspaceId ?? data?.activeWorkspaceId ?? null;
        setWorkspaces(list);
        setActiveId(active);

        if (list.length === 0) {
          setTab("create");
          return;
        }

        // manualMode 이면 자동 진입 막고 select 탭에서 사용자가 직접 선택.
        if (manualMode) return;

        // 워크스페이스가 2개 이상이면 선택지를 제공 (이름 변경·삭제도 여기서 함)
        // 단 1개면 선택권이 없으므로 곧장 진입.
        if (list.length > 1) return;

        const target = active && list.some((w) => w.id === active) ? active : list[0].id;
        setAutoEntering(true);
        document.cookie = "has_workspace=1; path=/; max-age=31536000";
        if (target !== active) {
          await fetch("/api/workspaces/active", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ workspaceId: target }),
          }).catch(() => {});
        }
        router.replace("/dashboard");
      } catch {
        // 무시 — select 탭에서 수동 선택 가능
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [manualMode, router]);

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

  const canRename = (role: string) => role === "owner" || role === "admin";
  const canDelete = (role: string) => role === "owner";

  const startRename = (w: WorkspaceItem) => {
    setRenamingId(w.id);
    setRenameDraft(w.name);
    setError("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameDraft("");
  };

  const submitRename = async () => {
    if (!renamingId || renaming) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) {
      setError("이름을 입력해주세요.");
      return;
    }
    setRenaming(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${renamingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error?.message || data?.error || "이름 변경 실패");
      setWorkspaces((prev) =>
        prev.map((w) => (w.id === renamingId ? { ...w, name: trimmed } : w))
      );
      cancelRename();
    } catch (err) {
      setError(err instanceof Error ? err.message : "이름 변경 실패");
    } finally {
      setRenaming(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId || deleting) return;
    setDeleting(true);
    setError("");
    try {
      const res = await fetch(`/api/workspaces/${deletingId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message || data?.error || "삭제 실패");
      }
      const removedId = deletingId;
      setWorkspaces((prev) => prev.filter((w) => w.id !== removedId));
      if (activeId === removedId) {
        setActiveId(null);
        document.cookie = "has_workspace=; path=/; max-age=0";
      }
      setDeletingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("업체명을 입력해주세요.");
      return;
    }
    if (phone.trim() && !/^010-\d{4}-\d{4}$/.test(phone.trim())) {
      setError("연락처는 010-XXXX-XXXX 형식으로 입력해주세요.");
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

  // 자동 진입 중에는 깜빡임 없이 전체 화면 스피너만.
  if (autoEntering) return <SetupFallback />;

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
                    const isRenaming = renamingId === w.id;
                    const isDisabled = !!switching || !!renamingId || !!deletingId;
                    return (
                      <div
                        key={w.id}
                        className={`group relative w-full flex items-center justify-between p-4 rounded-xl border transition-all ${
                          isActive
                            ? "border-[var(--green)] bg-[var(--green)]/5"
                            : "border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-white/[0.03]"
                        } ${isDisabled && !isRenaming ? "opacity-50" : ""}`}
                      >
                        <button
                          type="button"
                          onClick={() => !isRenaming && handleSelect(w.id)}
                          disabled={isDisabled}
                          className="flex items-center gap-3 min-w-0 flex-1 text-left"
                        >
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
                          <div className="min-w-0 flex-1">
                            {isRenaming ? (
                              <input
                                type="text"
                                value={renameDraft}
                                onChange={(e) => setRenameDraft(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") submitRename();
                                  if (e.key === "Escape") cancelRename();
                                }}
                                autoFocus
                                className="w-full px-2 py-1 rounded-md bg-[var(--background)] border border-[var(--green)] text-sm text-[var(--foreground)] focus:outline-none"
                              />
                            ) : (
                              <p className="text-sm font-semibold text-[var(--foreground)] truncate">
                                {w.name}
                              </p>
                            )}
                            <p className="text-xs text-[var(--muted)] mt-0.5">
                              {ROLE_LABELS[w.role] ?? w.role}
                              {w.plan ? ` · ${w.plan}` : ""}
                              {isActive ? " · 현재 활성" : ""}
                            </p>
                          </div>
                        </button>
                        {isRenaming ? (
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            <button
                              type="button"
                              onClick={submitRename}
                              disabled={renaming}
                              className="p-2 rounded-lg bg-[var(--green)] text-white hover:opacity-90 disabled:opacity-50"
                              aria-label="저장"
                              title="저장"
                            >
                              {renaming ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Check size={14} />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelRename}
                              disabled={renaming}
                              className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.05]"
                              aria-label="취소"
                              title="취소"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 ml-2 shrink-0">
                            {canRename(w.role) && (
                              <button
                                type="button"
                                onClick={() => startRename(w)}
                                disabled={isDisabled}
                                className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.05] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="이름 변경"
                                title="이름 변경"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                            {canDelete(w.role) && (
                              <button
                                type="button"
                                onClick={() => setDeletingId(w.id)}
                                disabled={isDisabled}
                                className="p-2 rounded-lg text-[var(--muted)] hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                aria-label="삭제"
                                title="삭제"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                            {isLoading ? (
                              <Loader2
                                size={16}
                                className="animate-spin text-[var(--muted)] shrink-0 ml-1"
                              />
                            ) : (
                              <ArrowRight
                                size={16}
                                className="text-[var(--muted)] shrink-0 ml-1"
                              />
                            )}
                          </div>
                        )}
                      </div>
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
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(formatKoreanPhone(e.target.value))}
                    placeholder="010-0000-0000"
                    maxLength={13}
                    pattern="010-\d{4}-\d{4}"
                    title="010-XXXX-XXXX 형식으로 입력해주세요"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50"
                  />
                  <p className="mt-1 text-[11px] text-[var(--muted)]">
                    숫자만 입력해도 010-XXXX-XXXX 형식으로 자동 변환됩니다.
                  </p>
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

      {/* 삭제 확인 모달 */}
      {deletingId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => !deleting && setDeletingId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--foreground)]">
                  워크스페이스 삭제
                </h3>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  되돌릴 수 없습니다.
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--muted)] mb-5 leading-relaxed">
              <span className="text-[var(--foreground)] font-medium">
                {workspaces.find((w) => w.id === deletingId)?.name}
              </span>{" "}
              워크스페이스와 관련된 멤버·권한 데이터가 모두 삭제됩니다.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-500 text-white text-sm font-bold disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

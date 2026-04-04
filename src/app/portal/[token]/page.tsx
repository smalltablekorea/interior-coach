"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Hammer,
  Camera,
  FileEdit,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  X,
  Send,
  Loader2,
  WifiOff,
} from "lucide-react";

// ── Types ──

interface Phase {
  category: string;
  progress: number;
  status: string;
  plannedStart: string | null;
  plannedEnd: string | null;
}

interface Payment {
  type: string;
  amount: number;
  status: string;
  dueDate: string | null;
}

interface Photo {
  id: string;
  url: string;
  date: string;
  category: string | null;
  phase: string | null;
  caption: string | null;
}

interface SiteData {
  id: string;
  name: string;
  status: string;
  address: string | null;
  startDate: string | null;
  endDate: string | null;
  overallProgress: number;
  phases: Phase[];
  totalContract: number;
  totalPaid: number;
  payments: Payment[];
  photos: Photo[];
}

interface PortalData {
  customer: { id: string; name: string };
  sites: SiteData[];
}

interface ChangeRequest {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  createdAt: string;
}

type TabKey = "stages" | "photos" | "requests";

// ── Helpers ──

function fmt(n: number) {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

function fmtDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

const STATUS_ICON: Record<string, typeof CheckCircle> = {
  "완료": CheckCircle,
  "진행중": Clock,
  "지연": AlertTriangle,
  "대기": Pause,
  "보류": Pause,
};

const STATUS_COLOR: Record<string, string> = {
  "완료": "var(--green)",
  "진행중": "var(--blue)",
  "지연": "var(--red)",
  "대기": "var(--muted)",
  "보류": "var(--orange)",
};

const CR_CATEGORY: Record<string, string> = {
  design_change: "설계 변경",
  material_change: "자재 변경",
  schedule_change: "일정 변경",
  defect_report: "하자 보고",
  other: "기타",
};

const CR_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "검토중", color: "var(--orange)" },
  reviewed: { label: "검토완료", color: "var(--blue)" },
  approved: { label: "승인", color: "var(--green)" },
  rejected: { label: "반려", color: "var(--red)" },
};

// ── Main Component ──

export default function PortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PortalData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("stages");
  const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [fullscreenPhoto, setFullscreenPhoto] = useState<Photo | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // 온라인 상태 감지
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    setIsOnline(navigator.onLine);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  // 데이터 fetch
  useEffect(() => {
    fetch(`/api/portal/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.error) setError(res.error);
        else setData(res);
      })
      .catch(() => setError("데이터를 불러올 수 없습니다"))
      .finally(() => setLoading(false));
  }, [token]);

  // 변경요청 fetch
  useEffect(() => {
    fetch(`/api/portal/${token}/change-request`)
      .then((r) => (r.ok ? r.json() : []))
      .then((res) => { if (Array.isArray(res)) setChangeRequests(res); })
      .catch(() => {});
  }, [token]);

  // 변경요청 낙관적 추가
  const handleSubmitRequest = useCallback(async (form: { title: string; description: string; category: string }) => {
    if (!data?.sites[0]) return;
    const tempId = crypto.randomUUID();
    const optimistic: ChangeRequest = {
      id: tempId,
      ...form,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    setChangeRequests((prev) => [optimistic, ...prev]);
    setShowForm(false);

    try {
      const res = await fetch(`/api/portal/${token}/change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, siteId: data.sites[0].id }),
      });
      if (!res.ok) throw new Error();
      const real = await res.json();
      setChangeRequests((prev) => prev.map((r) => (r.id === tempId ? { ...optimistic, id: real.id } : r)));
    } catch {
      setChangeRequests((prev) => prev.filter((r) => r.id !== tempId));
    }
  }, [data, token]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen p-4 space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-28 rounded-2xl animate-shimmer" />
        <div className="h-12 rounded-xl animate-shimmer" />
        <div className="h-64 rounded-2xl animate-shimmer" />
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="max-w-[480px] mx-auto min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertTriangle size={48} className="mx-auto text-[var(--red)] mb-4" />
          <p className="text-lg font-medium">{error}</p>
          <p className="text-sm text-[var(--muted)] mt-2">링크가 만료되었거나 유효하지 않습니다</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const site = data.sites[0];
  if (!site) return <div className="p-4 text-center text-[var(--muted)]">연결된 현장이 없습니다</div>;

  const dDay = site.endDate
    ? Math.ceil((new Date(site.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const completedPhases = site.phases.filter((p) => p.status === "완료").length;

  // 사진 날짜별 그룹핑
  const photoGroups: { date: string; photos: Photo[] }[] = [];
  const photosByDate = new Map<string, Photo[]>();
  for (const p of site.photos) {
    const d = p.date || "미분류";
    if (!photosByDate.has(d)) photosByDate.set(d, []);
    photosByDate.get(d)!.push(p);
  }
  for (const [date, photos] of photosByDate) {
    photoGroups.push({ date, photos });
  }
  photoGroups.sort((a, b) => b.date.localeCompare(a.date));

  const TABS: { key: TabKey; label: string; icon: typeof Hammer; count?: number }[] = [
    { key: "stages", label: "공정 현황", icon: Hammer },
    { key: "photos", label: "현장 사진", icon: Camera, count: site.photos.length },
    { key: "requests", label: "변경요청", icon: FileEdit, count: changeRequests.length },
  ];

  return (
    <div className="max-w-[480px] mx-auto min-h-[100dvh] pb-8">
      {/* ── Offline Banner ── */}
      {!isOnline && (
        <div className="sticky top-0 z-50 bg-[var(--orange)] text-black text-center py-2 text-sm font-medium flex items-center justify-center gap-2">
          <WifiOff size={14} /> 네트워크 연결을 확인하세요
        </div>
      )}

      {/* ══════════════════════
          HEADER
          ══════════════════════ */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] text-[var(--muted)] tracking-wider uppercase">Small Table Design</p>
        </div>
        <h1 className="text-xl font-bold">{site.name}</h1>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-[var(--muted)]">{data.customer.name}님</span>
          {site.address && (
            <>
              <span className="text-xs text-[var(--muted)]">·</span>
              <span className="text-xs text-[var(--muted)]">{site.address}</span>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════
          PROGRESS SUMMARY
          ══════════════════════ */}
      <div className="px-4 mb-5">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 flex items-center gap-5">
          {/* 원형 프로그레스 */}
          <div className="relative w-20 h-20 shrink-0">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="var(--border)" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="var(--green)" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 34}`}
                strokeDashoffset={`${2 * Math.PI * 34 * (1 - site.overallProgress / 100)}`}
                style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
              {site.overallProgress}%
            </span>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[var(--muted)]">전체 진행률</p>
            <p className="text-sm mt-1">
              {site.phases.length}개 공정 중{" "}
              <span className="text-[var(--green)] font-medium">{completedPhases}개 완료</span>
            </p>
            {dDay !== null && (
              <div className="mt-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  dDay < 0 ? "bg-[var(--red)]/10 text-[var(--red)]"
                  : dDay <= 7 ? "bg-[var(--orange)]/10 text-[var(--orange)]"
                  : "bg-[var(--blue)]/10 text-[var(--blue)]"
                }`}>
                  완공까지 {dDay < 0 ? `D+${Math.abs(dDay)}` : `D-${dDay}`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════
          TAB NAVIGATION
          ══════════════════════ */}
      <div className="px-4 mb-4">
        <div className="flex rounded-xl bg-[var(--card)] border border-[var(--border)] p-1 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-[var(--green)] text-black"
                  : "text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <tab.icon size={14} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(" ")[0]}</span>
              {tab.count !== undefined && tab.count > 0 && activeTab !== tab.key && (
                <span className="text-[10px] px-1 rounded-full bg-white/10">{tab.count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════
          TAB CONTENT
          ══════════════════════ */}
      <div className="px-4">
        {/* ── 공정 현황 탭 ── */}
        {activeTab === "stages" && (
          <div className="space-y-2 animate-fade-in">
            {site.phases.length === 0 ? (
              <div className="text-center py-10">
                <Hammer size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-2" />
                <p className="text-sm text-[var(--muted)]">등록된 공정이 없습니다</p>
              </div>
            ) : (
              site.phases.map((phase, i) => {
                const Icon = STATUS_ICON[phase.status] || Clock;
                const color = STATUS_COLOR[phase.status] || "var(--muted)";
                const isActive = phase.status === "진행중";

                return (
                  <div
                    key={i}
                    className={`rounded-xl border p-4 transition-all ${
                      isActive
                        ? "border-[var(--blue)]/40 bg-[var(--blue)]/5"
                        : "border-[var(--border)] bg-[var(--card)]"
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <Icon size={16} style={{ color }} />
                      <span className="text-sm font-medium flex-1">{phase.category}</span>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-medium"
                        style={{ backgroundColor: `${color}15`, color }}
                      >
                        {phase.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${phase.progress}%`, backgroundColor: color }}
                        />
                      </div>
                      <span className="text-[10px] text-[var(--muted)] w-8 text-right">{phase.progress}%</span>
                    </div>
                    {(phase.plannedStart || phase.plannedEnd) && (
                      <p className="text-[10px] text-[var(--muted)] mt-1.5">
                        {fmtDate(phase.plannedStart)} ~ {fmtDate(phase.plannedEnd)}
                      </p>
                    )}
                  </div>
                );
              })
            )}

            {/* 수금 현황 (공정 탭 하단) */}
            {site.payments.length > 0 && (
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 mt-4">
                <h3 className="text-sm font-semibold mb-3">수금 현황</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-lg bg-white/[0.03] p-3 text-center">
                    <p className="text-sm font-bold">{fmt(site.totalContract)}</p>
                    <p className="text-[10px] text-[var(--muted)]">총 계약액</p>
                  </div>
                  <div className="rounded-lg bg-[var(--green)]/5 p-3 text-center">
                    <p className="text-sm font-bold text-[var(--green)]">{fmt(site.totalPaid)}</p>
                    <p className="text-[10px] text-[var(--muted)]">수금액</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {site.payments.map((p, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs">{p.type}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                          p.status === "완납"
                            ? "bg-[var(--green)]/10 text-[var(--green)]"
                            : "bg-[var(--red)]/10 text-[var(--red)]"
                        }`}>{p.status}</span>
                      </div>
                      <span className="text-xs font-medium">{fmt(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 현장 사진 탭 ── */}
        {activeTab === "photos" && (
          <div className="animate-fade-in">
            {site.photos.length === 0 ? (
              <div className="text-center py-10">
                <Camera size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-2" />
                <p className="text-sm text-[var(--muted)]">등록된 사진이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-5">
                {photoGroups.map((group) => (
                  <div key={group.date}>
                    <p className="text-xs text-[var(--muted)] mb-2 font-medium">{fmtDate(group.date)}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {group.photos.map((photo) => (
                        <button
                          key={photo.id}
                          onClick={() => setFullscreenPhoto(photo)}
                          className="relative aspect-square rounded-lg overflow-hidden group"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption || "현장 사진"}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity flex items-end p-2">
                            <div>
                              {photo.category && (
                                <p className="text-white text-[10px] font-medium">{photo.category}</p>
                              )}
                              <p className="text-white/70 text-[9px]">{fmtDate(photo.date)}</p>
                            </div>
                          </div>
                          {photo.phase && (
                            <span className={`absolute top-1 left-1 px-1 py-0.5 rounded text-[9px] font-medium ${
                              photo.phase === "before" ? "bg-[var(--blue)] text-white"
                              : photo.phase === "after" ? "bg-[var(--green)] text-black"
                              : "bg-[var(--orange)] text-black"
                            }`}>
                              {photo.phase === "before" ? "전" : photo.phase === "after" ? "후" : "중"}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── 변경요청 탭 ── */}
        {activeTab === "requests" && (
          <div className="animate-fade-in space-y-3">
            <button
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-[var(--border)] text-sm text-[var(--muted)] hover:border-[var(--green)] hover:text-[var(--green)] transition-colors flex items-center justify-center gap-2"
            >
              <FileEdit size={16} />
              변경요청 작성
            </button>

            {changeRequests.length === 0 ? (
              <div className="text-center py-8">
                <FileEdit size={28} className="mx-auto text-[var(--muted)] opacity-30 mb-2" />
                <p className="text-sm text-[var(--muted)]">변경요청 내역이 없습니다</p>
              </div>
            ) : (
              changeRequests.map((cr) => {
                const st = CR_STATUS[cr.status] || CR_STATUS.pending;
                return (
                  <div key={cr.id} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-medium">{cr.title}</p>
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-medium shrink-0"
                        style={{ backgroundColor: `${st.color}15`, color: st.color }}
                      >
                        {st.label}
                      </span>
                    </div>
                    {cr.description && (
                      <p className="text-xs text-[var(--muted)] mb-1 line-clamp-2">{cr.description}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.06] text-[var(--muted)]">
                        {CR_CATEGORY[cr.category] || cr.category}
                      </span>
                      <span className="text-[10px] text-[var(--muted)]">{fmtDate(cr.createdAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════
          FULLSCREEN PHOTO VIEWER
          ══════════════════════ */}
      {fullscreenPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFullscreenPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
            onClick={() => setFullscreenPhoto(null)}
            aria-label="닫기"
          >
            <X size={20} color="white" />
          </button>
          <img
            src={fullscreenPhoto.url}
            alt={fullscreenPhoto.caption || "현장 사진"}
            className="max-w-full max-h-full object-contain"
            style={{ touchAction: "pinch-zoom" }}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {fullscreenPhoto.category && (
              <p className="text-white text-sm font-medium">{fullscreenPhoto.category}</p>
            )}
            {fullscreenPhoto.caption && (
              <p className="text-white/80 text-xs mt-0.5">{fullscreenPhoto.caption}</p>
            )}
            <p className="text-white/50 text-xs mt-0.5">{fmtDate(fullscreenPhoto.date)}</p>
          </div>
        </div>
      )}

      {/* ══════════════════════
          CHANGE REQUEST BOTTOM SHEET
          ══════════════════════ */}
      {showForm && (
        <ChangeRequestBottomSheet
          onClose={() => setShowForm(false)}
          onSubmit={handleSubmitRequest}
        />
      )}
    </div>
  );
}

// ── Bottom Sheet Form ──

function ChangeRequestBottomSheet({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (form: { title: string; description: string; category: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("other");
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { key: "material_change", label: "자재" },
    { key: "schedule_change", label: "일정" },
    { key: "design_change", label: "설계" },
    { key: "defect_report", label: "하자" },
    { key: "other", label: "기타" },
  ];

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    onSubmit({ title: title.trim(), description: description.trim(), category });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-[var(--card)] border-t border-[var(--border)] rounded-t-2xl max-h-[80vh] overflow-y-auto animate-fade-up">
        <div className="max-w-[480px] mx-auto p-5">
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-[var(--border)] mx-auto mb-4" />

          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold">변경요청 작성</h3>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--border)]" aria-label="닫기">
              <X size={18} className="text-[var(--muted)]" />
            </button>
          </div>

          {/* Category */}
          <div className="mb-4">
            <label className="text-xs text-[var(--muted)] mb-2 block">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setCategory(c.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    category === c.key
                      ? "bg-[var(--green)] text-black"
                      : "bg-white/[0.06] text-[var(--muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-4">
            <label className="text-xs text-[var(--muted)] mb-2 block">제목 *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="변경 내용을 간단히 입력하세요"
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
              maxLength={100}
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="text-xs text-[var(--muted)] mb-2 block">상세 설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="변경이 필요한 이유나 상세 내용을 작성해주세요"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none"
              maxLength={500}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || submitting}
            className="w-full py-3 rounded-xl bg-[var(--green)] text-black text-sm font-semibold hover:bg-[var(--green-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={16} />
                요청 제출
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

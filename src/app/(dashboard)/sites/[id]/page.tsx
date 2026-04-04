"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, User, Calendar, FileText, FileCheck, Hammer,
  Receipt, Camera, Plus, Send, X, ChevronLeft, ChevronRight, MessageCircle,
  Upload, Image as ImageIcon, Pencil, Trash2, Save,
  Package, HardHat, ShieldAlert, CalendarDays, AlertTriangle,
} from "lucide-react";
import Modal from "@/components/ui/Modal";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";
import { TRADES, SITE_STATUSES, BUILDING_TYPES } from "@/lib/constants";
import GaugeChart from "@/components/ui/GaugeChart";

interface Payment {
  type: string;
  amount: number;
  status: string;
  paidDate?: string;
  dueDate?: string;
}

interface ContractRef {
  id: string;
  contractAmount: number;
  contractDate: string;
  payments: Payment[];
}

interface PhaseRef {
  id: string;
  category: string;
  progress: number;
  status: string;
  plannedStart: string;
  plannedEnd: string;
}

interface ExpenseRef {
  category: string;
  amount: number;
}

interface EstimateRef {
  id: string;
  version: number;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface PhotoComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
}

interface Photo {
  id: string;
  url: string;
  thumbnail: string;
  date: string;
  category: string;
  caption: string;
  uploadedBy: string;
  comments: PhotoComment[];
}

interface SiteDetail {
  id: string;
  name: string;
  address: string | null;
  buildingType: string | null;
  areaPyeong: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  customerName: string | null;
  customerId: string | null;
  customerPhone: string | null;
  memo: string | null;
  createdAt: string;
  estimates: EstimateRef[];
  contracts: ContractRef[];
  phases: PhaseRef[];
  expenses: ExpenseRef[];
}

type TabKey = "overview" | "construction" | "estimates" | "contracts" | "materials" | "workers" | "expenses" | "photos" | "defects";

export default function SiteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [site, setSite] = useState<SiteDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>("overview");
  const [healthScore, setHealthScore] = useState<{
    totalScore: number;
    breakdown: Record<string, { score: number; max: number; label: string }>;
  } | null>(null);

  // Edit/delete states for overview tab
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    address: "",
    buildingType: "",
    areaPyeong: "",
    status: "",
    startDate: "",
    endDate: "",
    memo: "",
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Photo state
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [commentText, setCommentText] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [uploadCaption, setUploadCaption] = useState("");
  const [uploadCategory, setUploadCategory] = useState("현장");
  const [uploadPhase, setUploadPhase] = useState("during");
  const [uploadFiles, setUploadFiles] = useState<{ file: File; preview: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [phaseFilter, setPhaseFilter] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const photosLoadedRef = useRef(false);

  useEffect(() => {
    fetch(`/api/sites/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setSite(null);
        else setSite(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch(`/api/sites/${id}/health-score`)
      .then((r) => r.json())
      .then((data) => setHealthScore(data))
      .catch(() => {});
  }, [id]);

  const fetchPhotos = (phase?: string) => {
    setPhotosLoading(true);
    const url = phase ? `/api/sites/${id}/photos?phase=${phase}` : `/api/sites/${id}/photos`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setPhotos(data);
        setPhotosLoading(false);
      })
      .catch(() => setPhotosLoading(false));
  };

  // Load photos when tab switches
  useEffect(() => {
    if (tab === "photos" && !photosLoadedRef.current) {
      photosLoadedRef.current = true;
      fetchPhotos(phaseFilter || undefined);
    }
  }, [tab, id]);

  // Re-fetch when phase filter changes
  useEffect(() => {
    if (tab === "photos" && photosLoadedRef.current) {
      fetchPhotos(phaseFilter || undefined);
    }
  }, [phaseFilter]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      uploadFiles.forEach((f) => URL.revokeObjectURL(f.preview));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEditing = () => {
    if (!site) return;
    setEditForm({
      name: site.name || "",
      address: site.address || "",
      buildingType: site.buildingType || "",
      areaPyeong: site.areaPyeong?.toString() || "",
      status: site.status || "",
      startDate: site.startDate || "",
      endDate: site.endDate || "",
      memo: site.memo || "",
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!site) return;
    setSaving(true);
    const updated: SiteDetail = {
      ...site,
      name: editForm.name,
      address: editForm.address || null,
      buildingType: editForm.buildingType || null,
      areaPyeong: editForm.areaPyeong ? parseFloat(editForm.areaPyeong) : null,
      status: editForm.status,
      startDate: editForm.startDate || null,
      endDate: editForm.endDate || null,
      memo: editForm.memo || null,
    };
    setSite(updated);
    setIsEditing(false);
    setSaving(false);
    try {
      await fetch(`/api/sites/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
    } catch {
      // ignore errors in demo mode
    }
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/sites/${id}`, { method: "DELETE" });
    } catch {
      // ignore errors in demo mode
    }
    router.push("/sites");
  };

  const addComment = async (photoId: string) => {
    if (!commentText.trim()) return;
    const text = commentText.trim();
    setCommentText("");

    try {
      const res = await fetch(`/api/photos/${photoId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName: "나", text }),
      });
      const newComment = res.ok
        ? await res.json()
        : { id: `cm-${Date.now()}`, author: "나", text, createdAt: new Date().toISOString() };

      const comment = { id: newComment.id, author: newComment.authorName || newComment.author || "나", text: newComment.text, createdAt: newComment.createdAt };

      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, comments: [...p.comments, comment] } : p
        )
      );
      if (selectedPhoto?.id === photoId) {
        setSelectedPhoto((prev) =>
          prev ? { ...prev, comments: [...prev.comments, comment] } : prev
        );
      }
    } catch {
      // fallback local comment
      const comment = { id: `cm-${Date.now()}`, author: "나", text, createdAt: new Date().toISOString() };
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, comments: [...p.comments, comment] } : p
        )
      );
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newFiles = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setUploadFiles((prev) => [...prev, ...newFiles]);
  };

  const removeUploadFile = (idx: number) => {
    setUploadFiles((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) return;
    setUploading(true);
    const today = new Date().toISOString().split("T")[0];

    for (const f of uploadFiles) {
      const formData = new FormData();
      formData.append("file", f.file);
      formData.append("caption", uploadCaption || f.file.name);
      formData.append("category", uploadCategory);
      formData.append("phase", uploadPhase);
      formData.append("date", today);

      try {
        const res = await fetch(`/api/sites/${id}/photos`, {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const photo = await res.json();
          setPhotos((prev) => [{ ...photo, comments: photo.comments || [] }, ...prev]);
        }
      } catch {
        // continue with other files
      }
      URL.revokeObjectURL(f.preview);
    }

    setUploadFiles([]);
    setUploadCaption("");
    setShowUpload(false);
    setUploading(false);
  };

  const navigatePhoto = (direction: -1 | 1) => {
    if (!selectedPhoto) return;
    const idx = photos.findIndex((p) => p.id === selectedPhoto.id);
    const next = idx + direction;
    if (next >= 0 && next < photos.length) {
      setSelectedPhoto(photos[next]);
      setCommentText("");
    }
  };

  // Group photos by date
  const photosByDate: Record<string, Photo[]> = {};
  photos.forEach((p) => {
    if (!photosByDate[p.date]) photosByDate[p.date] = [];
    photosByDate[p.date].push(p);
  });
  const sortedDates = Object.keys(photosByDate).sort((a, b) => b.localeCompare(a));

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-[500px] rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!site) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">현장을 찾을 수 없습니다.</p>
        <Link href="/sites" className="text-[var(--green)] hover:underline text-sm mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalExpense = site.expenses.reduce((s, e) => s + e.amount, 0);
  const overallProgress = site.phases.length > 0
    ? Math.round(site.phases.reduce((s, p) => s + p.progress, 0) / site.phases.length)
    : 0;

  const tabs = [
    { key: "overview" as const, label: "기본", icon: MapPin },
    { key: "construction" as const, label: "공정", icon: Hammer, count: site.phases.length },
    { key: "materials" as const, label: "자재", icon: Package },
    { key: "workers" as const, label: "작업자", icon: HardHat },
    { key: "expenses" as const, label: "지출", icon: Receipt },
    { key: "photos" as const, label: "사진", icon: Camera },
    { key: "defects" as const, label: "하자", icon: ShieldAlert },
    { key: "estimates" as const, label: "견적", icon: FileText, count: site.estimates.length },
    { key: "contracts" as const, label: "계약", icon: FileCheck, count: site.contracts.length },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/sites"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{site.name}</h1>
              <StatusBadge status={site.status} />
            </div>
            <p className="text-sm text-[var(--muted)]">
              {site.customerName && <><User size={12} className="inline -mt-0.5 mr-1" />{site.customerName} · </>}
              {site.areaPyeong && `${site.areaPyeong}평 · `}
              {site.address && <><MapPin size={12} className="inline -mt-0.5 mr-0.5" />{site.address}</>}
            </p>
          </div>
        </div>
        {tab === "overview" && (
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm"
                >
                  <Save size={16} />
                  {saving ? "저장 중..." : "저장"}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={startEditing}
                  className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  title="편집"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--red)] transition-colors"
                  title="삭제"
                >
                  <Trash2 size={18} />
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">전체 진행률</span>
          <span className="text-sm font-bold" style={{ color: overallProgress >= 70 ? "var(--green)" : overallProgress >= 30 ? "var(--orange)" : "var(--red)" }}>
            {overallProgress}%
          </span>
        </div>
        <div className="h-2.5 bg-[var(--border)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${overallProgress}%`,
              backgroundColor: overallProgress >= 70 ? "var(--green)" : overallProgress >= 30 ? "var(--orange)" : "var(--red)",
            }}
          />
        </div>
        <div className="flex items-center justify-between mt-2 text-[10px] text-[var(--muted)]">
          <span>시작 {fmtDate(site.startDate)}</span>
          {site.endDate && (
            <span>
              완공 {fmtDate(site.endDate)}
              {(() => {
                const d = Math.ceil((new Date(site.endDate).getTime() - Date.now()) / 86400000);
                return d > 0 ? ` (D-${d})` : d < 0 ? ` (D+${Math.abs(d)})` : " (오늘)";
              })()}
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-2xl font-bold">{overallProgress}%</p>
          <p className="text-xs text-[var(--muted)] mt-1">전체 진행률</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-xl font-bold text-[var(--blue)]">
            {fmt(site.contracts[0]?.contractAmount ?? 0)}
          </p>
          <p className="text-xs text-[var(--muted)] mt-1">계약액</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-xl font-bold text-[var(--orange)]">{fmt(totalExpense)}</p>
          <p className="text-xs text-[var(--muted)] mt-1">지출합계</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-xl font-bold">{site.phases.length}개</p>
          <p className="text-xs text-[var(--muted)] mt-1">공정</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] w-fit overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === t.key
                ? "bg-[var(--card)] text-[var(--foreground)]"
                : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            <t.icon size={15} />
            {t.label}
            {"count" in t && typeof t.count === "number" && t.count > 0 && (
              <span className="text-xs bg-white/[0.08] px-1.5 py-0.5 rounded-full">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== Tab Content ===== */}

      {tab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">현장 정보</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">현장명</label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">주소</label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-1">건물 유형</label>
                    <select
                      value={editForm.buildingType}
                      onChange={(e) => setEditForm({ ...editForm, buildingType: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                    >
                      <option value="">선택</option>
                      {BUILDING_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-1">면적 (평)</label>
                    <input
                      type="number"
                      value={editForm.areaPyeong}
                      onChange={(e) => setEditForm({ ...editForm, areaPyeong: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                  >
                    {SITE_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-1">시작일</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-[var(--muted)] mb-1">종료일</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
                  <textarea
                    value={editForm.memo}
                    onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none h-20"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-sm">
                {site.address && (
                  <div className="flex items-start gap-3">
                    <MapPin size={16} className="text-[var(--muted)] mt-0.5" />
                    <span>{site.address}</span>
                  </div>
                )}
                {site.customerName && (
                  <div className="flex items-center gap-3">
                    <User size={16} className="text-[var(--muted)]" />
                    <Link href={`/customers/${site.customerId}`} className="text-[var(--green)] hover:underline">
                      {site.customerName}
                    </Link>
                    {site.customerPhone && <span className="text-[var(--muted)]">{site.customerPhone}</span>}
                  </div>
                )}
                {(site.startDate || site.endDate) && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-[var(--muted)]" />
                    <span>
                      {site.startDate && fmtDate(site.startDate)}
                      {site.endDate && ` ~ ${fmtDate(site.endDate)}`}
                    </span>
                  </div>
                )}
                {site.memo && (
                  <div className="mt-3 p-3 rounded-xl bg-white/[0.03] text-[var(--muted)]">
                    {site.memo}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="space-y-4">
            {/* Health Score */}
            {healthScore && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <h2 className="text-sm font-semibold text-[var(--muted)] mb-3">헬스 스코어</h2>
                <div className="flex items-center gap-6">
                  <GaugeChart score={healthScore.totalScore} size={100} />
                  <div className="flex-1 space-y-2">
                    {Object.values(healthScore.breakdown).map((item) => (
                      <div key={item.label} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--muted)] w-20">{item.label}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(item.score / item.max) * 100}%`,
                              backgroundColor: item.score / item.max >= 0.7 ? "var(--green)" : item.score / item.max >= 0.5 ? "var(--orange)" : "var(--red)",
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium w-10 text-right">{item.score}/{item.max}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Expenses */}
            {site.expenses.length > 0 && (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Receipt size={16} className="text-[var(--muted)]" />
                  <h2 className="text-sm font-semibold text-[var(--muted)]">지출 현황</h2>
                </div>
                <div className="space-y-3">
                  {site.expenses.map((e) => (
                    <div key={e.category} className="flex items-center justify-between">
                      <span className="text-sm">{e.category}</span>
                      <span className="text-sm font-medium">{fmt(e.amount)}</span>
                    </div>
                  ))}
                  <div className="border-t border-[var(--border)] pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold">합계</span>
                    <span className="text-sm font-bold">{fmt(totalExpense)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="현장 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">
            <span className="text-[var(--foreground)] font-medium">{site.name}</span> 현장을 삭제하시겠습니까?<br />
            이 작업은 되돌릴 수 없습니다.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteConfirm(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              취소
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm"
            >
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>
      </Modal>

      {tab === "photos" && (
        <div className="space-y-6">
          {/* Phase Filter + Upload buttons */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              {[
                { key: "", label: "전체" },
                { key: "before", label: "시공 전" },
                { key: "during", label: "시공 중" },
                { key: "after", label: "시공 후" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setPhaseFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    phaseFilter === f.key
                      ? "bg-[var(--border)] text-white"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="text-sm text-[var(--muted)] ml-2">
                {photos.length}장
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Camera capture button (mobile) */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--border)] transition-colors"
              >
                <Camera size={16} />
                촬영
              </button>
              <button
                onClick={() => setShowUpload(!showUpload)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm"
              >
                <Plus size={16} />
                사진 업로드
              </button>
            </div>
          </div>

          {/* Upload panel */}
          {showUpload && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 space-y-4">
              <h3 className="font-semibold">사진 업로드</h3>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-[var(--border)] rounded-xl p-8 flex flex-col items-center gap-2 hover:border-[var(--green)] transition-colors"
              >
                <Upload size={32} className="text-[var(--muted)]" />
                <span className="text-sm text-[var(--muted)]">클릭하여 사진 선택 (여러 장 가능)</span>
              </button>

              {/* Preview uploaded files */}
              {uploadFiles.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                  {uploadFiles.map((f, idx) => (
                    <div key={idx} className="relative aspect-square rounded-lg overflow-hidden">
                      <img src={f.preview} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeUploadFile(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 flex items-center justify-center"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">공종 분류</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                  >
                    {["현장", ...TRADES].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">단계</label>
                  <select
                    value={uploadPhase}
                    onChange={(e) => setUploadPhase(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                  >
                    <option value="before">시공 전</option>
                    <option value="during">시공 중</option>
                    <option value="after">시공 후</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-[var(--muted)] mb-1">설명</label>
                  <input
                    type="text"
                    value={uploadCaption}
                    onChange={(e) => setUploadCaption(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                    placeholder="사진 설명 (선택)"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => { setShowUpload(false); setUploadFiles([]); }}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
                >
                  취소
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploadFiles.length === 0 || uploading}
                  className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
                >
                  {uploading ? "업로드 중..." : `${uploadFiles.length}장 업로드`}
                </button>
              </div>
            </div>
          )}

          {/* Photos by date */}
          {photosLoading ? (
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="aspect-square rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-16">
              <ImageIcon size={48} className="mx-auto text-[var(--muted)] mb-3" />
              <p className="text-[var(--muted)]">등록된 사진이 없습니다</p>
              <p className="text-sm text-[var(--muted)] mt-1">시공 사진을 업로드해보세요</p>
            </div>
          ) : (
            sortedDates.map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar size={14} className="text-[var(--muted)]" />
                  <h3 className="text-sm font-semibold">{fmtDate(date)}</h3>
                  <span className="text-xs text-[var(--muted)]">{photosByDate[date].length}장</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
                  {photosByDate[date].map((photo) => (
                    <div
                      key={photo.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
                    >
                      {/* Thumbnail */}
                      <button
                        onClick={() => { setSelectedPhoto(photo); setCommentText(""); }}
                        className="group relative w-full aspect-square overflow-hidden"
                      >
                        <img
                          src={photo.thumbnail}
                          alt={photo.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {photo.comments.length > 0 && (
                          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 rounded-full px-1.5 py-0.5">
                            <MessageCircle size={10} className="text-white" />
                            <span className="text-[10px] text-[var(--foreground)] font-medium">{photo.comments.length}</span>
                          </div>
                        )}
                      </button>

                      {/* Caption + comments */}
                      <div className="p-2.5 space-y-1.5">
                        <p className="text-[11px] font-medium truncate">{photo.caption}</p>
                        {photo.comments.length > 0 && (
                          <div className="space-y-1">
                            {photo.comments.slice(-1).map((c) => (
                              <p key={c.id} className="text-[11px] leading-tight truncate">
                                <span className="font-medium">{c.author}</span>{" "}
                                <span className="text-[var(--muted)]">{c.text}</span>
                              </p>
                            ))}
                          </div>
                        )}
                        {/* Inline comment */}
                        <input
                          type="text"
                          placeholder="댓글..."
                          className="w-full bg-transparent text-[11px] placeholder:text-[var(--muted)] focus:outline-none border-t border-[var(--border)] pt-1.5"
                          onKeyDown={async (e) => {
                            if (e.key === "Enter" && (e.target as HTMLInputElement).value.trim()) {
                              const text = (e.target as HTMLInputElement).value.trim();
                              (e.target as HTMLInputElement).value = "";
                              try {
                                const res = await fetch(`/api/photos/${photo.id}/comments`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ authorName: "나", text }),
                                });
                                const c = res.ok ? await res.json() : null;
                                const comment = c
                                  ? { id: c.id, author: c.authorName || "나", text: c.text, createdAt: c.createdAt }
                                  : { id: `cm-${Date.now()}`, author: "나", text, createdAt: new Date().toISOString() };
                                setPhotos((prev) =>
                                  prev.map((p) =>
                                    p.id === photo.id ? { ...p, comments: [...p.comments, comment] } : p
                                  )
                                );
                              } catch {
                                setPhotos((prev) =>
                                  prev.map((p) =>
                                    p.id === photo.id
                                      ? { ...p, comments: [...p.comments, { id: `cm-${Date.now()}`, author: "나", text, createdAt: new Date().toISOString() }] }
                                      : p
                                  )
                                );
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Photo Lightbox */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex" onClick={() => setSelectedPhoto(null)}>
          {/* Image side */}
          <div className="flex-1 relative flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 left-4 w-9 h-9 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-white/20 z-10"
            >
              <X size={20} />
            </button>

            {/* Nav arrows */}
            <button
              onClick={() => navigatePhoto(-1)}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-white/20"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={() => navigatePhoto(1)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[var(--border)] flex items-center justify-center hover:bg-white/20"
            >
              <ChevronRight size={24} />
            </button>

            <img
              src={selectedPhoto.url}
              alt={selectedPhoto.caption}
              className="max-h-[85vh] max-w-full object-contain"
            />

            {/* Caption bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 px-6 py-3">
              <p className="text-[var(--foreground)] font-medium">{selectedPhoto.caption}</p>
              <p className="text-sm text-white/60">
                {selectedPhoto.uploadedBy} · {selectedPhoto.category} · {fmtDate(selectedPhoto.date)}
              </p>
            </div>
          </div>

          {/* Comments sidebar */}
          <div
            className="w-[360px] bg-[#111] border-l border-[var(--border)] flex flex-col h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[var(--border)]">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle size={16} />
                댓글 {selectedPhoto.comments.length}
              </h3>
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selectedPhoto.comments.length === 0 ? (
                <p className="text-sm text-[var(--muted)] text-center py-8">
                  아직 댓글이 없습니다
                </p>
              ) : (
                selectedPhoto.comments.map((c) => (
                  <div key={c.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-[var(--green)]/10 flex items-center justify-center text-[var(--green)] text-xs font-bold">
                        {c.author.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{c.author}</span>
                      <span className="text-xs text-[var(--muted)]">
                        {fmtDate(c.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm pl-8 text-[var(--foreground)]">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Comment input */}
            <div className="p-4 border-t border-[var(--border)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      addComment(selectedPhoto.id);
                    }
                  }}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
                />
                <button
                  onClick={() => addComment(selectedPhoto.id)}
                  disabled={!commentText.trim()}
                  className="w-10 h-10 rounded-xl bg-[var(--green)] text-black flex items-center justify-center disabled:opacity-30"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === "estimates" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          {site.estimates.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">견적서가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {site.estimates.map((e) => (
                <Link
                  key={e.id}
                  href={`/estimates/${e.id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-medium">v{e.version}</span>
                    <StatusBadge status={e.status} />
                    <span className="text-xs text-[var(--muted)]">{fmtDate(e.createdAt)}</span>
                  </div>
                  <p className="font-bold">{fmt(e.totalAmount)}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "contracts" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          {site.contracts.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">계약이 없습니다.</p>
          ) : (
            <div className="space-y-4">
              {site.contracts.map((c) => {
                const paid = c.payments.filter((p) => p.status === "완납").reduce((s, p) => s + p.amount, 0);
                const paidPct = c.contractAmount > 0 ? Math.round((paid / c.contractAmount) * 100) : 0;
                return (
                  <Link key={c.id} href={`/contracts/${c.id}`} className="block p-4 rounded-xl bg-white/[0.02] hover:bg-[var(--border)] transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-medium">계약일 {fmtDate(c.contractDate)}</p>
                      <p className="text-lg font-bold">{fmt(c.contractAmount)}</p>
                    </div>
                    <div className="h-2 rounded-full bg-white/[0.06] overflow-hidden mb-2">
                      <div className="h-full rounded-full bg-[var(--green)]" style={{ width: `${paidPct}%` }} />
                    </div>
                    <div className="flex gap-2">
                      {c.payments.map((p) => (
                        <div key={p.type} className="flex-1 text-center">
                          <p className="text-xs text-[var(--muted)]">{p.type}</p>
                          <p className="text-sm font-medium">{fmt(p.amount)}</p>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "construction" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          {site.phases.length === 0 ? (
            <p className="text-sm text-[var(--muted)] text-center py-8">등록된 공정이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {site.phases.map((p) => (
                <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02]">
                  <div className="w-16 text-sm font-medium">{p.category}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${p.progress}%`,
                            backgroundColor:
                              p.progress >= 100 ? "var(--green)" : p.progress > 0 ? "var(--blue)" : "var(--muted)",
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">{p.progress}%</span>
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {fmtDate(p.plannedStart)} ~ {fmtDate(p.plannedEnd)}
                    </div>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* ===== 자재 탭 ===== */}
      {tab === "materials" && (
        <SiteTabPlaceholder
          icon={Package}
          title="자재 관리"
          desc="이 현장에 발주된 자재 목록과 입고 상태를 확인합니다"
          linkHref={`/materials?siteId=${id}`}
          linkLabel="자재 관리로 이동"
        />
      )}

      {/* ===== 작업자 탭 ===== */}
      {tab === "workers" && (
        <SiteTabPlaceholder
          icon={HardHat}
          title="작업자 배정"
          desc="이 현장에 배정된 작업자 목록과 투입 일정을 확인합니다"
          linkHref={`/workers?siteId=${id}`}
          linkLabel="작업자 관리로 이동"
        />
      )}

      {/* ===== 지출 탭 ===== */}
      {tab === "expenses" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">지출 내역</h2>
            <Link href={`/expenses?siteId=${id}`} className="text-xs text-[var(--green)] hover:underline">
              지출 관리 →
            </Link>
          </div>
          {site.expenses.length === 0 ? (
            <div className="text-center py-8">
              <Receipt size={28} className="mx-auto text-[var(--muted)] opacity-30 mb-2" />
              <p className="text-sm text-[var(--muted)]">등록된 지출이 없습니다</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <p className="text-lg font-bold text-[var(--orange)]">{fmt(totalExpense)}</p>
                  <p className="text-[10px] text-[var(--muted)]">총 지출</p>
                </div>
                <div className="rounded-xl bg-white/[0.03] p-3 text-center">
                  <p className="text-lg font-bold">{fmt(site.contracts[0]?.contractAmount ?? 0)}</p>
                  <p className="text-[10px] text-[var(--muted)]">계약액</p>
                </div>
              </div>
              {site.contracts[0]?.contractAmount && (
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
                    <span>예산 소진률</span>
                    <span>{Math.round((totalExpense / site.contracts[0].contractAmount) * 100)}%</span>
                  </div>
                  <div className="h-2 bg-[var(--border)] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((totalExpense / site.contracts[0].contractAmount) * 100, 100)}%`,
                        backgroundColor: totalExpense > site.contracts[0].contractAmount ? "var(--red)" : "var(--orange)",
                      }}
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                {site.expenses.map((e, i) => (
                  <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/[0.02]">
                    <span className="text-sm">{e.category}</span>
                    <span className="text-sm font-medium">{fmt(e.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== 하자 탭 ===== */}
      {tab === "defects" && (
        <SiteTabPlaceholder
          icon={ShieldAlert}
          title="하자 관리"
          desc="이 현장의 하자 목록과 처리 상태를 확인합니다"
          linkHref={`/construction?siteId=${id}&tab=defects`}
          linkLabel="하자 관리로 이동"
        />
      )}
    </div>
  );
}

// ── 탭 플레이스홀더 (자재/작업자/하자 → 해당 페이지 링크) ──
function SiteTabPlaceholder({
  icon: Icon,
  title,
  desc,
  linkHref,
  linkLabel,
}: {
  icon: typeof Package;
  title: string;
  desc: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
      <Icon size={32} className="mx-auto text-[var(--muted)] opacity-30 mb-3" />
      <h3 className="text-sm font-semibold mb-1">{title}</h3>
      <p className="text-xs text-[var(--muted)] mb-4">{desc}</p>
      <Link
        href={linkHref}
        className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
      >
        {linkLabel} <ChevronRight size={14} />
      </Link>
    </div>
  );
}

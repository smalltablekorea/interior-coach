"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Trash2, Loader2, Save } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { KoreanTextarea } from "@/components/ui/KoreanInput";
import { apiFetch } from "@/lib/api-client";
import { fmtDate } from "@/lib/utils";
import type { Defect, DefectSeverity, DefectStatus } from "@/types/defect";

const STATUS_OPTIONS: { key: DefectStatus; label: string; color: string }[] = [
  { key: "reported", label: "접수", color: "var(--red)" },
  { key: "in_progress", label: "진행중", color: "var(--orange)" },
  { key: "resolved", label: "해결됨", color: "var(--blue)" },
  { key: "closed", label: "종료", color: "var(--green)" },
];

const SEVERITY_OPTIONS: { key: DefectSeverity; label: string; color: string }[] = [
  { key: "minor", label: "경미", color: "var(--muted)" },
  { key: "major", label: "중대", color: "var(--orange)" },
  { key: "critical", label: "심각", color: "var(--red)" },
];

export default function DefectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [defect, setDefect] = useState<Defect | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resolution, setResolution] = useState("");
  const [showDelete, setShowDelete] = useState(false);

  useEffect(() => {
    apiFetch(`/api/defects/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const d = data?.data ?? data;
        if (d?.id) {
          setDefect(d);
          setResolution(d.resolutionNote || "");
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const updateField = async (patch: Partial<Defect>) => {
    if (!defect) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/defects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (res.ok) {
        const data = await res.json();
        const updated = data?.data ?? data;
        if (updated?.id) setDefect(updated);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const res = await apiFetch(`/api/defects/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/defects");
  };

  if (loading) {
    return <div className="h-32 rounded-2xl animate-shimmer" />;
  }
  if (!defect) {
    return <p className="text-sm text-[var(--muted)]">하자를 찾을 수 없습니다.</p>;
  }

  const severityInfo = SEVERITY_OPTIONS.find((s) => s.key === defect.severity);

  return (
    <div className="space-y-6 animate-fade-up max-w-3xl">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/defects"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)]"
            aria-label="하자 목록으로"
          >
            <ArrowLeft size={18} />
          </Link>
          <ShieldAlert size={22} className="text-[var(--red)]" />
          <div>
            <h1 className="text-lg font-bold">{defect.title}</h1>
            <p className="text-xs text-[var(--muted)]">
              {defect.siteName || "-"} · {defect.tradeName} · {fmtDate(defect.reportedAt)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowDelete(true)}
          className="p-2 rounded-lg text-[var(--muted)] hover:text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
          aria-label="하자 삭제"
          title="삭제"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* 상태 탭 */}
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((s) => {
          const active = defect.status === s.key;
          return (
            <button
              key={s.key}
              onClick={() => !active && updateField({ status: s.key })}
              disabled={saving}
              className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                active ? "border-[var(--green)] bg-[var(--green)]/10" : "border-[var(--border)] hover:bg-white/[0.04]"
              }`}
              style={{ color: active ? s.color : "var(--muted)" }}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {/* 메타 정보 */}
      <div className="grid sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs text-[var(--muted)]">심각도</p>
          <p className="mt-1 text-sm font-bold" style={{ color: severityInfo?.color }}>
            {severityInfo?.label}
          </p>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs text-[var(--muted)]">담당자</p>
          <p className="mt-1 text-sm">{defect.assignedToName || "미지정"}</p>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs text-[var(--muted)]">해결일</p>
          <p className="mt-1 text-sm">{defect.resolvedAt ? fmtDate(defect.resolvedAt) : "—"}</p>
        </div>
      </div>

      {/* 본문 */}
      {defect.description && (
        <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <p className="text-xs font-semibold text-[var(--muted)] mb-2">설명</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{defect.description}</p>
        </div>
      )}

      {/* 심각도 변경 */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <p className="text-xs font-semibold text-[var(--muted)] mb-3">심각도 변경</p>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => defect.severity !== s.key && updateField({ severity: s.key })}
              disabled={saving}
              className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                defect.severity === s.key ? "border-[var(--green)]" : "border-[var(--border)]"
              }`}
              style={{ color: defect.severity === s.key ? s.color : "var(--muted)" }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* 해결 노트 */}
      <div className="p-5 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-[var(--muted)]">해결 조치 노트</p>
          <button
            onClick={() => updateField({ resolutionNote: resolution })}
            disabled={saving || resolution === (defect.resolutionNote || "")}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--green)] text-black text-xs font-bold disabled:opacity-40"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            저장
          </button>
        </div>
        <KoreanTextarea
          value={resolution}
          onChange={setResolution}
          rows={4}
          placeholder="어떻게 해결했는지 기록"
          className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
        />
      </div>

      {/* 삭제 확인 */}
      <Modal open={showDelete} onClose={() => setShowDelete(false)} title="하자 삭제">
        <p className="text-sm text-[var(--muted)]">
          <span className="font-medium text-[var(--foreground)]">{defect.title}</span> 을(를) 삭제합니다. 되돌릴 수 없습니다.
        </p>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={() => setShowDelete(false)}
            className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm"
          >
            취소
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 rounded-xl bg-[var(--red)] text-white text-sm font-bold"
          >
            삭제
          </button>
        </div>
      </Modal>
    </div>
  );
}

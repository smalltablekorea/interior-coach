"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, Save, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api-client";
import { KoreanInput, KoreanTextarea } from "@/components/ui/KoreanInput";
import { TRADES } from "@/lib/constants";
import type { DefectSeverity, CreateDefectRequest } from "@/types/defect";

interface Site { id: string; name: string; }

function NewDefectFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const presetSiteId = searchParams.get("siteId") || "";

  const [sites, setSites] = useState<Site[]>([]);
  const [form, setForm] = useState<CreateDefectRequest>({
    siteId: presetSiteId,
    tradeId: "",
    tradeName: "",
    title: "",
    description: "",
    severity: "minor",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/api/sites")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items ?? [];
        setSites(list);
      })
      .catch(() => {});
  }, []);

  const setTrade = (name: string) => {
    setForm((f) => ({ ...f, tradeId: name, tradeName: name }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setError(null);

    if (!form.siteId) return setError("현장을 선택해주세요.");
    if (!form.tradeName) return setError("공종을 선택해주세요.");
    if (!form.title.trim()) return setError("하자 제목을 입력해주세요.");

    setSaving(true);
    try {
      const res = await apiFetch("/api/defects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || !data?.success) {
        setError(data?.error?.message || data?.error || "등록에 실패했습니다.");
        setSaving(false);
        return;
      }
      const newId = data?.data?.id;
      router.push(newId ? `/defects/${newId}` : "/defects");
    } catch (err) {
      setError(err instanceof Error ? err.message : "등록에 실패했습니다.");
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-up max-w-2xl">
      <div className="flex items-center gap-3">
        <Link
          href="/defects"
          className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-[var(--border)] transition-colors"
          aria-label="하자 목록으로"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <ShieldAlert size={22} className="text-[var(--red)]" />
          <h1 className="text-xl font-bold">하자 등록</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">현장 *</label>
          <select
            value={form.siteId}
            onChange={(e) => setForm({ ...form, siteId: e.target.value })}
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
            required
          >
            <option value="">현장 선택</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">공종 *</label>
          <div className="flex flex-wrap gap-1.5">
            {TRADES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrade(t)}
                className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                  form.tradeName === t
                    ? "bg-[var(--green)] text-black border-[var(--green)]"
                    : "bg-transparent border-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">하자 제목 *</label>
          <KoreanInput
            value={form.title}
            onChange={(v) => setForm({ ...form, title: v })}
            placeholder="예: 거실 천장 우측 누수 흔적"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">상세 설명</label>
          <KoreanTextarea
            value={form.description || ""}
            onChange={(v) => setForm({ ...form, description: v })}
            rows={4}
            placeholder="발견 상황, 필요 조치 등"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">심각도 *</label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { key: "minor", label: "경미", color: "var(--muted)" },
                { key: "major", label: "중대", color: "var(--orange)" },
                { key: "critical", label: "심각", color: "var(--red)" },
              ] as { key: DefectSeverity; label: string; color: string }[]
            ).map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setForm({ ...form, severity: s.key })}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  form.severity === s.key ? "border-[var(--green)]" : "border-[var(--border)] hover:border-[var(--border-hover)]"
                }`}
                style={{
                  color: form.severity === s.key ? s.color : "var(--muted)",
                  background: form.severity === s.key ? `color-mix(in srgb, ${s.color} 10%, transparent)` : "transparent",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[var(--muted)] mb-2">담당자 이름 (선택)</label>
          <KoreanInput
            value={form.assignedToName || ""}
            onChange={(v) => setForm({ ...form, assignedToName: v })}
            placeholder="예: 김반장"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
          />
        </div>

        {error && <p className="text-sm text-[var(--red)]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/defects"
            className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm hover:bg-white/[0.04]"
          >
            취소
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-bold disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "등록 중..." : "등록"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewDefectPage() {
  return (
    <Suspense fallback={<div className="text-sm text-[var(--muted)]">로딩 중...</div>}>
      <NewDefectFormInner />
    </Suspense>
  );
}

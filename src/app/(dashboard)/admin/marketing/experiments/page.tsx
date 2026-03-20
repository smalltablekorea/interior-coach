"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  FlaskConical,
  X,
  Trophy,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MktExperimentStatus } from "@/lib/types/marketing";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  running: "실행중",
  completed: "완료",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  running: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  completed: { bg: "bg-blue-500/10", text: "text-blue-400" },
};

interface ExperimentVariant {
  id: string;
  name: string;
  description: string | null;
  content: Record<string, unknown> | null;
  trafficWeight: number;
  impressions: number;
  clicks: number;
  conversions: number;
  conversionRate: number;
  isControl: boolean;
}

interface Experiment {
  id: string;
  name: string;
  description: string | null;
  targetElement: string | null;
  status: string;
  primaryMetric: string | null;
  startDate: string | null;
  endDate: string | null;
  trafficPercent: number;
  winnerVariantId: string | null;
  variants: ExperimentVariant[];
  createdAt: string;
}

const METRIC_LABELS: Record<string, string> = {
  click_rate: "클릭률",
  upload_start_rate: "업로드 시작률",
  checkout_rate: "결제 시작률",
  payment_rate: "결제 전환율",
};

const ELEMENT_LABELS: Record<string, string> = {
  headline: "헤드라인",
  cta: "CTA 버튼",
  price_copy: "가격 문구",
  review_block: "리뷰 블록",
};

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const fetchExperiments = () => {
    setLoading(true);
    fetch("/api/admin/marketing/experiments")
      .then((r) => r.json())
      .then((d) => {
        setExperiments(d.experiments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const updateStatus = (id: string, status: string) => {
    fetch("/api/admin/marketing/experiments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).then(() => fetchExperiments());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          총 {experiments.length}개 실험
        </p>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> 실험 추가
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : experiments.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <FlaskConical size={32} className="mx-auto mb-2" />
          <p className="text-sm">실험이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {experiments.map((exp) => {
            const sColor = STATUS_COLORS[exp.status] || STATUS_COLORS.draft;
            const winner = exp.winnerVariantId
              ? exp.variants.find((v) => v.id === exp.winnerVariantId)
              : null;

            return (
              <div
                key={exp.id}
                className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <FlaskConical size={14} className="text-purple-400" />
                      <h3 className="font-medium">{exp.name}</h3>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          sColor.bg,
                          sColor.text
                        )}
                      >
                        {STATUS_LABELS[exp.status] || exp.status}
                      </span>
                    </div>
                    {exp.description && (
                      <p className="text-xs text-[var(--muted)] ml-5">
                        {exp.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {exp.status === "draft" && (
                      <button
                        onClick={() => updateStatus(exp.id, "running")}
                        className="px-2 py-1 rounded text-[10px] bg-[var(--green)]/10 text-[var(--green)] hover:bg-[var(--green)]/20"
                      >
                        시작
                      </button>
                    )}
                    {exp.status === "running" && (
                      <button
                        onClick={() => updateStatus(exp.id, "completed")}
                        className="px-2 py-1 rounded text-[10px] bg-blue-500/10 text-blue-400 hover:bg-blue-500/20"
                      >
                        종료
                      </button>
                    )}
                  </div>
                </div>

                {/* Info Tags */}
                <div className="flex flex-wrap gap-1.5 mb-3 ml-5">
                  {exp.targetElement && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400">
                      {ELEMENT_LABELS[exp.targetElement] || exp.targetElement}
                    </span>
                  )}
                  {exp.primaryMetric && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400">
                      {METRIC_LABELS[exp.primaryMetric] || exp.primaryMetric}
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-[var(--muted)]">
                    트래픽 {exp.trafficPercent}%
                  </span>
                  {exp.startDate && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-[var(--muted)]">
                      {exp.startDate}
                      {exp.endDate ? ` ~ ${exp.endDate}` : " ~"}
                    </span>
                  )}
                </div>

                {/* Winner Banner */}
                {winner && (
                  <div className="p-2 rounded-lg bg-[var(--green)]/5 border border-[var(--green)]/20 mb-3 ml-5 flex items-center gap-2">
                    <Trophy size={14} className="text-[var(--green)]" />
                    <span className="text-xs font-medium text-[var(--green)]">
                      승자: {winner.name} ({(winner.conversionRate * 100).toFixed(1)}%)
                    </span>
                  </div>
                )}

                {/* Variants */}
                {exp.variants.length > 0 && (
                  <div className="ml-5 space-y-1.5">
                    {exp.variants.map((variant) => {
                      const isWinner = variant.id === exp.winnerVariantId;
                      return (
                        <div
                          key={variant.id}
                          className={cn(
                            "p-2.5 rounded-lg border",
                            isWinner
                              ? "border-[var(--green)]/30 bg-[var(--green)]/5"
                              : "border-[var(--border)] bg-white/[0.02]"
                          )}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">
                                {variant.name}
                              </span>
                              {variant.isControl && (
                                <span className="px-1 py-0.5 rounded text-[9px] bg-white/[0.06] text-[var(--muted)]">
                                  대조군
                                </span>
                              )}
                              {isWinner && (
                                <Trophy size={10} className="text-[var(--green)]" />
                              )}
                            </div>
                            <span className="text-[10px] text-[var(--muted)]">
                              {variant.trafficWeight}% 트래픽
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            <div>
                              <p className="text-xs font-medium tabular-nums">
                                {variant.impressions.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-[var(--muted)]">노출</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium tabular-nums">
                                {variant.clicks.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-[var(--muted)]">클릭</p>
                            </div>
                            <div>
                              <p className="text-xs font-medium tabular-nums">
                                {variant.conversions.toLocaleString()}
                              </p>
                              <p className="text-[9px] text-[var(--muted)]">전환</p>
                            </div>
                            <div>
                              <p
                                className={cn(
                                  "text-xs font-bold tabular-nums",
                                  isWinner ? "text-[var(--green)]" : ""
                                )}
                              >
                                {(variant.conversionRate * 100).toFixed(1)}%
                              </p>
                              <p className="text-[9px] text-[var(--muted)]">전환율</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateExperimentModal
          onClose={() => setShowCreate(false)}
          onSaved={() => {
            setShowCreate(false);
            fetchExperiments();
          }}
        />
      )}
    </div>
  );
}

function CreateExperimentModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetElement, setTargetElement] = useState("headline");
  const [primaryMetric, setPrimaryMetric] = useState("click_rate");
  const [trafficPercent, setTrafficPercent] = useState(100);
  const [variantA, setVariantA] = useState("A (대조군)");
  const [variantB, setVariantB] = useState("B");
  const [saving, setSaving] = useState(false);

  const save = () => {
    if (!name.trim()) return;
    setSaving(true);
    fetch("/api/admin/marketing/experiments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: description || undefined,
        targetElement,
        primaryMetric,
        trafficPercent,
        variants: [
          { name: variantA, isControl: true, trafficWeight: 50 },
          { name: variantB, isControl: false, trafficWeight: 50 },
        ],
      }),
    })
      .then(() => {
        setSaving(false);
        onSaved();
      })
      .catch(() => setSaving(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">새 A/B 실험</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/[0.06]">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">이름 *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="실험 이름"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">설명</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="실험 설명"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">대상 요소</label>
              <select
                value={targetElement}
                onChange={(e) => setTargetElement(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              >
                {Object.entries(ELEMENT_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">주요 지표</label>
              <select
                value={primaryMetric}
                onChange={(e) => setPrimaryMetric(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              >
                {Object.entries(METRIC_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">트래픽 비율: {trafficPercent}%</label>
            <input
              type="range"
              min={10}
              max={100}
              step={10}
              value={trafficPercent}
              onChange={(e) => setTrafficPercent(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">변형 A (대조군)</label>
              <input
                value={variantA}
                onChange={(e) => setVariantA(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--muted)] mb-1 block">변형 B</label>
              <input
                value={variantB}
                onChange={(e) => setVariantB(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--border)] text-sm hover:bg-white/[0.06]"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={saving || !name.trim()}
            className="px-4 py-2 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 size={14} className="animate-spin" /> : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Users,
  Lock,
  Pencil,
  Trash2,
  X,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SegmentConfig, SegmentRule } from "@/lib/types/marketing";

interface Segment {
  id: string;
  name: string;
  description: string | null;
  rules: SegmentConfig;
  memberCount: number;
  lastCalculatedAt: string | null;
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

const FIELD_LABELS: Record<string, string> = {
  event: "이벤트",
  lead_score: "리드 점수",
  last_active: "마지막 활동",
  payment_status: "결제 상태",
  status: "상태",
  source: "유입 소스",
  medium: "유입 매체",
  signup_date: "가입일",
  has_report: "리포트 여부",
  has_inquiry: "문의 여부",
};

const OPERATOR_LABELS: Record<string, string> = {
  eq: "같음",
  neq: "같지 않음",
  gt: "보다 큼",
  lt: "보다 작음",
  gte: "이상",
  lte: "이하",
  contains: "포함",
  not_contains: "미포함",
  in: "중 하나",
  not_in: "제외",
  between: "범위",
  is_null: "비어있음",
  is_not_null: "값 있음",
};

export default function SegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSegment, setEditingSegment] = useState<Segment | null>(null);

  const fetchSegments = () => {
    setLoading(true);
    fetch("/api/admin/marketing/segments")
      .then((r) => r.json())
      .then((d) => {
        setSegments(d.segments || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchSegments();
  }, []);

  const handleDelete = (id: string) => {
    fetch("/api/admin/marketing/segments", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive: false }),
    }).then(() => fetchSegments());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          총 {segments.length}개 세그먼트
        </p>
        <button
          onClick={() => {
            setEditingSegment(null);
            setShowModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> 세그먼트 추가
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : segments.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <Filter size={32} className="mx-auto mb-2" />
          <p className="text-sm">세그먼트가 없습니다</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {segments.map((seg) => (
            <div
              key={seg.id}
              className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {seg.isSystem ? (
                    <Lock size={14} className="text-[var(--muted)]" />
                  ) : (
                    <Users size={14} className="text-purple-400" />
                  )}
                  <h3 className="font-medium">{seg.name}</h3>
                  {seg.isSystem && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">
                      시스템
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {!seg.isSystem && (
                    <>
                      <button
                        onClick={() => {
                          setEditingSegment(seg);
                          setShowModal(true);
                        }}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                      >
                        <Pencil size={14} className="text-[var(--muted)]" />
                      </button>
                      <button
                        onClick={() => handleDelete(seg.id)}
                        className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                      >
                        <Trash2 size={14} className="text-[var(--red)]" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {seg.description && (
                <p className="text-xs text-[var(--muted)] mb-2">
                  {seg.description}
                </p>
              )}

              {/* Rules */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {seg.rules?.rules?.map((rule: SegmentRule, i: number) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400"
                  >
                    {FIELD_LABELS[rule.field] || rule.field}{" "}
                    {OPERATOR_LABELS[rule.operator] || rule.operator}{" "}
                    {rule.value !== null && rule.value !== undefined
                      ? String(rule.value)
                      : ""}
                  </span>
                ))}
                {seg.rules?.logic && seg.rules.rules?.length > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-[var(--muted)]">
                    {seg.rules.logic === "and" ? "모두 충족" : "하나라도 충족"}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4 text-xs text-[var(--muted)]">
                <span className="font-medium text-white">
                  {(seg.memberCount || 0).toLocaleString()}명
                </span>
                {seg.lastCalculatedAt && (
                  <span>
                    마지막 계산:{" "}
                    {new Date(seg.lastCalculatedAt).toLocaleDateString("ko-KR")}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <SegmentModal
          segment={editingSegment}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            fetchSegments();
          }}
        />
      )}
    </div>
  );
}

function SegmentModal({
  segment,
  onClose,
  onSaved,
}: {
  segment: Segment | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(segment?.name || "");
  const [description, setDescription] = useState(segment?.description || "");
  const [logic, setLogic] = useState<"and" | "or">(
    segment?.rules?.logic || "and"
  );
  const [rules, setRules] = useState<SegmentRule[]>(
    segment?.rules?.rules || [{ field: "lead_score", operator: "gte", value: 50 }]
  );
  const [saving, setSaving] = useState(false);

  const addRule = () => {
    setRules([...rules, { field: "event", operator: "eq", value: "" }]);
  };

  const updateRule = (
    idx: number,
    field: keyof SegmentRule,
    value: string | number | null
  ) => {
    const updated = [...rules];
    (updated[idx] as unknown as Record<string, unknown>)[field] = value;
    setRules(updated);
  };

  const removeRule = (idx: number) => {
    setRules(rules.filter((_, i) => i !== idx));
  };

  const save = () => {
    if (!name.trim()) return;
    setSaving(true);

    const payload = segment
      ? { id: segment.id, name, description, rules: { logic, rules } }
      : { name, description, rules: { logic, rules } };

    fetch("/api/admin/marketing/segments", {
      method: segment ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
      <div className="relative w-full max-w-lg bg-[var(--card)] rounded-2xl border border-[var(--border)] p-5 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">
            {segment ? "세그먼트 수정" : "새 세그먼트"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/[0.06]"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">
              이름
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="세그먼트 이름"
            />
          </div>

          <div>
            <label className="text-xs text-[var(--muted)] mb-1 block">
              설명
            </label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
              placeholder="세그먼트 설명 (선택)"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[var(--muted)]">조건 규칙</label>
              <select
                value={logic}
                onChange={(e) => setLogic(e.target.value as "and" | "or")}
                className="px-2 py-1 rounded bg-white/5 border border-[var(--border)] text-xs focus:outline-none"
              >
                <option value="and">모두 충족 (AND)</option>
                <option value="or">하나라도 (OR)</option>
              </select>
            </div>

            <div className="space-y-2">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={rule.field}
                    onChange={(e) => updateRule(idx, "field", e.target.value)}
                    className="px-2 py-1.5 rounded bg-white/5 border border-[var(--border)] text-xs flex-1 focus:outline-none"
                  >
                    {Object.entries(FIELD_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <select
                    value={rule.operator}
                    onChange={(e) =>
                      updateRule(idx, "operator", e.target.value)
                    }
                    className="px-2 py-1.5 rounded bg-white/5 border border-[var(--border)] text-xs focus:outline-none"
                  >
                    {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                  <input
                    value={rule.value !== null ? String(rule.value) : ""}
                    onChange={(e) => updateRule(idx, "value", e.target.value)}
                    className="px-2 py-1.5 rounded bg-white/5 border border-[var(--border)] text-xs w-20 focus:outline-none"
                    placeholder="값"
                  />
                  <button
                    onClick={() => removeRule(idx)}
                    className="p-1 rounded hover:bg-white/[0.06]"
                  >
                    <X size={14} className="text-[var(--muted)]" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={addRule}
              className="mt-2 text-xs text-[var(--green)] hover:underline"
            >
              + 조건 추가
            </button>
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
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : segment ? (
              "수정"
            ) : (
              "생성"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

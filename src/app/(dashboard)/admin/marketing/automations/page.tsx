"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Zap,
  Lock,
  Play,
  Pause,
  Archive,
  X,
  ChevronDown,
  ChevronUp,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MktAutomationStatus, AutomationSafeguard } from "@/lib/types/marketing";

const STATUS_LABELS: Record<string, string> = {
  draft: "초안",
  active: "실행중",
  paused: "일시중지",
  archived: "보관됨",
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  active: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  paused: { bg: "bg-yellow-500/10", text: "text-yellow-400" },
  archived: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
};

const STEP_TYPE_LABELS: Record<string, string> = {
  trigger: "트리거",
  condition: "조건",
  delay: "대기",
  action: "액션",
};

const STEP_TYPE_COLORS: Record<string, string> = {
  trigger: "text-blue-400 bg-blue-500/10",
  condition: "text-purple-400 bg-purple-500/10",
  delay: "text-yellow-400 bg-yellow-500/10",
  action: "text-[var(--green)] bg-[var(--green)]/10",
};

interface AutomationStep {
  id: string;
  type: string;
  config: Record<string, unknown>;
  sortOrder: number;
}

interface Automation {
  id: string;
  name: string;
  description: string | null;
  status: string;
  triggerEvent: string | null;
  triggerSegmentId: string | null;
  safeguards: AutomationSafeguard | null;
  totalEntered: number;
  totalCompleted: number;
  totalConverted: number;
  isSystem: boolean;
  stepCount: number;
  steps: AutomationStep[];
  createdAt: string;
}

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchAutomations = () => {
    setLoading(true);
    fetch("/api/admin/marketing/automations")
      .then((r) => r.json())
      .then((d) => {
        setAutomations(d.automations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAutomations();
  }, []);

  const updateStatus = (id: string, status: string) => {
    fetch("/api/admin/marketing/automations", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).then(() => fetchAutomations());
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--muted)]">
          총 {automations.length}개 자동화
        </p>
        <button
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--green)] text-black text-sm font-medium hover:opacity-90 transition-opacity"
          onClick={() => {
            const name = prompt("자동화 이름을 입력하세요");
            if (!name) return;
            fetch("/api/admin/marketing/automations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name }),
            }).then(() => fetchAutomations());
          }}
        >
          <Plus size={14} /> 자동화 추가
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : automations.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <Zap size={32} className="mx-auto mb-2" />
          <p className="text-sm">자동화가 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          {automations.map((auto) => {
            const sColor = STATUS_COLORS[auto.status] || STATUS_COLORS.draft;
            const isExpanded = expanded === auto.id;
            return (
              <div
                key={auto.id}
                className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden"
              >
                {/* Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() =>
                    setExpanded(isExpanded ? null : auto.id)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {auto.isSystem ? (
                        <Lock size={14} className="text-[var(--muted)]" />
                      ) : (
                        <Zap size={14} className="text-[var(--green)]" />
                      )}
                      <h3 className="font-medium">{auto.name}</h3>
                      <span
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[10px] font-medium",
                          sColor.bg,
                          sColor.text
                        )}
                      >
                        {STATUS_LABELS[auto.status] || auto.status}
                      </span>
                      {auto.isSystem && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">
                          시스템
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Status Actions */}
                      {!auto.isSystem && auto.status === "draft" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(auto.id, "active");
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                          title="실행"
                        >
                          <Play size={14} className="text-[var(--green)]" />
                        </button>
                      )}
                      {auto.status === "active" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateStatus(auto.id, "paused");
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                          title="일시중지"
                        >
                          <Pause size={14} className="text-yellow-400" />
                        </button>
                      )}
                      {auto.status === "paused" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(auto.id, "active");
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                            title="재개"
                          >
                            <Play size={14} className="text-[var(--green)]" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatus(auto.id, "archived");
                            }}
                            className="p-1.5 rounded-lg hover:bg-white/[0.06]"
                            title="보관"
                          >
                            <Archive size={14} className="text-[var(--muted)]" />
                          </button>
                        </>
                      )}
                      {isExpanded ? (
                        <ChevronUp size={16} className="text-[var(--muted)]" />
                      ) : (
                        <ChevronDown size={16} className="text-[var(--muted)]" />
                      )}
                    </div>
                  </div>

                  {auto.description && (
                    <p className="text-xs text-[var(--muted)] mt-1 ml-6">
                      {auto.description}
                    </p>
                  )}

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-2 ml-6 text-xs text-[var(--muted)]">
                    <span>{auto.stepCount}단계</span>
                    <span>진입 {auto.totalEntered.toLocaleString()}</span>
                    <span>완료 {auto.totalCompleted.toLocaleString()}</span>
                    <span>전환 {auto.totalConverted.toLocaleString()}</span>
                    {auto.triggerEvent && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                        트리거: {auto.triggerEvent}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div className="border-t border-[var(--border)] p-4 space-y-4">
                    {/* Steps */}
                    {auto.steps.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--muted)] mb-2">
                          자동화 단계
                        </h4>
                        <div className="space-y-1.5">
                          {auto.steps.map((step, idx) => (
                            <div
                              key={step.id}
                              className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]"
                            >
                              <span className="text-[10px] text-[var(--muted)] tabular-nums w-5 text-center">
                                {idx + 1}
                              </span>
                              <span
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[10px] font-medium",
                                  STEP_TYPE_COLORS[step.type] || "text-[var(--muted)] bg-white/[0.06]"
                                )}
                              >
                                {STEP_TYPE_LABELS[step.type] || step.type}
                              </span>
                              <span className="text-xs text-[var(--muted)] flex-1">
                                {formatStepConfig(step)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Safeguards */}
                    {auto.safeguards && (
                      <div>
                        <h4 className="text-xs font-medium text-[var(--muted)] mb-2 flex items-center gap-1">
                          <Shield size={12} /> 안전장치
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {auto.safeguards.noNightSend && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400">
                              야간 발송 금지
                            </span>
                          )}
                          {auto.safeguards.excludeRecentPayers && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--green)]/10 text-[var(--green)]">
                              최근 결제자 제외
                            </span>
                          )}
                          {auto.safeguards.preventReentry && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-purple-500/10 text-purple-400">
                              재진입 방지
                            </span>
                          )}
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-[var(--muted)]">
                            일일 최대 {auto.safeguards.maxSendPerDay}회
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-white/[0.06] text-[var(--muted)]">
                            중복 제한 {auto.safeguards.dedupeWindow}h
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatStepConfig(step: AutomationStep): string {
  const cfg = step.config;
  if (!cfg) return "";

  switch (step.type) {
    case "trigger":
      return cfg.event
        ? `이벤트: ${cfg.event}`
        : cfg.schedule
        ? `스케줄: ${cfg.schedule}`
        : "설정 없음";
    case "condition":
      return cfg.field
        ? `${cfg.field} ${cfg.operator} ${cfg.value}`
        : "조건 없음";
    case "delay":
      return cfg.delay
        ? `${Number(cfg.delay) / 3600}시간 대기`
        : "대기 시간 없음";
    case "action":
      if (cfg.type === "send_email") return `이메일 발송${cfg.templateId ? ` (${cfg.templateId})` : ""}`;
      if (cfg.type === "send_kakao") return `카카오 발송`;
      if (cfg.type === "add_tag") return `태그 추가: ${cfg.tag}`;
      if (cfg.type === "update_lead_score") return `리드 점수 변경: ${cfg.scoreChange}`;
      return String(cfg.type || "액션");
    default:
      return JSON.stringify(cfg).slice(0, 60);
  }
}

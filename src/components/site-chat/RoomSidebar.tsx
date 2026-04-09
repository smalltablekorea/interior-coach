"use client";

import { BarChart3, Calendar, Wallet, AlertTriangle, Camera, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { PinnedSummary } from "./types";

interface RoomSidebarProps {
  summary: PinnedSummary | null;
  isSample?: boolean;
  onCreateRealRoom?: () => void;
}

export default function RoomSidebar({ summary, isSample, onCreateRealRoom }: RoomSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!summary) {
    return (
      <div className="p-4 text-center text-sm text-[var(--muted)]">
        로딩 중...
      </div>
    );
  }

  const progress = summary.currentProgressPercent;

  return (
    <div className="h-full flex flex-col">
      {/* Mobile toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="md:hidden flex items-center justify-between w-full px-4 py-3 border-b border-[var(--border)]"
      >
        <span className="text-xs font-bold">현장 정보</span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      <div className={`flex-1 overflow-y-auto p-4 space-y-5 ${collapsed ? "hidden md:block" : ""}`}>
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <BarChart3 size={12} className="text-[var(--green)]" />
              <span className="text-[10px] font-bold text-[var(--muted)]">진행률</span>
            </div>
            <span className="text-lg font-bold text-[var(--green)]">{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.04] overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--green)] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Next milestone */}
        {summary.nextMilestoneTitle && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar size={12} className="text-blue-400" />
              <span className="text-[10px] font-bold text-[var(--muted)]">다음 공정</span>
            </div>
            <p className="text-sm font-medium">{summary.nextMilestoneTitle}</p>
            {summary.nextMilestoneDate && (
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{summary.nextMilestoneDate}</p>
            )}
          </div>
        )}

        {/* Payment */}
        {summary.pendingPaymentAmount > 0 && (
          <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)]">
            <div className="flex items-center gap-1.5 mb-1">
              <Wallet size={12} className="text-amber-400" />
              <span className="text-[10px] font-bold text-[var(--muted)]">미수금</span>
            </div>
            <p className="text-sm font-bold text-amber-400">
              {(summary.pendingPaymentAmount / 10000).toLocaleString()}만원
            </p>
            {summary.pendingPaymentDueDate && (
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{summary.pendingPaymentDueDate}까지</p>
            )}
          </div>
        )}

        {/* Defects */}
        {summary.openDefectsCount > 0 && (
          <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10">
            <div className="flex items-center gap-1.5 mb-1">
              <AlertTriangle size={12} className="text-red-400" />
              <span className="text-[10px] font-bold text-red-400">미완료 하자</span>
            </div>
            <p className="text-sm font-bold">{summary.openDefectsCount}건</p>
          </div>
        )}

        {/* Photos */}
        {(summary.photoCount ?? 0) > 0 && (
          <div className="flex items-center gap-2 text-[10px] text-[var(--muted)]">
            <Camera size={12} />
            <span>사진 {summary.photoCount}장</span>
          </div>
        )}
      </div>

      {/* Sample room CTA */}
      {isSample && onCreateRealRoom && (
        <div className="p-4 border-t border-[var(--border)]">
          <button
            onClick={onCreateRealRoom}
            className="w-full py-3 rounded-xl bg-[var(--green)] text-black text-sm font-bold hover:opacity-90 transition-opacity"
          >
            내 진짜 현장 만들기
          </button>
        </div>
      )}
    </div>
  );
}

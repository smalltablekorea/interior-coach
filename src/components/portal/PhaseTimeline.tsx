"use client";

import { CheckCircle, Clock, Pause, Circle } from "lucide-react";

interface Phase {
  id: string;
  category: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  progress: number;
  status: string;
  sortOrder: number | null;
  memo: string | null;
}

interface PhaseTimelineProps {
  phases: Phase[];
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  "완료": { label: "완료", color: "text-green-600", bg: "bg-green-100", icon: CheckCircle },
  "진행중": { label: "진행중", color: "text-blue-600", bg: "bg-blue-100", icon: Clock },
  "대기": { label: "대기", color: "text-gray-500", bg: "bg-gray-100", icon: Circle },
  "보류": { label: "보류", color: "text-orange-600", bg: "bg-orange-100", icon: Pause },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function PhaseTimeline({ phases }: PhaseTimelineProps) {
  if (phases.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        등록된 공정이 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {phases.map((phase, index) => {
        const config = statusConfig[phase.status] || statusConfig["대기"];
        const Icon = config.icon;
        const isLast = index === phases.length - 1;

        return (
          <div key={phase.id} className="flex gap-3">
            {/* Timeline line and dot */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  phase.status === "진행중"
                    ? "bg-blue-500 text-white ring-4 ring-blue-100"
                    : phase.status === "완료"
                    ? "bg-green-500 text-white"
                    : phase.status === "보류"
                    ? "bg-orange-400 text-white"
                    : "bg-gray-200 text-gray-400"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              {!isLast && (
                <div
                  className={`w-0.5 flex-1 min-h-[40px] ${
                    phase.status === "완료" ? "bg-green-300" : "bg-gray-200"
                  }`}
                />
              )}
            </div>

            {/* Content */}
            <div className={`pb-6 flex-1 ${isLast ? "pb-0" : ""}`}>
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{phase.category}</h4>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${config.color} ${config.bg}`}
                >
                  {config.label}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <span>
                  {formatDate(phase.plannedStart)} ~ {formatDate(phase.plannedEnd)}
                </span>
                <span className="font-medium text-gray-700">{phase.progress}%</span>
              </div>
              {/* Progress bar */}
              <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    phase.status === "완료"
                      ? "bg-green-500"
                      : phase.status === "진행중"
                      ? "bg-blue-500"
                      : phase.status === "보류"
                      ? "bg-orange-400"
                      : "bg-gray-300"
                  }`}
                  style={{ width: `${phase.progress}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

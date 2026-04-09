"use client";

import { CheckCircle2, Circle, Camera, Globe, MessageSquare } from "lucide-react";

interface ChecklistItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  action?: () => void;
}

interface FirstRoomChecklistProps {
  items: ChecklistItem[];
}

const DEFAULT_ITEMS: Omit<ChecklistItem, "done" | "action">[] = [
  { id: "create", label: "현장 만들기 완료", icon: <CheckCircle2 size={14} /> },
  { id: "photo", label: "첫 사진 올려보기", icon: <Camera size={14} /> },
  { id: "message", label: "첫 메시지 보내기", icon: <MessageSquare size={14} /> },
  { id: "portal", label: "고객 포털 공유 URL 만들기", icon: <Globe size={14} /> },
];

export default function FirstRoomChecklist({ items }: FirstRoomChecklistProps) {
  const mergedItems = DEFAULT_ITEMS.map(d => {
    const found = items.find(i => i.id === d.id);
    return { ...d, done: found?.done ?? false, action: found?.action };
  });

  const doneCount = mergedItems.filter(i => i.done).length;
  const allDone = doneCount === mergedItems.length;

  if (allDone) return null;

  return (
    <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">시작 체크리스트</h3>
        <span className="text-xs text-[var(--muted)]">{doneCount}/{mergedItems.length}</span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mb-4">
        <div
          className="h-full rounded-full bg-[var(--green)] transition-all duration-500"
          style={{ width: `${(doneCount / mergedItems.length) * 100}%` }}
        />
      </div>

      <div className="space-y-2">
        {mergedItems.map((item) => (
          <button
            key={item.id}
            onClick={item.action}
            disabled={item.done || !item.action}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
              item.done
                ? "bg-[var(--green)]/5 border border-[var(--green)]/10"
                : item.action
                  ? "bg-white/[0.02] border border-[var(--border)] hover:border-[var(--green)]/30 cursor-pointer"
                  : "bg-white/[0.02] border border-[var(--border)] opacity-50"
            }`}
          >
            <span className={item.done ? "text-[var(--green)]" : "text-[var(--muted)]"}>
              {item.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
            </span>
            <span className={`text-sm ${item.done ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

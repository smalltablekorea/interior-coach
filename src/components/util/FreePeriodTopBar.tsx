"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ExpiringBlock } from "@/components/util/ExpiringBlock";

const DISMISS_KEY = "free-period-banner-dismissed-v1";
const DISMISS_TTL_MS = 24 * 60 * 60 * 1000; // 24시간 동안만 숨김

/**
 * 대시보드 상단 띠 — 7월 31일까지 전면 무료 안내.
 * - 마감 시각 도달 즉시 ExpiringBlock으로 자동 사라짐
 * - 사용자가 닫으면 24시간 동안 다시 안 보임 (localStorage)
 * - 이후 새로고침해도 안 보임 (24h 이내)
 */
export default function FreePeriodTopBar() {
  const [dismissed, setDismissed] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DISMISS_KEY);
      if (!raw) { setDismissed(false); return; }
      const at = Number(raw);
      if (!Number.isFinite(at)) { setDismissed(false); return; }
      setDismissed(Date.now() - at < DISMISS_TTL_MS);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed === null) return null; // 첫 렌더에선 hydration 일치 위해 null
  if (dismissed) return null;

  return (
    <ExpiringBlock until="2026-08-01T00:00:00+09:00">
      <div className="bg-[var(--green)] text-black text-sm py-2 px-4 flex items-center justify-center gap-3 relative">
        <span className="font-semibold">🎉 7월 31일까지 전체 기능 무료</span>
        <span className="hidden sm:inline opacity-80">— 결제 없이 모든 Pro 기능 사용 가능</span>
        <button
          onClick={() => {
            try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
            setDismissed(true);
          }}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10"
          aria-label="닫기"
        >
          <X size={14} />
        </button>
      </div>
    </ExpiringBlock>
  );
}

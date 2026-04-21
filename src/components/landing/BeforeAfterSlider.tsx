"use client";

import { useState, useRef, useCallback } from "react";

/**
 * Before/After slider for construction projects.
 * Uses gradient placeholders until real images are provided.
 */
export default function BeforeAfterSlider() {
  const [position, setPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const updatePosition = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((clientX - rect.left) / rect.width) * 100;
      setPosition(Math.max(5, Math.min(95, x)));
    },
    [],
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      isDragging.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging.current) return;
      updatePosition(e.clientX);
    },
    [updatePosition],
  );

  const handlePointerUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative aspect-[4/3] select-none cursor-col-resize overflow-hidden bg-[var(--landing-card-alt)]"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      role="slider"
      aria-label="시공 전후 비교 슬라이더"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={100}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") setPosition((p) => Math.max(5, p - 2));
        if (e.key === "ArrowRight") setPosition((p) => Math.min(95, p + 2));
      }}
    >
      {/* "After" (full background) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #f5f0eb 0%, #e8ddd3 30%, #c9b8a5 60%, #d4c5b5 100%)",
        }}
      >
        {/* After overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/50 to-transparent">
          <span className="text-xs font-medium tracking-wider uppercase text-white/70">
            After
          </span>
          <p className="text-sm font-medium text-white mt-1">
            잠실르엘 32평 · 완공
          </p>
        </div>
        {/* Decorative — simulated furniture/finish */}
        <div className="absolute top-[20%] left-[15%] w-[35%] h-[25%] rounded-lg bg-white/30 backdrop-blur-[2px]" />
        <div className="absolute top-[50%] right-[10%] w-[25%] h-[20%] rounded-lg bg-[#b8a38e]/30" />
        <div className="absolute top-[15%] right-[15%] w-[15%] h-[35%] rounded-sm bg-[#9b8a78]/20" />
      </div>

      {/* "Before" (clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #8a8a8a 0%, #6d6d6d 30%, #555555 60%, #4a4a4a 100%)",
          }}
        >
          {/* Before overlay content */}
          <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
            <span className="text-xs font-medium tracking-wider uppercase text-white/70">
              Before
            </span>
            <p className="text-sm font-medium text-white mt-1">
              잠실르엘 32평 · 철거 전
            </p>
          </div>
          {/* Decorative — simulated old room */}
          <div className="absolute top-[20%] left-[15%] w-[35%] h-[25%] rounded-sm bg-[#5a5a5a]/50" />
          <div className="absolute top-[50%] right-[10%] w-[25%] h-[20%] rounded-sm bg-[#4a4a4a]/40" />
        </div>
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-[0_0_8px_rgba(0,0,0,0.3)]"
        style={{ left: `${position}%`, transform: "translateX(-50%)" }}
      >
        {/* Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white shadow-[rgba(50,50,93,0.25)_0px_6px_12px_-2px,rgba(0,0,0,0.3)_0px_3px_7px_-3px] flex items-center justify-center">
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            className="text-[var(--landing-heading)]"
          >
            <path d="M5 3L2 8L5 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M11 3L14 8L11 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

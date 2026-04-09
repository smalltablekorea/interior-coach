"use client";

import { useState, useEffect, useRef } from "react";
import { Camera, Image as ImageIcon, BarChart3 } from "lucide-react";
import { DEMO_MESSAGES, DEMO_SIDEBAR, DEMO_PROGRESS_STEPS, type DemoMessage } from "./demo-script";

const SENDER_COLORS: Record<string, string> = {
  "사장님": "bg-[var(--green)]/15 text-[var(--green)]",
  "목수팀장": "bg-blue-500/15 text-blue-400",
  "고객": "bg-purple-500/15 text-purple-400",
};

function DemoMessageBubble({ msg, visible }: { msg: DemoMessage; visible: boolean }) {
  if (msg.type === "system") {
    return (
      <div className={`flex justify-center transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <span className="px-3 py-1 rounded-full bg-white/[0.04] text-[10px] text-[var(--muted)]">{msg.text}</span>
      </div>
    );
  }

  const isRight = msg.sender === "고객";
  return (
    <div className={`flex ${isRight ? "justify-end" : "justify-start"} transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
      <div className={`max-w-[75%] ${isRight ? "items-end" : "items-start"}`}>
        {!isRight && (
          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mb-1 ${SENDER_COLORS[msg.sender] || "bg-white/10 text-white/60"}`}>
            {msg.sender}
          </span>
        )}
        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
          isRight
            ? "bg-purple-500/10 text-[var(--foreground)]"
            : "bg-white/[0.06] text-[var(--foreground)]"
        }`}>
          {msg.type === "image" ? (
            <div className="flex items-center gap-2 text-[var(--muted)]">
              <Camera size={14} />
              <span className="text-xs">시공 사진 첨부</span>
            </div>
          ) : msg.text}
        </div>
        <span className="text-[9px] text-[var(--muted)] mt-0.5 block">{msg.time}</span>
      </div>
    </div>
  );
}

export default function LiveDemo() {
  const [visibleCount, setVisibleCount] = useState(0);
  const [progress, setProgress] = useState(23);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  // Start animation when in viewport
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true); }, { threshold: 0.2 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Reveal messages one by one
  useEffect(() => {
    if (!started || visibleCount >= DEMO_MESSAGES.length) return;
    const timer = setTimeout(() => setVisibleCount(v => v + 1), 800 + Math.random() * 600);
    return () => clearTimeout(timer);
  }, [started, visibleCount]);

  // Progress animation
  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => {
      setProgress(p => p >= DEMO_SIDEBAR.progress ? DEMO_SIDEBAR.progress : p + 1);
    }, 120);
    return () => clearInterval(timer);
  }, [started]);

  // Auto scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [visibleCount]);

  return (
    <div ref={containerRef} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-white/[0.02]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[var(--green)]" />
          <span className="text-sm font-bold">잠실 르엘 32평 리모델링</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)] font-medium">시공중</span>
        </div>
        <span className="text-[10px] text-[var(--muted)]">참여자 4명</span>
      </div>

      <div className="flex">
        {/* Chat area */}
        <div className="flex-1 min-h-[360px] max-h-[400px] overflow-y-auto p-4 space-y-3">
          {DEMO_MESSAGES.map((msg, i) => (
            <DemoMessageBubble key={msg.id} msg={msg} visible={i < visibleCount} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Sidebar — desktop only */}
        <div className="hidden md:block w-52 border-l border-[var(--border)] p-3 space-y-4 bg-white/[0.01]">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-[var(--muted)]">진행률</span>
              <span className="text-sm font-bold text-[var(--green)]">{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
              <div className="h-full rounded-full bg-[var(--green)] transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 space-y-1">
              {DEMO_PROGRESS_STEPS.map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-[10px]">
                  <span className={s.done ? "text-[var(--green)]" : s.pct > 0 ? "text-amber-400" : "text-[var(--muted)]"}>
                    {s.done ? "✓" : s.pct > 0 ? "◑" : "○"}
                  </span>
                  <span className={s.done ? "text-[var(--muted)] line-through" : "text-[var(--foreground)]"}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[10px]">
              <BarChart3 size={10} className="text-blue-400" />
              <span className="text-[var(--muted)]">다음: {DEMO_SIDEBAR.nextMilestone}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <ImageIcon size={10} className="text-amber-400" />
              <span className="text-[var(--muted)]">사진 {DEMO_SIDEBAR.photos}장</span>
            </div>
          </div>
        </div>
      </div>

      {/* Composer (read-only visual) */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-[var(--border)] bg-white/[0.02]">
        <button className="p-2 rounded-lg text-[var(--muted)]"><Camera size={16} /></button>
        <div className="flex-1 px-3 py-2 rounded-xl bg-white/[0.04] text-sm text-[var(--muted)]">메시지를 입력하세요...</div>
        <button className="px-3 py-2 rounded-xl bg-[var(--green)]/20 text-[var(--green)] text-sm font-medium">전송</button>
      </div>
    </div>
  );
}

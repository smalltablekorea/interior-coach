"use client";

import { MessageSquare, ArrowRight, X } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onOpenSample: () => void;
  onSkip: () => void;
}

export default function WelcomeModal({ open, onOpenSample, onSkip }: WelcomeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-5">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center relative animate-in fade-in zoom-in-95 duration-200">
        <button onClick={onSkip} className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]">
          <X size={18} />
        </button>

        <div className="w-16 h-16 rounded-2xl bg-[var(--green)]/10 flex items-center justify-center mx-auto mb-5">
          <MessageSquare size={28} className="text-[var(--green)]" />
        </div>

        <h2 className="text-xl font-bold mb-2">먼저 샘플 현장을 구경해보세요</h2>
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">
          실제 현장처럼 채워진 샘플 톡방입니다.
          <br />
          자유롭게 눌러보고, 진짜 현장은 언제든 만들 수 있어요.
        </p>

        <div className="space-y-3">
          <button
            onClick={onOpenSample}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--green)] text-black font-bold hover:opacity-90 transition-opacity"
          >
            샘플 톡방 열기
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onSkip}
            className="w-full py-3 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
          >
            건너뛰기
          </button>
        </div>
      </div>
    </div>
  );
}

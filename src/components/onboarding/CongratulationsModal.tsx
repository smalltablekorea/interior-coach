"use client";

import { useState, useEffect } from "react";
import { PartyPopper, ArrowRight, Building2, X } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

const CONGRATS_KEY = "first-site-congrats-shown";

interface CongratulationsModalProps {
  /** Whether the user just created their first real site */
  show: boolean;
  siteName?: string;
  siteId?: string;
  onClose: () => void;
}

export default function CongratulationsModal({
  show,
  siteName,
  siteId,
  onClose,
}: CongratulationsModalProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && !localStorage.getItem(CONGRATS_KEY)) {
      setVisible(true);
      localStorage.setItem(CONGRATS_KEY, "1");
      // Fire confetti
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#a855f7"],
        });
      } catch {
        // confetti not available — no problem
      }
    }
  }, [show]);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-5">
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-8 max-w-md w-full text-center relative animate-in fade-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--foreground)]"
        >
          <X size={18} />
        </button>

        <div className="w-20 h-20 rounded-2xl bg-[var(--green)]/10 flex items-center justify-center mx-auto mb-5">
          <PartyPopper size={36} className="text-[var(--green)]" />
        </div>

        <h2 className="text-2xl font-bold mb-2">🎉 축하합니다!</h2>
        <p className="text-base font-medium mb-1">
          첫 번째 현장이 등록되었어요
        </p>
        {siteName && (
          <p className="text-sm text-[var(--green)] font-medium mb-4">
            &ldquo;{siteName}&rdquo;
          </p>
        )}
        <p className="text-sm text-[var(--muted)] leading-relaxed mb-6">
          이제 이 현장에 견적, 계약, 공정을 추가하면
          <br />
          인테리어코치가 자동으로 관리해드려요.
        </p>

        {/* Next Steps */}
        <div className="space-y-2 mb-6 text-left">
          <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wider mb-2">
            다음 단계
          </p>
          <Link
            href="/estimates/coach"
            onClick={handleClose}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-[var(--border)] hover:border-[var(--green)]/30 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-[#a855f7]/10 flex items-center justify-center">
              <span className="text-sm">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">AI 견적코치로 견적 만들기</p>
              <p className="text-xs text-[var(--muted)]">
                평수만 입력하면 자동 견적 생성
              </p>
            </div>
            <ArrowRight size={14} className="text-[var(--muted)]" />
          </Link>
          {siteId && (
            <Link
              href={`/sites/${siteId}`}
              onClick={handleClose}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-[var(--border)] hover:border-[var(--green)]/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[var(--green)]/10 flex items-center justify-center">
                <Building2 size={14} className="text-[var(--green)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">현장 상세 확인하기</p>
                <p className="text-xs text-[var(--muted)]">
                  톡방, 일정, 자재 관리
                </p>
              </div>
              <ArrowRight size={14} className="text-[var(--muted)]" />
            </Link>
          )}
        </div>

        <button
          onClick={handleClose}
          className="w-full py-3.5 rounded-xl bg-[var(--green)] text-black font-bold hover:opacity-90 transition-opacity"
        >
          확인
        </button>
      </div>
    </div>
  );
}

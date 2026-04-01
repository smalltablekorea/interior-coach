"use client";

import { useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "max-w-lg",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  // ESC 키 지원
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  // 포커스 트랩
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !dialogRef.current) return;

    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (!open) return;

    // 열릴 때 현재 포커스 저장 + 바디 스크롤 잠금
    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    // 모달 내부로 포커스 이동
    requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );
      first?.focus();
    });

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keydown", trapFocus);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keydown", trapFocus);
      document.body.style.overflow = "";
      // 닫힐 때 이전 포커스 복원
      previousFocusRef.current?.focus();
    };
  }, [open, handleKeyDown, trapFocus]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="min-h-full flex items-center justify-center p-4 sm:p-6">
        <div
          ref={dialogRef}
          className={`w-full ${maxWidth} max-h-[85vh] flex flex-col bg-[var(--card)] border border-[var(--border)] rounded-2xl my-auto animate-fade-up`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] shrink-0">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--border)] text-[var(--muted)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6 overflow-y-auto flex-1 min-h-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

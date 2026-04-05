"use client";

import { useEffect, useRef } from "react";
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
  const onCloseRef = useRef(onClose);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;

    previousFocusRef.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const timer = setTimeout(() => {
      dialogRef.current?.querySelector<HTMLElement>("input, textarea, select")?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.isComposing) return;
      if (e.key === "Escape") { onCloseRef.current(); return; }
      if (e.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      previousFocusRef.current?.focus();
    };
  }, [open]);

  if (!open) return null;

  const handleMouseDown = (e: React.MouseEvent) => { mouseDownTargetRef.current = e.target; };
  const handleClick = (e: React.MouseEvent) => {
    if (mouseDownTargetRef.current !== e.target) return;
    if (dialogRef.current?.contains(e.target as Node)) return;
    onCloseRef.current();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm"
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="flex min-h-full items-start justify-center px-4 py-8 sm:py-12">
        <div
          ref={dialogRef}
          className={`relative w-full ${maxWidth} bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl animate-fade-up`}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
            <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            <button
              onClick={() => onCloseRef.current()}
              aria-label="닫기"
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--border)] text-[var(--muted)] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

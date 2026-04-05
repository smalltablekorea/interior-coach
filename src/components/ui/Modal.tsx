"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, GripHorizontal } from "lucide-react";

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

  // 드래그 상태
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const draggingRef = useRef(false);
  const dragStartRef = useRef({ mouseX: 0, mouseY: 0, offsetX: 0, offsetY: 0 });

  // 모달 열릴 때 위치 초기화
  useEffect(() => {
    if (open) setOffset({ x: 0, y: 0 });
  }, [open]);

  // 드래그 핸들러
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    // input/button/select/textarea 위에서는 드래그 시작 안 함
    const tag = (e.target as HTMLElement).tagName;
    if (["INPUT", "BUTTON", "SELECT", "TEXTAREA", "A"].includes(tag)) return;

    e.preventDefault();
    draggingRef.current = true;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!draggingRef.current) return;
      setOffset({
        x: dragStartRef.current.offsetX + (ev.clientX - dragStartRef.current.mouseX),
        y: dragStartRef.current.offsetY + (ev.clientY - dragStartRef.current.mouseY),
      });
    };

    const handleMouseUp = () => {
      draggingRef.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  }, [offset]);

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

  const handleBackdropMouseDown = (e: React.MouseEvent) => { mouseDownTargetRef.current = e.target; };
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (mouseDownTargetRef.current !== e.target) return;
    if (dialogRef.current?.contains(e.target as Node)) return;
    onCloseRef.current();
  };

  const modal = (
    <div
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.6)", overflowY: "auto" }}
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div style={{ display: "flex", minHeight: "100%", alignItems: "flex-start", justifyContent: "center", padding: "2rem 1rem" }}>
        <div
          ref={dialogRef}
          className={`w-full ${maxWidth} bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl`}
          style={{
            position: "relative",
            transform: `translate(${offset.x}px, ${offset.y}px)`,
            transition: draggingRef.current ? "none" : undefined,
          }}
        >
          {/* 드래그 가능한 헤더 */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] select-none"
            style={{ cursor: "grab" }}
            onMouseDown={handleDragStart}
          >
            <div className="flex items-center gap-2">
              <GripHorizontal size={14} className="text-[var(--muted)] opacity-40" />
              <h2 id="modal-title" className="text-lg font-semibold">{title}</h2>
            </div>
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

  return createPortal(modal, document.body);
}

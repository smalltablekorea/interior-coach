import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * 실제 이미지 자산이 준비되기 전까지 기능 섹션에서 쓰는 UI 미리보기 목업.
 * 브라우저 크롬 스타일 프레임 + 내부 컨텐츠를 자유롭게 조립.
 */
export default function MockupFrame({
  children,
  title = "interior-coach",
  className,
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-[var(--border)] bg-[var(--sidebar)] overflow-hidden shadow-2xl shadow-black/40",
        className,
      )}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)] bg-white/[0.02]">
        <span className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-400/70" />
        <span className="ml-3 text-[11px] text-[var(--muted)] font-mono truncate">
          {title}
        </span>
      </div>
      <div className="p-5 md:p-6">{children}</div>
    </div>
  );
}

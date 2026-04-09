"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

interface SampleRoomBannerProps {
  visible: boolean;
}

export default function SampleRoomBanner({ visible }: SampleRoomBannerProps) {
  if (!visible) return null;

  return (
    <div className="px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Sparkles size={14} className="text-amber-400" />
        <span className="text-xs text-amber-400 font-medium">
          이건 샘플 현장입니다. 자유롭게 눌러보세요
        </span>
      </div>
      <Link
        href="/sites"
        className="text-xs font-bold text-[var(--green)] hover:underline shrink-0"
      >
        내 진짜 현장 만들기
      </Link>
    </div>
  );
}

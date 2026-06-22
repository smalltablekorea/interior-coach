"use client";

import { ShieldX, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <ShieldX size={32} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">접근 권한이 없습니다</h1>
        <p className="text-[var(--muted)] mb-6">
          이 페이지를 볼 수 있는 권한이 없습니다.<br />
          워크스페이스 관리자에게 문의해주세요.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-white text-sm font-medium hover:opacity-90 transition-all"
        >
          <ArrowLeft size={16} />
          대시보드로 돌아가기
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import DemoRequestForm from "./DemoRequestForm";

export const metadata: Metadata = {
  title: "데모 신청 | 인테리어코치",
  description:
    "30분 라이브 데모. 현장 운영 워크플로우를 직접 보여드립니다. 카드 등록 불필요.",
};

export default function DemoRequestPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <header className="border-b border-[var(--border)]">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            <ArrowLeft size={16} /> 홈으로
          </Link>
          <span className="text-sm font-bold text-[var(--green)]">
            인테리어코치
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-12">
          <p className="text-sm font-semibold text-[var(--green)] mb-3">
            30분 라이브 데모
          </p>
          <h1 className="text-3xl md:text-5xl font-black leading-tight">
            현장에 꼭 맞는지
            <br />
            먼저 확인하세요
          </h1>
          <p className="mt-5 text-[var(--muted)] leading-relaxed">
            대표가 직접 데모를 진행합니다. 현재 운영 방식에 맞춰
            <br />
            어떻게 쓰면 되는지 30분 안에 보여드립니다.
          </p>
        </div>

        <DemoRequestForm />
      </main>
    </div>
  );
}

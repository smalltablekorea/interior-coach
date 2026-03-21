"use client";

import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";

const ADLOG_URL = "https://adlog.kr/adlog/";

export default function AdlogPage() {
  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/marketing"
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.04] text-neutral-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-2xl">📊</span> 애드로그
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            광고 관리를 쉽게 도와주는 통합 광고 관리 플랫폼
          </p>
        </div>
      </div>

      {/* Main Card */}
      <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-8 space-y-6">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center text-3xl shrink-0">
            📊
          </div>
          <div className="flex-1 space-y-3">
            <h2 className="text-lg font-semibold">애드로그 (Adlog)</h2>
            <p className="text-sm text-neutral-400 leading-relaxed">
              네이버, 카카오, 구글, 메타 등 다양한 광고 매체의 성과를 한 곳에서
              통합 관리할 수 있는 광고 관리 플랫폼입니다. 광고비 지출, 클릭수,
              전환율 등을 실시간으로 모니터링하고 효율적으로 광고를 운영하세요.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              {["광고 통합 관리", "성과 분석", "매체별 리포트", "광고비 최적화"].map((tag) => (
                <span
                  key={tag}
                  className="px-2.5 py-1 rounded-lg bg-white/[0.04] text-xs text-neutral-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-white/[0.06] pt-6">
          <a
            href={ADLOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00C471] text-black px-6 py-3 text-sm font-medium hover:bg-[#00D47F] transition-colors"
          >
            애드로그 바로가기
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 space-y-2">
          <p className="text-sm font-medium">광고 매체 통합</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            네이버, 카카오, 구글, 메타 등 주요 광고 매체를 한 곳에서 관리합니다.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 space-y-2">
          <p className="text-sm font-medium">실시간 성과 분석</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            클릭수, 전환율, ROAS 등 핵심 지표를 실시간으로 확인할 수 있습니다.
          </p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-[#111111] p-5 space-y-2">
          <p className="text-sm font-medium">광고비 최적화</p>
          <p className="text-xs text-neutral-500 leading-relaxed">
            매체별 광고 성과를 비교 분석하여 효율적인 예산 배분을 지원합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export const metadata = {
  title: "환불 정책 — 견적코치",
  description: "견적코치 환불 및 취소 정책 안내",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-lg">견적코치</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            홈으로
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">환불 정책</h1>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--muted)]">
          <p>
            견적코치는 고객님의 신뢰를 최우선으로 생각합니다.
            아래 기준에 따라 환불을 처리합니다.
          </p>

          {/* 3단계 환불 정책 */}
          <div className="space-y-6">
            {/* 1단계 */}
            <div className="p-5 rounded-2xl bg-[var(--green)]/5 border border-[var(--green)]/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--green)]/20 flex items-center justify-center text-[var(--green)] font-bold text-sm">
                  1
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  분석 시작 전 — 전액 환불
                </h2>
              </div>
              <ul className="space-y-1.5 ml-11">
                <li>결제 후 분석이 아직 시작되지 않은 경우, 전액 환불됩니다.</li>
                <li>별도 사유 불필요, 즉시 처리됩니다.</li>
                <li>환불 처리: 결제수단 원복 (영업일 기준 1~3일 소요)</li>
              </ul>
            </div>

            {/* 2단계 */}
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                  2
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  분석 완료 후 24시간 이내 — 전액 환불
                </h2>
              </div>
              <ul className="space-y-1.5 ml-11">
                <li>분석 결과를 확인하신 후에도 24시간 이내라면 전액 환불됩니다.</li>
                <li>고객님이 안심하고 서비스를 체험할 수 있도록 마련된 정책입니다.</li>
                <li>환불 요청: 마이페이지 또는 고객센터(0507-1315-3173)</li>
              </ul>
            </div>

            {/* 3단계 */}
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-[var(--border)]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--muted)] font-bold text-sm">
                  3
                </div>
                <h2 className="text-lg font-semibold text-[var(--foreground)]">
                  분석 완료 후 24시간 이후 — 환불 불가
                </h2>
              </div>
              <ul className="space-y-1.5 ml-11">
                <li>디지털 콘텐츠의 특성상, 분석 완료 후 24시간이 경과한 경우 환불이 불가합니다.</li>
                <li>
                  <strong className="text-[var(--foreground)]">단, 분석 오류가 확인된 경우</strong>에는 재분석을 무료로 제공합니다.
                </li>
                <li>재분석 요청: 고객센터 또는 마이페이지에서 접수</li>
              </ul>
            </div>
          </div>

          {/* 추가 안내 */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">참고 사항</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>3건 패키지 구매 시, 미사용 건에 대해서는 사용 시점과 관계없이 환불 가능합니다.</li>
              <li>환불 처리 시 결제수단에 따라 1~5 영업일이 소요될 수 있습니다.</li>
              <li>프로모션 할인이 적용된 경우, 할인 적용 금액 기준으로 환불됩니다.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--foreground)]">문의</h2>
            <p>
              환불 관련 문의는 아래로 연락해주세요.
            </p>
            <ul className="space-y-1">
              <li>전화: 0507-1315-3173 (평일 10:00~18:00)</li>
              <li>이메일: smalltablekorea@gmail.com</li>
            </ul>
          </div>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] text-xs">
            <p>시행일: 2026년 3월 24일</p>
            <p className="mt-1">
              본 환불 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 운영됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

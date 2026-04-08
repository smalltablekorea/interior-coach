import Link from "next/link";

export const metadata = {
  title: "이용약관 — 견적코치",
  description: "견적코치 서비스 이용약관",
};

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold mb-8">이용약관</h1>

        <div className="space-y-8 text-sm leading-relaxed text-[var(--muted)]">

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제1조 (목적)</h2>
            <p>
              본 약관은 스몰테이블(이하 &quot;회사&quot;)이 운영하는 견적코치 서비스(이하 &quot;서비스&quot;)의
              이용과 관련하여 회사와 이용자 간의 권리·의무 및 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제2조 (서비스의 내용)</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>인테리어 견적서 AI 분석 서비스</li>
              <li>공종별 비용 시뮬레이션 및 비교 분석</li>
              <li>비용 절감 포인트 분석 및 코칭</li>
              <li>기타 부가 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제3조 (면책 조항)</h2>
            <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-2">
              <p className="text-[var(--foreground)] font-medium">
                본 서비스의 분석 결과는 참고 정보로서 제공되며, 실제 시공 가격을 보증하지 않습니다.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>분석 결과는 통계 데이터와 AI 알고리즘에 기반한 &quot;참고 가격 범위&quot;입니다.</li>
                <li>실제 시공 가격은 현장 조건, 자재 수급, 시공 시기 등에 따라 달라질 수 있습니다.</li>
                <li>회사는 분석 결과를 근거로 한 이용자의 의사결정에 대해 책임을 지지 않습니다.</li>
                <li>분석 결과에 포함된 업체 정보는 참고용이며, 특정 업체를 추천하거나 보증하지 않습니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제4조 (결제 및 환불)</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>서비스 이용 요금은 서비스 페이지에 명시된 금액을 따릅니다.</li>
              <li>환불 정책은 별도의 <Link href="/refund-policy" className="text-[var(--green)] hover:underline">환불 정책</Link> 페이지에서 확인할 수 있습니다.</li>
              <li>결제는 Toss Payments를 통해 안전하게 처리됩니다.</li>
            </ul>
          </section>

          <section>
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제4조의2 (서비스 제공 기간)</h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong className="text-[var(--foreground)]">프로 분석권 (1회권 / 3회권)</strong>: 구매일로부터 1년간 유효합니다. 1년 내 미사용 분석권은 소멸되며, 소멸 전 환불 요청이 가능합니다.</li>
                <li><strong className="text-[var(--foreground)]">월간 구독 (스타터 / 프로 플랜)</strong>: 결제일로부터 1개월간 제공됩니다. 갱신일 전 해지하면 다음 달부터 과금되지 않습니다.</li>
                <li><strong className="text-[var(--foreground)]">무료 분석권</strong>: 회원가입 시 제공되는 무료 분석권은 가입일로부터 1년간 유효합니다.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제5조 (개인정보 보호)</h2>
            <ul className="list-disc list-inside space-y-1.5">
              <li>회사는 이용자의 개인정보를 관련 법령에 따라 보호합니다.</li>
              <li>업로드된 견적서 데이터는 분석 목적으로만 사용되며, 제3자에게 제공되지 않습니다.</li>
              <li>이용자는 본인이 정당하게 보유한 견적서만 업로드해야 합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제6조 (이용 제한)</h2>
            <p>회사는 다음의 경우 서비스 이용을 제한할 수 있습니다.</p>
            <ul className="list-disc list-inside space-y-1.5 mt-2">
              <li>타인의 견적서를 무단으로 업로드하는 행위</li>
              <li>서비스를 영업비밀 침해 목적으로 이용하는 행위</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">제7조 (분쟁 해결)</h2>
            <p>
              서비스 이용에 관한 분쟁은 대한민국 법률을 준거법으로 하며,
              관할 법원은 회사 소재지를 관할하는 법원으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-3">사업자 정보</h2>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)]">
              <ul className="space-y-1">
                <li><strong className="text-[var(--foreground)]">상호:</strong> 스몰테이블</li>
                <li><strong className="text-[var(--foreground)]">대표자:</strong> 배다솜</li>
                <li><strong className="text-[var(--foreground)]">사업자등록번호:</strong> 511-27-58367</li>
                <li><strong className="text-[var(--foreground)]">주소:</strong> 인천광역시 연수구 인천타워대로 301, A동 1301호</li>
                <li><strong className="text-[var(--foreground)]">전화:</strong> 0507-1315-3173</li>
                <li><strong className="text-[var(--foreground)]">이메일:</strong> smalltablekorea@gmail.com</li>
              </ul>
            </div>
          </section>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] text-xs">
            <p>시행일: 2026년 3월 24일</p>
          </div>
        </div>
      </div>
    </div>
  );
}

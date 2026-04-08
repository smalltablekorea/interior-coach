import Link from "next/link";

export const metadata = {
  title: "환불 정책 — 인테리어코치",
  description: "인테리어코치 구독 및 서비스 환불·취소 정책 안내",
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
            <span className="font-bold text-lg">인테리어코치</span>
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
        <h1 className="text-3xl font-bold mb-2">환불 정책</h1>
        <p className="text-[var(--muted)] text-sm mb-10">
          인테리어코치는 고객님의 신뢰를 최우선으로 생각합니다. 아래 기준에 따라 환불을 처리합니다.
        </p>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--muted)]">

          {/* ━━━ 구독 환불 정책 ━━━ */}
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-5 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[var(--green)]" />
              구독 요금제 환불
            </h2>
            <p className="mb-5">
              월간/연간 구독 요금제(Starter, Pro, Enterprise)에 대한 환불 정책입니다.
            </p>

            <div className="space-y-4">
              {/* 7일 무료 체험 */}
              <div className="p-5 rounded-2xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--green)]/20 flex items-center justify-center text-[var(--green)] font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    무료 체험 기간 — 무조건 무료
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-11">
                  <li>7일 무료 체험 기간 중에는 요금이 청구되지 않습니다.</li>
                  <li>체험 기간 내 해지하면 결제가 발생하지 않습니다.</li>
                  <li>별도 사유나 절차 없이, 설정 페이지에서 즉시 해지 가능합니다.</li>
                </ul>
              </div>

              {/* 첫 결제 후 7일 이내 */}
              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    첫 결제 후 7일 이내 — 전액 환불
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-11">
                  <li>첫 결제일로부터 7일 이내에 환불 요청 시 전액 환불됩니다.</li>
                  <li>서비스에 만족하지 못하셨다면 부담 없이 요청해주세요.</li>
                  <li>환불 후 계정은 Free 플랜으로 자동 전환됩니다.</li>
                </ul>
              </div>

              {/* 첫 결제 후 7일 이후 */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--muted)] font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    결제 후 7일 이후 — 잔여 기간 일할 환불
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-11">
                  <li>결제일로부터 7일이 경과한 경우, 잔여 일수 기준으로 일할 계산하여 환불됩니다.</li>
                  <li>
                    <strong className="text-[var(--foreground)]">환불 금액 계산:</strong>{" "}
                    결제 금액 × (잔여일 ÷ 구독기간 총일수) − 결제 수수료(3%)
                  </li>
                  <li>해지 요청 시 현재 결제 주기 말까지 서비스 이용 가능합니다.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ━━━ 연간 구독 ━━━ */}
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-5 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-blue-500" />
              연간 구독 환불
            </h2>
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-[var(--border)] space-y-3">
              <ul className="space-y-1.5">
                <li>
                  <strong className="text-[var(--foreground)]">결제 후 14일 이내:</strong>{" "}
                  전액 환불 (전자상거래법 준수)
                </li>
                <li>
                  <strong className="text-[var(--foreground)]">14일 이후 ~ 3개월 이내:</strong>{" "}
                  잔여 월수 기준 월할 환불 (사용 월수 × 월간 정가 차감)
                </li>
                <li>
                  <strong className="text-[var(--foreground)]">3개월 이후:</strong>{" "}
                  잔여 월수 기준 월할 환불 (결제 수수료 3% 차감)
                </li>
              </ul>
              <p className="text-xs text-[var(--muted)]">
                ※ 연간 할인이 적용된 경우, 사용 기간은 월간 정가 기준으로 정산됩니다.
              </p>
            </div>
          </section>

          {/* ━━━ 견적 분석권 ━━━ */}
          <section>
            <h2 className="text-xl font-bold text-[var(--foreground)] mb-5 flex items-center gap-2">
              <span className="w-1.5 h-6 rounded-full bg-[var(--orange)]" />
              프로 분석권 환불
            </h2>
            <p className="mb-4">
              AI 프로 분석권(1회권 / 3회권)에 대한 환불 정책입니다.
            </p>

            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--green)]/20 flex items-center justify-center text-[var(--green)] font-bold text-sm">
                    1
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    분석 시작 전 — 전액 환불
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-11">
                  <li>결제 후 분석이 아직 시작되지 않은 경우, 전액 환불됩니다.</li>
                  <li>별도 사유 불필요, 즉시 처리됩니다.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm">
                    2
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    분석 완료 후 24시간 이내 — 전액 환불
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-11">
                  <li>분석 결과를 확인하신 후에도 24시간 이내라면 전액 환불됩니다.</li>
                  <li>고객님이 안심하고 서비스를 체험할 수 있도록 마련된 정책입니다.</li>
                </ul>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.02] border border-[var(--border)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center text-[var(--muted)] font-bold text-sm">
                    3
                  </div>
                  <h3 className="text-base font-semibold text-[var(--foreground)]">
                    분석 완료 후 24시간 이후 — 환불 불가
                  </h3>
                </div>
                <ul className="space-y-1.5 ml-11">
                  <li>디지털 콘텐츠 특성상, 분석 완료 후 24시간 경과 시 환불이 불가합니다.</li>
                  <li>
                    <strong className="text-[var(--foreground)]">단, 분석 오류가 확인된 경우</strong>{" "}
                    재분석을 무료로 제공합니다.
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-[var(--orange)]/5 border border-[var(--orange)]/20">
              <p className="text-[var(--foreground)] text-xs font-medium">
                3회권 구매 시, 미사용 분석권에 대해서는 사용 시점과 관계없이 환불 가능합니다.
              </p>
            </div>
          </section>

          {/* ━━━ 서비스 제공 기간 ━━━ */}
          <section>
            <div className="p-5 rounded-2xl bg-blue-500/5 border border-blue-500/20">
              <h2 className="text-lg font-bold text-[var(--foreground)] mb-3 flex items-center gap-2">
                <span className="w-1.5 h-6 rounded-full bg-blue-500" />
                서비스 제공 기간
              </h2>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">1</span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">프로 분석권 (1회권 / 3회권)</p>
                    <p className="text-[var(--muted)] text-xs mt-0.5">구매일로부터 <strong className="text-[var(--foreground)]">1년간</strong> 유효합니다. 1년 내 미사용 분석권은 소멸되며, 소멸 전 환불 요청 가능합니다.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="shrink-0 w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs">2</span>
                  <div>
                    <p className="font-medium text-[var(--foreground)]">월간 구독 (스타터 / 프로 플랜)</p>
                    <p className="text-[var(--muted)] text-xs mt-0.5">결제일로부터 <strong className="text-[var(--foreground)]">1개월간</strong> 제공됩니다. 갱신일 전 해지하면 다음 달부터 과금되지 않습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ━━━ 공통 안내사항 ━━━ */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">공통 안내사항</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)]">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">환불 처리 기간</h3>
                  <ul className="space-y-1 text-xs">
                    <li>신용카드: 영업일 기준 3~5일</li>
                    <li>계좌이체: 영업일 기준 1~3일</li>
                    <li>간편결제: 결제수단별 상이</li>
                  </ul>
                </div>
                <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)]">
                  <h3 className="font-medium text-[var(--foreground)] mb-2">환불 요청 방법</h3>
                  <ul className="space-y-1 text-xs">
                    <li>설정 → 구독 관리에서 직접 해지</li>
                    <li>고객센터 전화 요청</li>
                    <li>이메일 환불 요청</li>
                  </ul>
                </div>
              </div>

              <ul className="list-disc list-inside space-y-1.5">
                <li>프로모션 할인이 적용된 경우, 실 결제 금액 기준으로 환불됩니다.</li>
                <li>무료 플랜(Free)은 결제가 없으므로 환불 대상이 아닙니다.</li>
                <li>환불 완료 후에도 해당 결제 주기 말까지는 유료 기능을 이용하실 수 있습니다.</li>
                <li>워크스페이스에 저장된 데이터는 플랜 다운그레이드 후에도 삭제되지 않습니다.</li>
              </ul>
            </div>
          </section>

          {/* ━━━ 환불 불가 사유 ━━━ */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">환불이 제한되는 경우</h2>
            <div className="p-4 rounded-xl bg-[var(--red)]/5 border border-[var(--red)]/20">
              <ul className="space-y-1.5">
                <li>서비스 이용약관 위반으로 인한 이용 정지의 경우</li>
                <li>타인의 결제 정보를 도용하여 결제한 경우</li>
                <li>환불 후 동일 프로모션을 재이용할 목적의 반복적 환불 요청</li>
              </ul>
            </div>
          </section>

          {/* ━━━ 문의 ━━━ */}
          <section>
            <h2 className="text-lg font-semibold text-[var(--foreground)] mb-4">문의</h2>
            <p className="mb-3">환불 관련 문의는 아래로 연락해주세요.</p>
            <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)]">
              <ul className="space-y-1.5">
                <li><strong className="text-[var(--foreground)]">전화:</strong> 0507-1315-3173 (평일 10:00~18:00)</li>
                <li><strong className="text-[var(--foreground)]">이메일:</strong> smalltablekorea@gmail.com</li>
                <li><strong className="text-[var(--foreground)]">상호:</strong> 스몰테이블 | 대표: 배다솜</li>
                <li><strong className="text-[var(--foreground)]">사업자등록번호:</strong> 511-27-58367</li>
              </ul>
            </div>
          </section>

          <div className="p-4 rounded-xl bg-white/[0.02] border border-[var(--border)] text-xs space-y-1">
            <p>시행일: 2026년 4월 2일</p>
            <p>
              본 환불 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」 및
              「콘텐츠산업 진흥법」에 따라 운영됩니다.
            </p>
          </div>

          <div className="flex gap-3 text-xs">
            <Link href="/terms" className="text-[var(--green)] hover:underline">이용약관</Link>
            <span className="text-[var(--border)]">|</span>
            <Link href="/pricing" className="text-[var(--green)] hover:underline">요금제 안내</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";

export default function FooterSection() {
  return (
    <footer className="py-12 border-t border-[var(--landing-border)]">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Link href="/" className="text-lg font-semibold text-[var(--landing-heading)]">
              <span className="text-[var(--landing-accent)]">인테리어</span>코치
            </Link>
            <p className="mt-3 text-sm text-[var(--landing-body)] max-w-sm leading-relaxed font-light">
              현장을 아는 사람이 만든 인테리어 업체 운영 올인원 SaaS.
              견적부터 공정 관리, 정산까지 한 곳에서.
            </p>
            <p className="mt-4 text-xs text-[var(--landing-body)]">
              스몰테이블디자인그룹 · 사업자등록번호 511-27-58367
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--landing-heading)] mb-4">
              서비스
            </p>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors font-light">
                  기능
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors font-light">
                  요금제
                </a>
              </li>
              <li>
                <Link href="/demo-request" className="text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors font-light">
                  데모 신청
                </Link>
              </li>
              <li>
                <Link href="/qna" className="text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors font-light">
                  Q&A
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--landing-heading)] mb-4">
              법적 고지
            </p>
            <ul className="space-y-2.5">
              <li>
                <Link href="/terms" className="text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors font-light">
                  이용약관
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm text-[var(--landing-body)] hover:text-[var(--landing-heading)] transition-colors font-light">
                  환불 정책
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[var(--landing-border)] text-xs text-[var(--landing-body)] font-light">
          © {new Date().getFullYear()} 스몰테이블디자인그룹. All rights reserved.
        </div>
      </div>
    </footer>
  );
}

import Link from "next/link";

const productLinks = [
  { label: "기능", href: "#features" },
  { label: "요금제", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const supportLinks = [
  { label: "데모 신청", href: "/demo-request" },
  { label: "고객센터", href: "/qna" },
];

const legalLinks = [
  { label: "이용약관", href: "/terms" },
  { label: "환불정책", href: "/refund-policy" },
];

export default function FooterSection() {
  return (
    <footer className="border-t border-[var(--landing-border)]">
      <div className="mx-auto max-w-6xl px-6 py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-6">
          {/* Brand column — spans 3 on desktop */}
          <div className="md:col-span-3">
            <Link
              href="/"
              className="text-lg text-[var(--landing-heading)]"
              style={{ fontWeight: 600 }}
            >
              <span className="text-[var(--landing-accent)]">인테리어</span>
              코치
            </Link>
            <p
              className="mt-3 max-w-sm text-sm leading-relaxed text-[var(--landing-body)]"
              style={{ fontWeight: 300 }}
            >
              현장을 아는 사람이 만든 인테리어 업체 운영 올인원 SaaS.
              <br />
              견적부터 공정 관리, 정산까지 한 곳에서.
            </p>
            <p className="mt-5 text-xs text-[var(--landing-body)]/60">
              contact@interiorcoach.kr
            </p>
          </div>

          {/* Product */}
          <div>
            <p
              className="mb-4 text-sm text-[var(--landing-heading)]"
              style={{ fontWeight: 500 }}
            >
              서비스
            </p>
            <ul className="space-y-2.5">
              {productLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <p
              className="mb-4 text-sm text-[var(--landing-heading)]"
              style={{ fontWeight: 500 }}
            >
              지원
            </p>
            <ul className="space-y-2.5">
              {supportLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p
              className="mb-4 text-sm text-[var(--landing-heading)]"
              style={{ fontWeight: 500 }}
            >
              법적 고지
            </p>
            <ul className="space-y-2.5">
              {legalLinks.map((l) => (
                <li key={l.href}>
                  <FooterLink href={l.href}>{l.label}</FooterLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col gap-2 border-t border-[var(--landing-border)] pt-6 text-xs text-[var(--landing-body)] sm:flex-row sm:items-center sm:justify-between" style={{ fontWeight: 300 }}>
          <span>
            © {new Date().getFullYear()} 스몰테이블디자인그룹. All rights
            reserved.
          </span>
          <span className="text-[var(--landing-body)]/50">
            사업자등록번호 511-27-58367
          </span>
        </div>
      </div>
    </footer>
  );
}

/* ─── Shared link component ─── */
function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const isExternal = href.startsWith("http");
  const isAnchor = href.startsWith("#");

  if (isExternal || isAnchor) {
    return (
      <a
        href={href}
        className="text-sm text-[var(--landing-body)] transition-colors hover:text-[var(--landing-heading)]"
        style={{ fontWeight: 300 }}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }

  return (
    <Link
      href={href}
      className="text-sm text-[var(--landing-body)] transition-colors hover:text-[var(--landing-heading)]"
      style={{ fontWeight: 300 }}
    >
      {children}
    </Link>
  );
}

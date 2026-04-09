"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, CheckCircle2, MessageSquare, Clock, Camera, ChevronRight } from "lucide-react";

const LiveDemo = dynamic(() => import("@/components/landing/LiveDemo"), { ssr: false });

// ─── 헤드라인 A/B variant (env: NEXT_PUBLIC_HEADLINE_VARIANT) ───
const HEADLINES: Record<string, { main: string; sub: string }> = {
  "1": { main: "현장이 돌아가는\n단 하나의 톡방", sub: "카톡 100개의 지옥 대신, 현장마다 톡방 하나.\n고객과 목수, 자재상까지 한 화면에서." },
  "2": { main: "카톡 100개 대신,\n현장 하나에 톡방 하나", sub: "시공 사진, 공정 일정, 자재 발주, 고객 공유까지.\n흩어진 현장 소통을 하나로 정리합니다." },
  "3": { main: "밤 11시에도\n현장은 혼자 돌아갑니다", sub: "사진 자동 정리, 공정 알림, 고객 포털.\n사장님이 안 봐도 현장은 돌아갑니다." },
  "4": { main: "고객에게 '이 업체\n뭔가 다르네' 듣는 톡방", sub: "고객 포털 하나로 신뢰가 올라갑니다.\n진행 상황을 실시간으로 공유하세요." },
  "5": { main: "인테리어 현장이\n처음으로 정리되는 곳", sub: "카톡에 묻힌 사진, 엑셀 공정표, 전화 수금.\n전부 한 곳에서 해결됩니다." },
};
const variant = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_HEADLINE_VARIANT || "1")
  : "1";
const headline = HEADLINES[variant] || HEADLINES["1"];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* ─── Nav ─── */}
      <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-[var(--green)]">인테리어코치</Link>
          <div className="flex items-center gap-4">
            <Link href="/estimates/coach" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block">견적코치</Link>
            <Link href="/pricing" className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors hidden sm:block">요금제</Link>
            <Link href="/auth/login" className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-semibold hover:opacity-90 transition-opacity">
              무료로 시작하기
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.04] border border-[var(--border)] mb-8">
            <span className="text-xs text-[var(--muted)]">베타 운영 중</span>
            <span className="w-px h-3 bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">자재DB 868건</span>
            <span className="w-px h-3 bg-[var(--border)]" />
            <span className="text-xs text-[var(--muted)]">Build in Public</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight whitespace-pre-line">
            {headline.main.split("\n").map((line, i) => (
              <span key={i}>
                {i === 1 ? <span className="text-[var(--green)]">{line}</span> : line}
                {i === 0 && <br />}
              </span>
            ))}
          </h1>

          <p className="mt-6 text-lg md:text-xl text-[var(--muted)] max-w-2xl mx-auto leading-relaxed whitespace-pre-line">
            {headline.sub}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-10">
            <Link href="/auth/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--green)] text-black font-bold text-base hover:opacity-90 transition-opacity">
              무료로 시작하기 <ArrowRight size={18} />
            </Link>
            <a href="#demo" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-white/[0.04] transition-colors">
              어떻게 동작하나요 <ChevronRight size={16} />
            </a>
          </div>

          <p className="mt-4 text-xs text-[var(--muted)]">14일 무료 체험 · 카드 등록 불필요 · 해지 버튼 한 번</p>
        </div>
      </section>

      {/* ─── Live Demo ─── */}
      <section id="demo" className="py-16 md:py-24 bg-white/[0.02]">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold text-[var(--green)] mb-3">직접 보세요</p>
            <h2 className="text-2xl md:text-3xl font-bold">실제 현장 톡방은 이렇게 동작합니다</h2>
            <p className="text-sm text-[var(--muted)] mt-2">가입 없이 아래에서 바로 확인하세요</p>
          </div>
          <LiveDemo />
        </div>
      </section>

      {/* ─── Problem Agitation ─── */}
      <section className="py-16 md:py-24 bg-white/[0.02]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold">이런 경험, 있으시죠?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: "😵", title: "밤 11시, 카톡 100개", desc: "단톡방 3개에 사진, 메모, 도면이 뒤섞여 있습니다. 어제 목수한테 보낸 게 어디 있는지 10분째 찾고 있어요." },
              { emoji: "📞", title: "'지금 어디까지 됐나요?'", desc: "고객은 매일 전화합니다. 진행 상황을 하나하나 설명하느라 하루에 30분이 사라져요." },
              { emoji: "💸", title: "수금 떼인 뒤에야", desc: "잔금 날짜를 놓쳐서 3번이나 전화해야 했습니다. 엑셀에 적어놨는데 현장에서는 못 봤어요." },
            ].map((card, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
                <span className="text-2xl">{card.emoji}</span>
                <h3 className="text-base font-bold mt-3 mb-2">{card.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The Single Room Promise ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-sm font-semibold text-[var(--green)] mb-3">해결책</p>
            <h2 className="text-2xl md:text-3xl font-bold">현장 하나에 톡방 하나</h2>
            <p className="text-sm text-[var(--muted)] mt-2">채팅 + 사이드바(진행률·수금·하자) + 자동 사진 아카이브. 고객도 같은 방에서 볼 수 있습니다.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <MessageSquare size={24} />, title: "현장 톡방", desc: "사진, 메모, 파일을 현장별로 정리. 카톡 대신 여기서 소통. 고객에게 링크 하나로 공유." },
              { icon: <Clock size={24} />, title: "AI 공정매니저", desc: "평수+공종만 선택하면 공정표 자동 생성. 간트차트, 드래그 일정 조절, 발주 타이밍 알림." },
              { icon: <Camera size={24} />, title: "시공 사진 관리", desc: "날짜·공종별 자동 정리. 준공 사진 관리. 고객 포털에 바로 공유." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--green)]/30 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-[var(--green)]/10 flex items-center justify-center text-[var(--green)] mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Founder Story ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center gap-10">
            {/* PHOTO_PENDING — 촬영 후 교체 */}
            <div className="shrink-0 w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-[var(--card)] border border-[var(--border)] flex items-center justify-center">
              <svg viewBox="0 0 80 80" className="w-20 h-20 text-[var(--muted)]">
                <circle cx="40" cy="28" r="14" fill="currentColor" opacity="0.3" />
                <path d="M15 70c0-14 11-25 25-25s25 11 25 25" fill="currentColor" opacity="0.2" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--green)] mb-2">만드는 사람</p>
              <h2 className="text-xl md:text-2xl font-bold mb-4">
                7년차 현역 인테리어 창업가가 직접 쓰려고 만들고 있습니다.
              </h2>
              <p className="text-sm text-[var(--muted)] leading-relaxed mb-3">
                잠실 르엘 현장에서 지금 이 제품으로 일하고 있어요.
                카톡 단톡방에 사진이 묻히고, 고객은 매일 전화하고, 엑셀 공정표는 현장에서 쓸 수가 없었습니다.
              </p>
              <p className="text-sm text-[var(--muted)] leading-relaxed">
                그래서 직접 만들었습니다. 현장 사장님이 매일 쓰는 도구를, 현장 사장님 입장에서.
              </p>
              <p className="mt-4 text-sm font-medium">배다솜 · 스몰테이블 대표</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Roadmap Transparency ─── */}
      <section className="py-16 md:py-24 bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">이 순서대로 만들고 있습니다</h2>
            <p className="text-sm text-[var(--muted)] mt-2">Threads에서 실시간 공개 중</p>
          </div>
          <div className="space-y-3">
            {[
              { status: "done", label: "현장 톡방 + 고객 포털", when: "지금" },
              { status: "next", label: "공정매니저 심화", when: "Q2 2026" },
              { status: "plan", label: "견적코치 연동", when: "Q3 2026" },
              { status: "plan", label: "마케팅 자동화", when: "Q4 2026" },
              { status: "plan", label: "세무/회계", when: "2027" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-[var(--card)] border border-[var(--border)]">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  item.status === "done" ? "bg-[var(--green)]/20 text-[var(--green)]" :
                  item.status === "next" ? "bg-amber-500/20 text-amber-400" :
                  "bg-white/[0.06] text-[var(--muted)]"
                }`}>
                  {item.status === "done" ? <CheckCircle2 size={14} /> : item.status === "next" ? "🔜" : "○"}
                </span>
                <span className="flex-1 text-sm font-medium">{item.label}</span>
                <span className="text-xs text-[var(--muted)]">{item.when}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing — 단순화 ─── */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">가격</h2>
          <div className="p-8 rounded-2xl bg-[var(--card)] border-2 border-[var(--green)] max-w-md mx-auto">
            <p className="text-sm text-[var(--muted)] mb-2">월간 구독</p>
            <p className="text-4xl font-black">300,000<span className="text-base font-normal text-[var(--muted)]">원/월</span></p>
            <p className="text-sm text-[var(--green)] mt-2 mb-6">14일 무료 체험 · 카드 등록 불필요 · 언제든 해지</p>
            <ul className="text-left space-y-2 mb-6">
              {[
                "현장 톡방 무제한",
                "고객 포털 공유",
                "AI 공정매니저",
                "시공 사진 관리",
                "견적 분석 AI",
                "고객·협력사 관리",
              ].map((f, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <CheckCircle2 size={14} className="text-[var(--green)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/login" className="block w-full py-3.5 rounded-xl bg-[var(--green)] text-black font-bold text-center hover:opacity-90 transition-opacity">
              14일 무료 체험 시작
            </Link>
          </div>
          <p className="mt-4 text-xs text-[var(--muted)]">
            현장 3개까지는 무료 플랜으로 계속 사용 가능
          </p>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 bg-gradient-to-b from-[var(--green)]/10 to-transparent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl md:text-3xl font-bold">
            지금 바로 시작해서,
            <br />
            5분 안에 샘플 현장 톡방을 써보세요.
          </h2>
          <p className="text-[var(--muted)] mt-4">가입 즉시 샘플 현장이 자동 생성됩니다.</p>
          <Link href="/auth/login" className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[var(--green)] text-black font-bold text-base hover:opacity-90 transition-opacity mt-8">
            무료로 시작하기 <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-[var(--border)] py-12 text-xs text-[var(--muted)]">
        <div className="mx-auto max-w-4xl px-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-1.5">
              <p className="font-medium text-sm text-[var(--foreground)]/80">스몰테이블</p>
              <p>대표자명: 배다솜</p>
              <p>사업자등록번호: 511-27-58367</p>
              <p>통신판매업 신고번호: 제2026-인천연수-0926호</p>
            </div>
            <div className="space-y-1.5">
              <p>인천광역시 연수구 인천타워대로 301, A동 30층</p>
              <p>유선번호: 0507-1315-3173</p>
              <p>이메일: smalltablekorea@gmail.com</p>
              <p className="mt-1">
                <a href="https://www.ftc.go.kr/bizCommPop.do?wrkr_no=5112758367" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--foreground)]">
                  사업자정보 확인
                </a>
              </p>
            </div>
            <div className="space-y-1.5">
              <Link href="/pricing" className="hover:text-[var(--foreground)] transition-colors block">요금제</Link>
              <Link href="/auth/login" className="hover:text-[var(--foreground)] transition-colors block">로그인</Link>
              <Link href="/estimates/coach" className="hover:text-[var(--foreground)] transition-colors block">견적코치 AI</Link>
              <Link href="/refund-policy" className="hover:text-[var(--foreground)] transition-colors block">환불 정책</Link>
              <Link href="/terms" className="hover:text-[var(--foreground)] transition-colors block">이용약관</Link>
            </div>
          </div>
          <div className="mt-6 border-t border-[var(--border)] pt-6 text-center space-y-2">
            <p className="text-[10px] text-[var(--muted)]/60 max-w-xl mx-auto leading-relaxed">
              본 서비스의 견적 분석은 참고용이며, 실제 시공 가격은 현장 조건에 따라 달라질 수 있습니다.
              인테리어코치는 가격을 보증하지 않으며, 본 분석을 근거로 한 의사결정에 대해 책임지지 않습니다.
            </p>
            <p>&copy; 2026 스몰테이블. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

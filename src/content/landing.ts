/**
 * 랜딩페이지 카피/구조 (placeholder).
 * 마케팅/브랜딩 봇 최종 카피가 나오면 이 파일만 교체하면 됨.
 */

export const landingCopy = {
  nav: {
    logo: "인테리어코치",
    links: [
      { label: "기능", href: "#features" },
      { label: "케이스", href: "#case" },
      { label: "요금제", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    ctaLogin: { label: "로그인", href: "/auth/login" },
    ctaSignup: { label: "14일 무료 시작", href: "/auth/signup" },
  },

  hero: {
    eyebrow: "인테리어 업체 현장 운영 올인원 SaaS",
    titleLines: ["현장 5개, 카톡방 50개,", "엑셀 100장 — 이제 한 곳에서."],
    subtitle:
      "공정 매니저, 현장 톡방, 견적·계약·정산까지.\n현장 하나당 화면 하나로 정리됩니다.",
    primaryCta: { label: "14일 무료 시작", href: "/auth/signup" },
    secondaryCta: { label: "데모 신청", href: "/demo-request" },
    meta: "카드 등록 불필요 · 2분 만에 첫 현장 등록",
  },

  painPoints: {
    eyebrow: "이런 현장, 익숙하시죠",
    title: "현장이 많아질수록\n사장님만 손해 보는 구조",
    cards: [
      {
        icon: "MessageSquare",
        title: "카톡방이 폭발",
        body: "현장마다 단톡, 자재상 톡, 고객 톡.\n어느 방에 뭐가 있었는지 기억이 안 납니다.",
      },
      {
        icon: "FileSpreadsheet",
        title: "엑셀이 버전 지옥",
        body: "공정표_최종_진짜최종_v3.xlsx.\n누가 뭘 고쳤는지 추적이 불가능합니다.",
      },
      {
        icon: "Phone",
        title: "밤 11시에 울리는 전화",
        body: "오늘 공정 어디까지 갔냐는 고객 문의.\n사장님이 일일이 답하고 있습니다.",
      },
      {
        icon: "Wallet",
        title: "돈 흐름이 안 잡힘",
        body: "받을 돈, 나갈 돈, 남는 돈.\n월말에야 통장 보고 계산합니다.",
      },
    ],
  },

  features: {
    eyebrow: "6가지 핵심 기능",
    title: "현장 하나를\n끝까지 책임지는 워크플로우",
    blocks: [
      {
        name: "공정 매니저",
        problem: "엑셀 공정표는 공유 즉시 구버전이 됩니다.",
        solution:
          "현장별 공정 타임라인을 모두가 같은 화면에서 봅니다.\n완료 체크 한 번이면 고객 포털에도 자동 반영.",
        mockup: "schedule",
      },
      {
        name: "현장 톡방 + 고객 포털",
        problem: "카톡방에 고객·작업자·자재상이 뒤섞여 있습니다.",
        solution:
          "현장마다 톡방 1개, 고객은 별도 포털로 분리.\n사진·공정·결제 요청까지 한 화면에서.",
        mockup: "chat",
      },
      {
        name: "견적코치 AI",
        problem: "견적서 만드는 데 반나절씩 걸립니다.",
        solution:
          "자재 단가 DB 868건 기반 AI 견적 생성.\n항목만 체크하면 고객용 PDF까지 자동.",
        mockup: "estimate",
      },
      {
        name: "계약·전자 서명",
        problem: "계약서 출력하고 도장 받으러 다닙니다.",
        solution:
          "링크 하나로 모바일 서명 완료.\n계약 이력·수정 버전까지 자동 보관.",
        mockup: "contract",
      },
      {
        name: "지출·정산 리포트",
        problem: "남는 돈이 얼만지 월말에야 알 수 있습니다.",
        solution:
          "영수증 OCR, 카테고리 자동 분류.\n현장별 원가율·수익률을 실시간으로.",
        mockup: "settlement",
      },
      {
        name: "자재 발주·재고",
        problem: "자재 재고가 종이 장부에 있습니다.",
        solution:
          "868건 단가 DB로 발주서 1분 완성.\n현장별 자재 투입량도 자동 집계.",
        mockup: "materials",
      },
    ],
  },

  caseStudy: {
    eyebrow: "실제 현장 사례",
    title: "잠실르엘 리모델링",
    subtitle: "32평 전체 리모델링, 공정 6주",
    summary:
      "기존에는 카톡방 4개와 엑셀 3개로 관리하던 현장을,\n인테리어코치 도입 후 단일 화면으로 통합했습니다.",
    stats: [
      { label: "계약 금액", value: "4,800만원" },
      { label: "공사 기간", value: "6주" },
      { label: "공정 진행률", value: "100%" },
    ],
    timeline: [
      { week: "1주차", label: "철거 · 목공 시작" },
      { week: "2주차", label: "전기 · 배관 마감" },
      { week: "3주차", label: "타일 · 도장" },
      { week: "4주차", label: "가구 · 조명 설치" },
      { week: "5주차", label: "필름 · 마감재" },
      { week: "6주차", label: "청소 · 입주 검수" },
    ],
  },

  whyUs: {
    eyebrow: "왜 인테리어코치인가",
    title: "현장을 아는 사람이\n만든 도구입니다",
    cards: [
      {
        headline: "자재 단가 DB 868건",
        body: "실제 공급가 기반으로 구축된 DB.\n견적·발주·원가 계산이 모두 같은 소스로 동작합니다.",
      },
      {
        headline: "현직 인테리어 대표 설계",
        body: "실제 현장을 10년 넘게 돌린 대표가 직접 설계.\nSaaS 기획자가 상상한 워크플로우가 아닙니다.",
      },
      {
        headline: "견적부터 정산까지 올인원",
        body: "따로 구입한 툴 5개를 하나로 통합합니다.\n구독료·학습 비용·전환 스트레스 모두 감소.",
      },
    ],
  },

  pricing: {
    eyebrow: "요금제",
    title: "현장 규모에 맞게 선택하세요",
    subtitle: "모든 플랜 14일 무료 · 카드 등록 불필요",
    plans: [
      {
        name: "Starter",
        monthly: 29000,
        yearly: 290000,
        tagline: "작은 업체 · 팀원 2~3명",
        features: [
          "현장 10개",
          "팀원 3명",
          "견적코치 AI (월 20건)",
          "고객 포털",
          "이메일 지원",
        ],
        ctaLabel: "14일 무료 시작",
        ctaHref: "/auth/signup?plan=starter",
        highlight: false,
      },
      {
        name: "Pro",
        monthly: 69000,
        yearly: 690000,
        tagline: "성장 중인 업체",
        features: [
          "현장 무제한",
          "팀원 10명",
          "견적코치 AI (월 100건)",
          "자재/작업자 관리",
          "마케팅 자동화",
          "우선 지원",
        ],
        ctaLabel: "Pro 시작하기",
        ctaHref: "/auth/signup?plan=pro",
        highlight: true,
        badge: "가장 인기",
      },
      {
        name: "Enterprise",
        monthly: null,
        yearly: null,
        tagline: "다현장 · 지점 운영",
        features: [
          "현장/팀원 무제한",
          "전담 매니저",
          "데이터 마이그레이션",
          "맞춤 교육",
          "SLA 보장",
        ],
        ctaLabel: "상담 요청",
        ctaHref: "/demo-request",
        highlight: false,
      },
    ],
  },

  faq: {
    eyebrow: "자주 묻는 질문",
    title: "도입 전 궁금한 점",
    items: [
      {
        q: "14일 무료 체험은 정말 카드 등록 없이 되나요?",
        a: "네. 이메일만 있으면 시작할 수 있습니다. 14일 후에도 자동 결제되지 않습니다.",
      },
      {
        q: "기존에 쓰던 엑셀·카톡 데이터를 옮길 수 있나요?",
        a: "Starter 이상 플랜에서는 CSV 일괄 업로드를 지원합니다. Pro 이상은 전담 매니저가 마이그레이션을 도와드립니다.",
      },
      {
        q: "고객이 별도 앱을 설치해야 하나요?",
        a: "아니요. 고객 포털은 모바일 웹 기반이라 링크 한 번 누르면 바로 열립니다.",
      },
      {
        q: "현장에서 인터넷이 안 되면 어떻게 되나요?",
        a: "사진·메모 기록은 오프라인에서 임시 저장되고, 네트워크 연결 시 자동 동기화됩니다.",
      },
      {
        q: "도중에 플랜을 바꾸거나 해지할 수 있나요?",
        a: "언제든 가능합니다. 설정 화면에서 버튼 한 번으로 업/다운그레이드·해지가 됩니다.",
      },
    ],
  },

  testimonials: {
    eyebrow: "고객 후기",
    title: "현장에서 직접 써본\n사장님들의 이야기",
    reviews: [
      {
        name: "김태현 대표",
        company: "태현인테리어",
        role: "주거 인테리어 · 서울",
        quote:
          "현장 5개를 카톡방 20개로 관리하다 미칠 뻔했는데, 인테리어코치 도입 후 화면 하나로 정리됐습니다. 특히 고객 포털이 진짜 좋아요.",
        metric: "관리 시간 60% 감소",
      },
      {
        name: "이수진 실장",
        company: "모던하우스디자인",
        role: "상업 인테리어 · 경기",
        quote:
          "견적코치 AI로 견적서 만드는 시간이 반나절에서 30분으로 줄었어요. 고객한테도 전문적으로 보이니까 계약 전환율도 올랐습니다.",
        metric: "견적 작성 시간 80% 단축",
      },
      {
        name: "박준혁 대표",
        company: "준혁건설",
        role: "리모델링 전문 · 인천",
        quote:
          "공정 매니저가 진짜 현장을 아는 사람이 만든 거라는 게 느껴집니다. 작업자들도 바로 적응하고, 고객 문의도 확 줄었어요.",
        metric: "고객 문의 40% 감소",
      },
    ],
  },

  finalCta: {
    title: "오늘 현장 등록, 내일 바로 쓰실 수 있습니다",
    subtitle:
      "14일 무료. 카드 등록 불필요. 해지는 버튼 한 번.\n먼저 써보시고 결정하셔도 늦지 않습니다.",
    primary: { label: "14일 무료 시작", href: "/auth/signup" },
    secondary: { label: "데모 신청", href: "/demo-request" },
  },
} as const;

export type LandingCopy = typeof landingCopy;

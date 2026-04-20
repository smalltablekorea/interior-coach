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
      "공정 매니저, 현장 손익, 견적·계약·정산까지.\n현장 하나당 화면 하나로 정리됩니다.",
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
    eyebrow: "12가지 핵심 기능",
    title: "현장 하나를\n끝까지 책임지는 워크플로우",
    blocks: [
      // 기존 4 블록 (Part A에서 톡방/전자서명 2블록 제거)
      {
        name: "공정 매니저",
        problem: "엑셀 공정표는 공유 즉시 구버전이 됩니다.",
        solution:
          "현장별 공정 타임라인을 모두가 같은 화면에서 봅니다.\n완료 체크 한 번이면 자동 반영.",
        mockup: "schedule",
      },
      {
        name: "견적코치 AI",
        problem: "견적서 만드는 데 반나절씩 걸립니다.",
        solution:
          "자재 단가 DB 868건 기반 AI 견적 생성.\n항목만 체크하면 고객용 PDF까지 자동.",
        mockup: "estimate",
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
      // 신규 8 블록 (Part C — 카피는 마케팅 봇 산출물 대기, placeholder)
      {
        name: "현장 손익 관리",
        problem: "계약금 대비 지금 얼마 남았는지 월말에야 압니다.",
        solution:
          "현장별 계약금·투입비·예상 이익을 실시간으로.\n저마진 현장은 대시보드에서 먼저 경고.",
        mockup: "pnl",
        isNew: true,
      },
      {
        name: "세금계산서 관리",
        problem: "세금계산서 발행 놓치면 매출 증빙이 막힙니다.",
        solution:
          "미발행 건 자동 감지.\n발행 필요일 D-day 알림 + 한 화면에서 일괄 발행.",
        mockup: "invoice",
        isNew: true,
      },
      {
        name: "하자관리",
        problem: "카톡 사진으로 받은 하자를 엑셀에 정리합니다.",
        solution:
          "현장 사진 업로드 → AI가 공종·심각도 자동 분류.\n접수/진행/해결/종료 칸반으로 끝까지 추적.",
        mockup: "defects",
        isNew: true,
      },
      {
        name: "업무일지",
        problem: "오늘 누가 뭘 했는지 기억이 안 납니다.",
        solution:
          "현장별 하루 1개 일지.\n공종·인원·특이사항·사진까지 고객 공유 옵션 포함.",
        mockup: "dailyLog",
        isNew: true,
      },
      {
        name: "근태급여",
        problem: "일당 정산하려고 달력에 동그라미 치고 있습니다.",
        solution:
          "현장별 출퇴근 입력 → 월말에 자동 합산.\n급여 대장·4대보험 차감까지 한 번에.",
        mockup: "attendance",
        isNew: true,
      },
      {
        name: "반장·기사 인력풀",
        problem: "전에 썼던 목공 반장 번호를 또 뒤적입니다.",
        solution:
          "공종별 인력 DB + 평점·재고용률.\n공정 배정 시 추천 순으로 자동 정렬.",
        mockup: "workers",
        isNew: true,
      },
      {
        name: "월간 리포트",
        problem: "이번달 순이익이 얼마인지 정산하려면 하루 종일.",
        solution:
          "매월 1일 자동 생성.\n현장별 손익·공종별 비용·전년 동월 비교까지.",
        mockup: "monthly",
        isNew: true,
      },
      {
        name: "공사 유형 템플릿",
        problem: "현장마다 공정표를 처음부터 만듭니다.",
        solution:
          "아파트·상가·주택 5종 기본 템플릿.\n내 현장을 템플릿으로 저장해 다음 현장에 그대로 적용.",
        mockup: "templates",
        isNew: true,
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

  // Part B: 4티어 → 3티어 (무료 · 월간 · 연간).
  // 월간/연간은 동일 기능을 주기만 달리하는 구조. 구체 가격/기능 목록은 마케팅 봇 산출물 도착 시 교체.
  pricing: {
    eyebrow: "요금제",
    title: "심플하게, 3가지 선택지",
    subtitle: "모든 유료 플랜 14일 무료 · 카드 등록 불필요",
    plans: [
      {
        name: "무료",
        monthly: 0,
        yearly: 0,
        tagline: "혼자 시작하는 1인 사장님",
        features: [
          "현장 1개 관리",
          "기본 견적·계약",
          "고객 5명",
          "커뮤니티 지원",
        ],
        ctaLabel: "무료로 시작",
        ctaHref: "/auth/signup",
        highlight: false,
      },
      {
        name: "월간 결제",
        monthly: 79000,
        yearly: 79000 * 12,
        tagline: "부담 없이 월 단위로",
        features: [
          "전체 기능",
          "현장 무제한",
          "팀원 10명",
          "견적코치 AI",
          "자재·작업자·근태·하자 전체",
          "세무/세금계산서",
          "월간 리포트 자동 생성",
          "이메일·채팅 지원",
        ],
        ctaLabel: "14일 무료 시작",
        ctaHref: "/auth/signup?plan=monthly",
        highlight: false,
      },
      {
        name: "연간 결제",
        monthly: null,
        yearly: 790000,
        tagline: "2개월 할인 · 가장 많이 선택",
        features: [
          "월간 결제의 모든 기능",
          "2개월 무료 (연 할인 17%)",
          "전담 매니저 (Pro 지원)",
          "데이터 마이그레이션 지원",
          "맞춤 교육 1회",
        ],
        ctaLabel: "연간 결제 시작",
        ctaHref: "/auth/signup?plan=yearly",
        highlight: true,
        badge: "가장 인기",
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
        a: "월간/연간 결제 플랜에서 CSV 일괄 업로드를 지원합니다. 연간 결제는 전담 매니저가 마이그레이션을 도와드립니다.",
      },
      {
        q: "현장에서 모바일로도 쓸 수 있나요?",
        a: "네. 모든 주요 화면이 모바일 최적화되어 있어 현장에서 사진 업로드·공정 체크·지출 기록이 바로 됩니다.",
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

  finalCta: {
    title: "오늘 현장 등록, 내일 바로 쓰실 수 있습니다",
    subtitle:
      "14일 무료. 카드 등록 불필요. 해지는 버튼 한 번.\n먼저 써보시고 결정하셔도 늦지 않습니다.",
    primary: { label: "14일 무료 시작", href: "/auth/signup" },
    secondary: { label: "데모 신청", href: "/demo-request" },
  },
} as const;

export type LandingCopy = typeof landingCopy;

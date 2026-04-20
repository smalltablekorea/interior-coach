import MockupFrame from "./MockupFrame";

type MockupKind =
  | "schedule"
  | "estimate"
  | "settlement"
  | "materials"
  | "pnl"
  | "invoice"
  | "defects"
  | "dailyLog"
  | "attendance"
  | "workers"
  | "monthly"
  | "templates";

export default function FeatureMockup({ kind }: { kind: MockupKind }) {
  switch (kind) {
    case "schedule":
      return <ScheduleMockup />;
    case "estimate":
      return <EstimateMockup />;
    case "settlement":
      return <SettlementMockup />;
    case "materials":
      return <MaterialsMockup />;
    case "pnl":
      return <PnLMockup />;
    case "invoice":
      return <InvoiceMockup />;
    case "defects":
      return <DefectsMockup />;
    case "dailyLog":
      return <DailyLogMockup />;
    case "attendance":
      return <AttendanceMockup />;
    case "workers":
      return <WorkersMockup />;
    case "monthly":
      return <MonthlyMockup />;
    case "templates":
      return <TemplatesMockup />;
  }
}

function ScheduleMockup() {
  const rows = [
    { name: "철거", progress: 100 },
    { name: "목공", progress: 80 },
    { name: "전기", progress: 45 },
    { name: "타일", progress: 10 },
  ];
  return (
    <MockupFrame title="interior-coach / schedule">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--muted)]">잠실르엘 · 3주차</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">
            진행 58%
          </span>
        </div>
        {rows.map((r) => (
          <div key={r.name} className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span>{r.name}</span>
              <span className="text-[var(--muted)]">{r.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full bg-[var(--green)]" style={{ width: `${r.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function EstimateMockup() {
  const items = [
    { name: "철거 공사", amount: "1,200,000" },
    { name: "목공 자재", amount: "3,400,000" },
    { name: "타일 시공", amount: "2,100,000" },
    { name: "도장/필름", amount: "1,800,000" },
  ];
  return (
    <MockupFrame title="견적코치 AI / 신규 견적서">
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-xs">
            <span>{it.name}</span>
            <span className="font-mono text-[var(--muted)]">₩{it.amount}</span>
          </div>
        ))}
        <div className="flex items-center justify-between pt-3 text-sm font-semibold">
          <span>합계</span>
          <span className="text-[var(--green)]">₩8,500,000</span>
        </div>
      </div>
    </MockupFrame>
  );
}

function SettlementMockup() {
  return (
    <MockupFrame title="정산 리포트 / 잠실르엘">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-white/[0.03]">
          <p className="text-[10px] text-[var(--muted)]">계약 금액</p>
          <p className="text-sm font-bold mt-1">₩48,000,000</p>
        </div>
        <div className="p-3 rounded-xl bg-white/[0.03]">
          <p className="text-[10px] text-[var(--muted)]">현재 투입</p>
          <p className="text-sm font-bold mt-1">₩32,400,000</p>
        </div>
        <div className="p-3 rounded-xl bg-[var(--green)]/10 col-span-2">
          <p className="text-[10px] text-[var(--green)]">예상 수익률</p>
          <p className="text-base font-bold mt-1 text-[var(--green)]">+22.4%</p>
        </div>
      </div>
    </MockupFrame>
  );
}

function MaterialsMockup() {
  const rows = [
    { name: "강화 마루 (참나무)", unit: "㎡", price: "78,000" },
    { name: "석고보드 9.5T", unit: "장", price: "6,800" },
    { name: "페인트 (친환경 I등급)", unit: "통", price: "42,000" },
  ];
  return (
    <MockupFrame title="자재 DB / 868건">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <div>
              <p className="text-xs">{r.name}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">단위: {r.unit}</p>
            </div>
            <span className="text-xs font-mono text-[var(--green)]">₩{r.price}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

// ─── 신규 8 블록 ───

function PnLMockup() {
  const sites = [
    { name: "잠실르엘", profit: 22.4, tone: "green" as const },
    { name: "한남더힐", profit: 14.1, tone: "green" as const },
    { name: "성수빌라", profit: 3.2, tone: "orange" as const },
    { name: "압구정B동", profit: -4.8, tone: "red" as const },
  ];
  return (
    <MockupFrame title="현장 손익 / 이번달">
      <div className="space-y-2.5">
        {sites.map((s) => {
          const color =
            s.tone === "green" ? "var(--green)" : s.tone === "orange" ? "var(--orange)" : "var(--red)";
          return (
            <div key={s.name} className="flex items-center justify-between py-1.5">
              <span className="text-xs">{s.name}</span>
              <span className="text-xs font-mono font-bold" style={{ color }}>
                {s.profit > 0 ? "+" : ""}
                {s.profit}%
              </span>
            </div>
          );
        })}
        <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted)]">
          저마진 현장 2건 대시보드에 경고
        </div>
      </div>
    </MockupFrame>
  );
}

function InvoiceMockup() {
  const rows = [
    { site: "잠실르엘", amount: "48,000,000", due: "D-2", overdue: true },
    { site: "한남더힐", amount: "12,000,000", due: "D-5", overdue: false },
    { site: "성수빌라", amount: "6,500,000", due: "D-12", overdue: false },
  ];
  return (
    <MockupFrame title="세금계산서 / 발행 필요">
      <div className="space-y-2">
        <div className="px-3 py-2 rounded-lg bg-[var(--orange)]/10 text-xs text-[var(--orange)] font-medium">
          발행 필요 3건 · 오늘 안에 처리 권장
        </div>
        {rows.map((r) => (
          <div key={r.site} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <div>
              <p className="text-xs">{r.site}</p>
              <p className="text-[10px] font-mono text-[var(--muted)] mt-0.5">₩{r.amount}</p>
            </div>
            <span
              className="text-[10px] font-bold px-2 py-0.5 rounded"
              style={{
                background: r.overdue ? "rgba(255,107,107,0.15)" : "rgba(136,136,136,0.1)",
                color: r.overdue ? "var(--red)" : "var(--muted)",
              }}
            >
              {r.due}
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function DefectsMockup() {
  const cols = [
    { label: "접수", count: 3, color: "var(--red)" },
    { label: "진행중", count: 2, color: "var(--orange)" },
    { label: "해결됨", count: 5, color: "var(--blue)" },
    { label: "종료", count: 12, color: "var(--green)" },
  ];
  return (
    <MockupFrame title="하자관리 / 칸반">
      <div className="grid grid-cols-4 gap-1.5">
        {cols.map((c) => (
          <div key={c.label} className="p-2 rounded-lg bg-white/[0.03] text-center">
            <p className="text-[9px] text-[var(--muted)]">{c.label}</p>
            <p className="text-base font-bold mt-1" style={{ color: c.color }}>
              {c.count}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--red)]" />
          <span className="text-[10px] flex-1">타일 이격 · 잠실르엘 거실</span>
          <span className="text-[9px] text-[var(--muted)]">중대</span>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.03]">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--orange)]" />
          <span className="text-[10px] flex-1">도배 들뜸 · 한남더힐 침실</span>
          <span className="text-[9px] text-[var(--muted)]">경미</span>
        </div>
      </div>
    </MockupFrame>
  );
}

function DailyLogMockup() {
  return (
    <MockupFrame title="업무일지 / 2026-04-21">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium">잠실르엘 · 3주차</span>
          <span className="text-[var(--muted)]">☀️ 맑음</span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--muted)] w-12">공종</span>
            <span className="text-xs">전기 · 타일</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[var(--muted)] w-12">인원</span>
            <span className="text-xs">반장 2 · 기사 4</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] text-[var(--muted)] w-12 mt-0.5">작업</span>
            <span className="text-xs flex-1 leading-relaxed">
              거실·주방 바닥 타일 시공 80% 완료.
              <br />내일 도배 전 먼지 제거 필요.
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          <div className="w-12 h-12 rounded-lg bg-white/[0.05]" />
          <div className="w-12 h-12 rounded-lg bg-white/[0.05]" />
          <div className="w-12 h-12 rounded-lg bg-white/[0.05]" />
        </div>
      </div>
    </MockupFrame>
  );
}

function AttendanceMockup() {
  const workers = [
    { name: "김반장 (목공)", hours: 8, status: "퇴근" },
    { name: "박기사 (전기)", hours: 8, status: "퇴근" },
    { name: "이사수 (타일)", hours: 6, status: "근무중" },
    { name: "최기사 (도배)", hours: 0, status: "예정" },
  ];
  return (
    <MockupFrame title="근태 / 잠실르엘 · 오늘">
      <div className="space-y-2">
        {workers.map((w) => {
          const statusColor =
            w.status === "근무중"
              ? "var(--green)"
              : w.status === "퇴근"
                ? "var(--muted)"
                : "var(--orange)";
          return (
            <div key={w.name} className="flex items-center justify-between py-1.5">
              <span className="text-xs">{w.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-[var(--muted)]">{w.hours}h</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ color: statusColor, background: `color-mix(in srgb, ${statusColor} 12%, transparent)` }}>
                  {w.status}
                </span>
              </div>
            </div>
          );
        })}
        <div className="pt-2 border-t border-[var(--border)] text-[10px] text-[var(--muted)]">
          이번달 누계 → 급여 자동 생성
        </div>
      </div>
    </MockupFrame>
  );
}

function WorkersMockup() {
  const rows = [
    { name: "김반장", trade: "목공", rating: 4.9, reuse: 94 },
    { name: "박기사", trade: "전기", rating: 4.7, reuse: 88 },
    { name: "이사수", trade: "타일", rating: 4.5, reuse: 72 },
  ];
  return (
    <MockupFrame title="인력풀 / 추천 순">
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <div>
              <p className="text-xs font-medium">{r.name}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">{r.trade} · 재고용률 {r.reuse}%</p>
            </div>
            <span className="text-xs font-bold text-[var(--green)]">★ {r.rating}</span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function MonthlyMockup() {
  return (
    <MockupFrame title="월간 리포트 / 2026-04">
      <div className="space-y-3">
        <div>
          <p className="text-[10px] text-[var(--muted)]">이번달 순이익</p>
          <p className="text-2xl font-bold text-[var(--green)] mt-1">₩12,400,000</p>
          <p className="text-[10px] text-[var(--muted)] mt-0.5">전년 동월 대비 +18%</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2 rounded-lg bg-white/[0.03] text-center">
            <p className="text-[9px] text-[var(--muted)]">수금</p>
            <p className="text-xs font-bold mt-0.5">₩52M</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03] text-center">
            <p className="text-[9px] text-[var(--muted)]">지출</p>
            <p className="text-xs font-bold mt-0.5">₩40M</p>
          </div>
          <div className="p-2 rounded-lg bg-white/[0.03] text-center">
            <p className="text-[9px] text-[var(--muted)]">진행</p>
            <p className="text-xs font-bold mt-0.5">4현장</p>
          </div>
        </div>
      </div>
    </MockupFrame>
  );
}

function TemplatesMockup() {
  const items = [
    { name: "아파트 32평 올수리", phases: 11, system: true },
    { name: "상가 인테리어", phases: 8, system: true },
    { name: "주택 리모델링", phases: 14, system: true },
    { name: "내 템플릿 — 잠실르엘 스타일", phases: 13, system: false },
  ];
  return (
    <MockupFrame title="공사 유형 템플릿">
      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.name} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
            <div>
              <p className="text-xs">{it.name}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">공정 {it.phases}개</p>
            </div>
            <span
              className="text-[9px] px-1.5 py-0.5 rounded"
              style={{
                background: it.system ? "rgba(0,196,113,0.1)" : "rgba(255,159,67,0.1)",
                color: it.system ? "var(--green)" : "var(--orange)",
              }}
            >
              {it.system ? "시스템" : "내 것"}
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

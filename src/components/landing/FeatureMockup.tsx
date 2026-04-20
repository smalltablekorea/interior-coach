import MockupFrame from "./MockupFrame";

type MockupKind =
  | "schedule"
  | "chat"
  | "estimate"
  | "contract"
  | "settlement"
  | "materials";

export default function FeatureMockup({ kind }: { kind: MockupKind }) {
  switch (kind) {
    case "schedule":
      return <ScheduleMockup />;
    case "chat":
      return <ChatMockup />;
    case "estimate":
      return <EstimateMockup />;
    case "contract":
      return <ContractMockup />;
    case "settlement":
      return <SettlementMockup />;
    case "materials":
      return <MaterialsMockup />;
  }
}

function ScheduleMockup() {
  const rows = [
    { name: "철거", progress: 100, done: true },
    { name: "목공", progress: 80, done: false },
    { name: "전기", progress: 45, done: false },
    { name: "타일", progress: 10, done: false },
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
              <span className="text-[var(--foreground)]">{r.name}</span>
              <span className="text-[var(--muted)]">{r.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-[var(--green)]"
                style={{ width: `${r.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

function ChatMockup() {
  return (
    <MockupFrame title="현장 톡방 / 잠실르엘">
      <div className="space-y-3">
        <div className="flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full bg-[var(--green)]/30 flex items-center justify-center text-[10px] font-bold">
            김
          </div>
          <div className="bg-white/[0.04] rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]">
            오늘 전기 마감 완료했습니다. 사진 첨부드려요.
          </div>
        </div>
        <div className="flex gap-2 items-start justify-end">
          <div className="bg-[var(--green)]/20 rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[80%]">
            네, 확인했습니다. 내일 타일팀 예정대로 들어갑니다.
          </div>
          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-[10px] font-bold">
            나
          </div>
        </div>
        <div className="flex gap-2 items-start">
          <div className="w-7 h-7 rounded-full bg-blue-400/30 flex items-center justify-center text-[10px] font-bold">
            고
          </div>
          <div className="bg-white/[0.04] rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]">
            고객 포털에서 3주차 진행률 확인했습니다 👍
          </div>
        </div>
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
          <div
            key={it.name}
            className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0 text-xs"
          >
            <span className="text-[var(--foreground)]">{it.name}</span>
            <span className="font-mono text-[var(--muted)]">
              ₩{it.amount}
            </span>
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

function ContractMockup() {
  return (
    <MockupFrame title="계약서 / 모바일 서명">
      <div className="space-y-4">
        <div className="space-y-1.5">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
            계약 번호
          </p>
          <p className="text-xs font-mono">IC-2026-0417-001</p>
        </div>
        <div className="space-y-1.5">
          <p className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
            공사 금액
          </p>
          <p className="text-lg font-bold">₩48,000,000</p>
        </div>
        <div className="h-24 rounded-lg border border-dashed border-[var(--border)] flex items-center justify-center text-xs text-[var(--muted)]">
          여기에 서명해주세요
        </div>
        <button className="w-full py-2.5 rounded-lg bg-[var(--green)] text-black text-xs font-semibold">
          전자 서명 완료
        </button>
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
          <p className="text-base font-bold mt-1 text-[var(--green)]">
            +22.4%
          </p>
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
          <div
            key={r.name}
            className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0"
          >
            <div>
              <p className="text-xs">{r.name}</p>
              <p className="text-[10px] text-[var(--muted)] mt-0.5">
                단위: {r.unit}
              </p>
            </div>
            <span className="text-xs font-mono text-[var(--green)]">
              ₩{r.price}
            </span>
          </div>
        ))}
      </div>
    </MockupFrame>
  );
}

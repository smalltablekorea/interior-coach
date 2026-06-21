"use client";

import { useEffect, useMemo, useState, use } from "react";
import {
  ClipboardList, Check, ShoppingBag, X, ChevronDown,
  Image as ImageIcon, Loader2,
} from "lucide-react";

interface SpecOption {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  spec?: string;
  price?: number;
  memo?: string;
  imageUrl?: string;
  color?: string;
}
interface SpecCategory {
  id: string;
  name: string;
  icon?: string;
  options: SpecOption[];
}
interface CatalogResponse {
  site: { id: string; name: string; address?: string | null };
  catalog: { categories: SpecCategory[]; notes?: string };
}

function fmtKrw(n?: number) { return typeof n === "number" ? `₩${n.toLocaleString()}` : ""; }

export default function PublicSpecbookPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [data, setData] = useState<CatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 선택 상태: categoryId → optionId
  const [picks, setPicks] = useState<Record<string, string>>({});
  const [trayOpen, setTrayOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // form
  const [customerName, setCustomerName] = useState("");
  const [customerSite, setCustomerSite] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [memo, setMemo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/public/specbook/${token}`);
        const j = await res.json();
        if (!res.ok) { setError(j?.error || "유효하지 않은 링크입니다"); return; }
        setData(j?.data ?? j);
      } catch {
        setError("네트워크 오류");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const pickedItems = useMemo(() => {
    if (!data) return [] as { cat: SpecCategory; opt: SpecOption }[];
    return Object.entries(picks).flatMap(([catId, optId]) => {
      const cat = data.catalog.categories.find((c) => c.id === catId);
      if (!cat) return [];
      const opt = cat.options.find((o) => o.id === optId);
      if (!opt) return [];
      return [{ cat, opt }];
    });
  }, [picks, data]);

  const totalPrice = pickedItems.reduce((s, x) => s + (x.opt.price ?? 0), 0);

  function pick(catId: string, optId: string) {
    setPicks((p) => {
      // 같은 옵션을 다시 클릭하면 해제 (토글)
      if (p[catId] === optId) {
        const next = { ...p };
        delete next[catId];
        return next;
      }
      return { ...p, [catId]: optId };
    });
  }
  function unpick(catId: string) {
    setPicks((p) => {
      const next = { ...p };
      delete next[catId];
      return next;
    });
  }

  async function submit() {
    if (!customerName.trim()) { alert("성함을 입력해주세요"); return; }
    if (pickedItems.length === 0) { alert("선택한 자재가 없습니다"); return; }
    setSubmitting(true);
    try {
      const items = pickedItems.map(({ cat, opt }) => ({
        categoryId: cat.id,
        categoryName: cat.name,
        optionId: opt.id,
        optionName: opt.name,
        brand: opt.brand,
        model: opt.model,
        spec: opt.spec,
        price: opt.price,
        imageUrl: opt.imageUrl,
        color: opt.color,
      }));
      const res = await fetch(`/api/public/specbook/${token}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: customerName.trim(),
          customerSite: customerSite.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          items,
          memo: memo.trim() || undefined,
        }),
      });
      const j = await res.json();
      if (!res.ok) { alert(j?.error || "제출 실패"); return; }
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center text-[var(--muted)]">
        <Loader2 size={20} className="animate-spin mr-2" /> 불러오는 중...
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
          <X size={24} className="text-red-400" />
        </div>
        <h1 className="font-bold text-lg mb-1">접근할 수 없습니다</h1>
        <p className="text-sm text-[var(--muted)]">{error || "유효하지 않은 링크입니다"}</p>
      </div>
    );
  }
  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--green)]/10 flex items-center justify-center mb-4">
          <Check size={32} className="text-[var(--green)]" />
        </div>
        <h1 className="font-bold text-xl mb-1">제출되었습니다</h1>
        <p className="text-sm text-[var(--muted)]">담당자가 확인 후 연락드립니다. 감사합니다.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-32">
      {/* 헤더 */}
      <header className="sticky top-0 z-40 bg-[var(--background)]/95 backdrop-blur border-b border-[var(--border)]">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <ClipboardList size={20} className="text-[var(--green)]" />
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold truncate">{data.site.name}</h1>
            <p className="text-xs text-[var(--muted)]">자재를 선택해주세요</p>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {data.catalog.categories.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--muted)]">
            아직 등록된 자재가 없습니다.
          </p>
        ) : (
          <>
            {data.catalog.categories.map((cat) => (
              <CategorySection
                key={cat.id}
                cat={cat}
                pickedId={picks[cat.id] ?? null}
                onPick={(optId) => pick(cat.id, optId)}
                onUnpick={() => unpick(cat.id)}
              />
            ))}

            {/* 최하단 큰 확정 버튼 */}
            <div className="pt-6 pb-4">
              <div className="rounded-2xl border border-[var(--green)]/30 bg-[var(--green)]/5 p-5 text-center">
                <p className="text-sm text-[var(--muted)] mb-1">선택 완료 후 아래 버튼을 눌러주세요</p>
                <p className="text-lg font-semibold mb-4">
                  <span className="text-[var(--green)]">{pickedItems.length}개</span> 자재 선택됨
                  {totalPrice > 0 && (
                    <span className="text-sm text-[var(--muted)] font-normal ml-2">
                      (참고 합계 {fmtKrw(totalPrice)})
                    </span>
                  )}
                </p>
                <button
                  onClick={() => setSubmitOpen(true)}
                  disabled={pickedItems.length === 0}
                  className="w-full py-4 rounded-xl bg-[var(--green)] text-black font-bold text-base hover:bg-[var(--green-hover)] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check size={18} />
                  선택 확정하기
                </button>
                {pickedItems.length === 0 && (
                  <p className="text-xs text-[var(--muted)] mt-2">자재를 1개 이상 선택해주세요</p>
                )}
              </div>
            </div>
          </>
        )}
      </main>

      {/* 하단 트레이 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[var(--border)] bg-[var(--card)] safe-bottom">
        {trayOpen && (
          <div className="max-w-2xl mx-auto px-4 py-3 max-h-[40vh] overflow-y-auto border-b border-[var(--border)]">
            {pickedItems.length === 0 ? (
              <p className="text-sm text-[var(--muted)] py-2">아직 선택한 자재가 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {pickedItems.map(({ cat, opt }) => (
                  <div key={`${cat.id}_${opt.id}`} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.03]">
                    <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden bg-white/[0.04]"
                      style={opt.color && !opt.imageUrl ? { backgroundColor: opt.color } : undefined}>
                      {opt.imageUrl && <img src={opt.imageUrl} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[var(--muted)]">{cat.name}</div>
                      <div className="text-sm truncate">{opt.name}</div>
                    </div>
                    {typeof opt.price === "number" && (
                      <span className="text-xs text-[var(--green)] flex-shrink-0">{fmtKrw(opt.price)}</span>
                    )}
                    <button onClick={() => unpick(cat.id)} className="p-1 rounded hover:bg-white/[0.04]">
                      <X size={14} className="text-[var(--muted)]" />
                    </button>
                  </div>
                ))}
                {totalPrice > 0 && (
                  <div className="flex justify-between pt-2 border-t border-[var(--border)] text-sm">
                    <span className="text-[var(--muted)]">합계 (참고)</span>
                    <strong className="text-[var(--green)]">{fmtKrw(totalPrice)}</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => setTrayOpen((v) => !v)} className="flex items-center gap-2 text-sm">
            <ShoppingBag size={16} className="text-[var(--green)]" />
            <span><strong>{pickedItems.length}</strong>개 선택</span>
            <ChevronDown size={14} className={`transition-transform ${trayOpen ? "rotate-180" : ""}`} />
          </button>
          <button onClick={() => setSubmitOpen(true)} disabled={pickedItems.length === 0}
            className="ml-auto px-5 py-2.5 rounded-xl bg-[var(--green)] text-black font-semibold text-sm disabled:opacity-40">
            제출하기
          </button>
        </div>
      </div>

      {/* 제출 모달 */}
      {submitOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => !submitting && setSubmitOpen(false)}>
          <div className="bg-[var(--card)] border-t sm:border border-[var(--border)] rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold">선택 자재 제출</h2>
                <button onClick={() => !submitting && setSubmitOpen(false)} className="p-1 rounded hover:bg-white/[0.04]">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-3">
                <Field label="성함 *">
                  <input value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="홍길동"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-[var(--border)] text-sm focus:outline-none focus:border-[var(--green)]/60" />
                </Field>
                <Field label="현장/주소">
                  <input value={customerSite} onChange={(e) => setCustomerSite(e.target.value)}
                    placeholder="예: 잠실 르엘 149동"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
                </Field>
                <Field label="연락처">
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)}
                    type="tel" placeholder="010-1234-5678"
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
                </Field>
                <Field label="요청사항 (선택)">
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-lg bg-transparent border border-[var(--border)] text-sm" />
                </Field>
              </div>
              <button onClick={submit} disabled={submitting}
                className="mt-5 w-full py-3 rounded-xl bg-[var(--green)] text-black font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {submitting ? <><Loader2 size={16} className="animate-spin" /> 제출 중...</> : `${pickedItems.length}건 제출하기`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CategorySection({ cat, pickedId, onPick, onUnpick }: {
  cat: SpecCategory;
  pickedId: string | null;
  onPick: (optId: string) => void;
  onUnpick: () => void;
}) {
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold flex items-center gap-2">
          <span>{cat.icon ?? "•"}</span>
          {cat.name}
          {pickedId && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--green)]/10 text-[var(--green)]">
              선택됨
            </span>
          )}
        </h2>
        {pickedId && (
          <button onClick={onUnpick} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">
            선택 해제
          </button>
        )}
      </div>
      {cat.options.length === 0 ? (
        <p className="text-xs text-[var(--muted)] py-3">아직 옵션이 없습니다.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {cat.options.map((opt) => (
            <button
              key={opt.id}
              onClick={() => onPick(opt.id)}
              className={`text-left rounded-xl border p-2.5 transition-colors ${
                pickedId === opt.id
                  ? "border-[var(--green)] bg-[var(--green)]/5"
                  : "border-[var(--border)] bg-white/[0.02] hover:bg-white/[0.04]"
              }`}
            >
              <div className="aspect-square rounded-lg mb-2 overflow-hidden flex items-center justify-center"
                style={opt.color && !opt.imageUrl ? { backgroundColor: opt.color } : { backgroundColor: "rgba(255,255,255,0.04)" }}>
                {opt.imageUrl
                  ? <img src={opt.imageUrl} alt={opt.name} className="w-full h-full object-cover" />
                  : !opt.color && <ImageIcon size={20} className="text-[var(--muted)]" />}
                {pickedId === opt.id && (
                  <div className="absolute inset-0 bg-[var(--green)]/10 flex items-center justify-center">
                    <Check size={28} className="text-[var(--green)] drop-shadow" />
                  </div>
                )}
              </div>
              <div className="text-sm font-medium truncate">{opt.name}</div>
              {(opt.brand || opt.model) && (
                <div className="text-xs text-[var(--muted)] truncate">
                  {[opt.brand, opt.model].filter(Boolean).join(" · ")}
                </div>
              )}
              {typeof opt.price === "number" && (
                <div className="text-xs font-medium text-[var(--green)] mt-0.5">{fmtKrw(opt.price)}</div>
              )}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs text-[var(--muted)] mb-1">{label}</span>
      {children}
    </label>
  );
}

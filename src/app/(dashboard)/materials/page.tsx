"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { Plus, Package, Search, Pencil, Trash2, ChevronDown, ChevronRight, Filter, Camera, Upload, X, Check, Loader2, AlertCircle, CalendarDays, RotateCcw } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import FeatureGate from "@/components/subscription/FeatureGate";
import StatusBadge from "@/components/ui/StatusBadge";
import { fmt, fmtDate } from "@/lib/utils";
import { KoreanInput } from "@/components/ui/KoreanInput";

interface Material {
  id: string;
  name: string;
  category: string;
  brand: string;
  grade: string;
  unit: string;
  unitPrice: number;
}

interface MaterialOrder {
  id: string;
  materialName: string;
  quantity: number;
  unitPrice: number | null;
  totalAmount: number | null;
  orderedDate: string | null;
  deliveryDate: string | null;
  status: string;
  memo: string | null;
  siteId: string | null;
  siteName: string | null;
  category: string | null;
  userId: string | null;
  userName: string | null;
}

interface Site {
  id: string;
  name: string;
}

interface ParsedItem {
  name: string;
  category: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalAmount: number;
  selected: boolean;
}

interface AnalysisResult {
  storeName: string;
  purchaseDate: string;
  items: ParsedItem[];
  totalAmount: number;
}

const CATEGORY_ICONS: Record<string, string> = {
  "가구": "🪑", "기타": "📦", "도배": "🖼️", "도어": "🚪",
  "목공": "🪵", "목자재": "🪓", "바닥": "🏠", "보일러": "🔥",
  "샷시": "🪟", "설비": "🔧", "에어컨": "❄️", "욕실": "🚿",
  "일정관리": "📅", "전기": "💡", "주방": "🍳", "중문": "🚪", "타일": "🧱", "필름": "🎞️",
};

export default function MaterialsPage() {
  const [tab, setTab] = useState<"materials" | "orders">("materials");
  const [materials, setMaterials] = useState<Material[]>([]);
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Filter states
  const [grade, setGrade] = useState("전체");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());

  // Order filter states
  const [ordFilterSite, setOrdFilterSite] = useState("");
  const [ordFilterCategory, setOrdFilterCategory] = useState("");
  const [ordFilterDateFrom, setOrdFilterDateFrom] = useState("");
  const [ordFilterDateTo, setOrdFilterDateTo] = useState("");
  const [ordFilterUser, setOrdFilterUser] = useState("");
  const [ordGroupBy, setOrdGroupBy] = useState<"" | "site" | "category" | "user">("");

  // Order modals
  const [showOrdModal, setShowOrdModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [ordForm, setOrdForm] = useState({ siteId: "", materialName: "", quantity: "1", unitPrice: "", orderedDate: "", deliveryDate: "", memo: "" });

  // Order edit/delete
  const [editOrd, setEditOrd] = useState<MaterialOrder | null>(null);
  const [showEditOrdModal, setShowEditOrdModal] = useState(false);
  const [editOrdForm, setEditOrdForm] = useState({ materialName: "", quantity: "", unitPrice: "", orderedDate: "", deliveryDate: "", status: "" });
  const [deleteOrdId, setDeleteOrdId] = useState<string | null>(null);

  // Receipt analysis states
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptImages, setReceiptImages] = useState<{ base64: string; mimeType: string; name: string }[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeProgress, setAnalyzeProgress] = useState({ current: 0, total: 0 });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [savingReceipt, setSavingReceipt] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ordersAdded: number; materialsUpdated: number; materialsAdded: number; priceNotes: string[] } | null>(null);
  const [receiptSiteId, setReceiptSiteId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = () => {
    Promise.all([
      fetch("/api/materials").then((r) => r.json()),
      fetch("/api/materials?type=orders").then((r) => r.json()),
      fetch("/api/sites").then((r) => r.json()),
    ])
      .then(([matData, ordData, siteData]) => {
        setMaterials(Array.isArray(matData) ? matData : matData?.items ?? []);
        setOrders(Array.isArray(ordData) ? ordData : ordData?.items ?? []);
        setSites(Array.isArray(siteData) ? siteData : siteData?.items ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  // Filter materials
  const filtered = useMemo(() => {
    return materials.filter((m) => {
      if (grade !== "전체" && m.grade !== grade) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.brand.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [materials, grade, search]);

  // Group by main category -> sub-category
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, Material[]>>();
    filtered.forEach((m) => {
      const parts = m.category.split(" > ");
      const main = parts[0].trim();
      const sub = parts.length > 1 ? parts.slice(1).join(" > ").trim() : main;
      if (!map.has(main)) map.set(main, new Map());
      const subMap = map.get(main)!;
      if (!subMap.has(sub)) subMap.set(sub, []);
      subMap.get(sub)!.push(m);
    });
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filtered]);

  // Category counts from all materials
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    materials.forEach((m) => {
      const main = m.category.split(" > ")[0].trim();
      counts[main] = (counts[main] || 0) + 1;
    });
    return counts;
  }, [materials]);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat); else next.add(cat);
      return next;
    });
  };

  const expandAll = () => setExpandedCats(new Set(grouped.keys()));
  const collapseAll = () => setExpandedCats(new Set());

  // Order filter options (derived from data)
  const ordSiteOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.siteName) set.add(o.siteName); });
    return [...set].sort();
  }, [orders]);

  const ordCategoryOptions = useMemo(() => {
    const set = new Set<string>();
    orders.forEach((o) => { if (o.category) set.add(o.category.split(" > ")[0].trim()); });
    return [...set].sort();
  }, [orders]);

  const ordUserOptions = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach((o) => { if (o.userId) map.set(o.userId, o.userName || o.userId); });
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [orders]);

  const hasOrdFilters = ordFilterSite || ordFilterCategory || ordFilterDateFrom || ordFilterDateTo || ordFilterUser;

  const resetOrdFilters = () => {
    setOrdFilterSite(""); setOrdFilterCategory(""); setOrdFilterDateFrom(""); setOrdFilterDateTo(""); setOrdFilterUser(""); setOrdGroupBy("");
  };

  // Filtered & grouped orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (search && !o.materialName.includes(search) && !o.siteName?.includes(search)) return false;
      if (ordFilterSite && o.siteName !== ordFilterSite) return false;
      if (ordFilterCategory) {
        const mainCat = o.category?.split(" > ")[0].trim();
        if (mainCat !== ordFilterCategory) return false;
      }
      if (ordFilterDateFrom && (!o.orderedDate || o.orderedDate < ordFilterDateFrom)) return false;
      if (ordFilterDateTo && (!o.orderedDate || o.orderedDate > ordFilterDateTo)) return false;
      if (ordFilterUser && o.userId !== ordFilterUser) return false;
      return true;
    });
  }, [orders, search, ordFilterSite, ordFilterCategory, ordFilterDateFrom, ordFilterDateTo, ordFilterUser]);

  const groupedOrders = useMemo(() => {
    if (!ordGroupBy) return null;
    const map = new Map<string, MaterialOrder[]>();
    filteredOrders.forEach((o) => {
      let key = "미분류";
      if (ordGroupBy === "site") key = o.siteName || "현장 미지정";
      else if (ordGroupBy === "category") key = o.category?.split(" > ")[0].trim() || "미분류";
      else if (ordGroupBy === "user") key = o.userName || (o.userId === "system" ? "시스템" : "미분류");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    });
    return new Map([...map.entries()].sort((a, b) => a[0].localeCompare(b[0])));
  }, [filteredOrders, ordGroupBy]);

  const ordTotalAmount = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [filteredOrders]);

  // Receipt image handling
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setAnalysisResult(null);
    setAnalyzeError(null);
    setSaveResult(null);

    const fileArray = Array.from(files);
    // input value를 먼저 리셋하면 일부 브라우저에서 File 객체가 무효화될 수 있으므로
    // 파일 배열을 먼저 복사한 뒤 리셋
    const inputEl = e.target;

    const promises = fileArray.map(
      (file) =>
        new Promise<{ base64: string; mimeType: string; name: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            resolve({ base64: result.split(",")[1], mimeType: file.type, name: file.name });
          };
          reader.onerror = () => reject(new Error(`파일 읽기 실패: ${file.name}`));
          reader.readAsDataURL(file);
        })
    );

    Promise.all(promises).then((newImages) => {
      setReceiptImages((prev) => [...prev, ...newImages]);
      // Promise 완료 후 input 리셋 — 같은 파일 재선택 시 onChange가 다시 발생하도록
      inputEl.value = "";
    });
  };

  const removeReceiptImage = (idx: number) => {
    setReceiptImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const analyzeReceipt = async () => {
    if (receiptImages.length === 0) return;
    setAnalyzing(true);
    setAnalyzeError(null);
    setAnalyzeProgress({ current: 0, total: receiptImages.length });

    const allItems: ParsedItem[] = [];
    let lastStoreName = "";
    let lastPurchaseDate = "";
    let totalAmount = 0;

    try {
      for (let i = 0; i < receiptImages.length; i++) {
        setAnalyzeProgress({ current: i + 1, total: receiptImages.length });
        const img = receiptImages[i];
        const res = await fetch("/api/analyze-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: img.base64, mimeType: img.mimeType }),
        });
        const data = await res.json();
        if (!res.ok) {
          setAnalyzeError(`${img.name}: ${data.error || "분석 실패"}`);
          setAnalyzing(false);
          return;
        }
        allItems.push(...data.items);
        lastStoreName = data.storeName || lastStoreName;
        lastPurchaseDate = data.purchaseDate || lastPurchaseDate;
        totalAmount += data.totalAmount || 0;
      }

      setAnalysisResult({
        storeName: lastStoreName,
        purchaseDate: lastPurchaseDate,
        items: allItems.map((item: ParsedItem) => ({ ...item, selected: true })),
        totalAmount,
      });
    } catch {
      setAnalyzeError("서버 연결에 실패했습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleItemSelection = (idx: number) => {
    if (!analysisResult) return;
    setAnalysisResult({
      ...analysisResult,
      items: analysisResult.items.map((item, i) =>
        i === idx ? { ...item, selected: !item.selected } : item
      ),
    });
  };

  const saveReceiptItems = async () => {
    if (!analysisResult) return;
    const selectedItems = analysisResult.items.filter((item) => item.selected);
    if (selectedItems.length === 0) return;

    setSavingReceipt(true);
    try {
      const res = await fetch("/api/analyze-receipt", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: selectedItems,
          purchaseDate: analysisResult.purchaseDate,
          siteId: receiptSiteId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSaveResult(data);
        fetchData(); // Refresh data
      }
    } catch {
      setAnalyzeError("저장에 실패했습니다.");
    } finally {
      setSavingReceipt(false);
    }
  };

  const resetReceipt = () => {
    setReceiptImages([]);
    setAnalysisResult(null);
    setAnalyzeError(null);
    setSaveResult(null);
    setReceiptSiteId("");
    setAnalyzeProgress({ current: 0, total: 0 });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Order handlers
  const handleOrdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const qty = parseFloat(ordForm.quantity) || 1;
    const price = parseInt(ordForm.unitPrice) || 0;
    const res = await fetch("/api/materials?type=orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...ordForm, siteId: ordForm.siteId || null, quantity: qty, unitPrice: price, totalAmount: qty * price }),
    });
    if (res.ok) {
      setShowOrdModal(false);
      setOrdForm({ siteId: "", materialName: "", quantity: "1", unitPrice: "", orderedDate: "", deliveryDate: "", memo: "" });
      fetchData();
    }
    setSaving(false);
  };

  const openEditOrd = (ord: MaterialOrder) => {
    setEditOrd(ord);
    setEditOrdForm({ materialName: ord.materialName, quantity: String(ord.quantity), unitPrice: ord.unitPrice?.toString() || "", orderedDate: ord.orderedDate || "", deliveryDate: ord.deliveryDate || "", status: ord.status });
    setShowEditOrdModal(true);
  };

  const handleEditOrdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrd) return;
    setSaving(true);
    const qty = parseFloat(editOrdForm.quantity) || 1;
    const price = parseInt(editOrdForm.unitPrice) || 0;
    const res = await fetch("/api/materials?type=orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editOrd.id,
        materialName: editOrdForm.materialName,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        orderedDate: editOrdForm.orderedDate || null,
        deliveryDate: editOrdForm.deliveryDate || null,
        status: editOrdForm.status,
      }),
    });
    if (res.ok) {
      setShowEditOrdModal(false);
      setEditOrd(null);
      fetchData();
    }
    setSaving(false);
  };

  const handleDeleteOrd = async (ordId: string) => {
    const res = await fetch(`/api/materials?type=orders&id=${ordId}`, { method: "DELETE" });
    if (res.ok) {
      fetchData();
    }
    setDeleteOrdId(null);
  };

  return (
    <FeatureGate feature="materialsManagement" label="자재 관리">
    <div className="space-y-5 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">자재 관리</h1>
          {tab === "materials" && !loading && (
            <span className="px-2.5 py-1 rounded-lg bg-[var(--green)]/10 text-[var(--green)] text-xs font-medium">
              {filtered.length.toLocaleString()}개
            </span>
          )}
        </div>
        {tab === "orders" && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowReceiptModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
            >
              <Camera size={18} />
              영수증 분석
            </button>
            <button
              onClick={() => setShowOrdModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
            >
              <Plus size={18} />
              발주 등록
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] w-fit">
        {(["materials", "orders"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? "bg-[var(--card)] text-[var(--foreground)]" : "text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            {t === "materials" ? "자재 카탈로그" : "발주 내역"}
          </button>
        ))}
      </div>

      {tab === "materials" ? (
        <>
          {/* Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
              <Search size={18} className="text-[var(--muted)]" />
              <input
                type="text"
                placeholder="자재명, 브랜드, 카테고리 검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-xs text-[var(--muted)] hover:text-[var(--foreground)]">초기화</button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <Filter size={14} className="text-[var(--muted)] mr-1" />
                {["전체", "일반", "중급", "고급"].map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrade(g)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      grade === g
                        ? g === "전체" ? "bg-[var(--border)] text-white" : g === "일반" ? "bg-[var(--border)] text-[var(--muted)]" : g === "중급" ? "bg-[var(--blue)]/10 text-[var(--blue)]" : "bg-[var(--orange)]/10 text-[var(--orange)]"
                        : "text-[var(--muted)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              <div className="h-4 w-px bg-[var(--border)] mx-1" />
              <button onClick={expandAll} className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
                모두 펼치기
              </button>
              <button onClick={collapseAll} className="px-3 py-1.5 rounded-lg text-xs text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--border)] hover:border-[var(--border-hover)] transition-colors">
                모두 접기
              </button>
              {(grade !== "전체" || search) && (
                <button onClick={() => { setGrade("전체"); setSearch(""); }} className="px-3 py-1.5 rounded-lg text-xs text-[var(--red)] hover:text-[var(--foreground)] border border-[var(--red)]/30 hover:border-[var(--red)] transition-colors">
                  필터 초기화
                </button>
              )}
            </div>
          </div>

          {/* Grouped Categories */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Package} title="검색 결과가 없습니다" description="다른 검색어나 필터를 시도해보세요." />
          ) : (
            <div className="space-y-3">
              {[...grouped.entries()].map(([mainCat, subMap]) => {
                const isExpanded = expandedCats.has(mainCat);
                const totalInCat = [...subMap.values()].reduce((sum, arr) => sum + arr.length, 0);
                const icon = CATEGORY_ICONS[mainCat] || "📁";

                return (
                  <div key={mainCat} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <button onClick={() => toggleCat(mainCat)} className="w-full flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors">
                      <span className="text-lg">{icon}</span>
                      <span className="font-semibold text-base">{mainCat}</span>
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--muted)] font-medium">{totalInCat}개</span>
                      {categoryCounts[mainCat] && totalInCat < categoryCounts[mainCat] && (
                        <span className="text-xs text-[var(--muted)]">/ 전체 {categoryCounts[mainCat]}개</span>
                      )}
                      <span className="ml-auto text-[var(--muted)]">
                        {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="border-t border-[var(--border)]">
                        {[...subMap.entries()].map(([subCat, items], subIdx) => (
                          <div key={subCat}>
                            {subCat !== mainCat && (
                              <div className={`px-5 py-2.5 bg-white/[0.02] ${subIdx > 0 ? "border-t border-[var(--border)]" : ""}`}>
                                <span className="text-xs font-medium text-[var(--muted)]">{subCat}</span>
                                <span className="ml-2 text-xs text-[var(--muted)] opacity-60">({items.length})</span>
                              </div>
                            )}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-[var(--border)] bg-white/[0.01]">
                                    <th className="text-left px-5 py-2 text-xs font-medium text-[var(--muted)]">항목명</th>
                                    <th className="text-left px-4 py-2 text-xs font-medium text-[var(--muted)] whitespace-nowrap">브랜드</th>
                                    <th className="text-center px-4 py-2 text-xs font-medium text-[var(--muted)] whitespace-nowrap">등급</th>
                                    <th className="text-center px-4 py-2 text-xs font-medium text-[var(--muted)] whitespace-nowrap">단위</th>
                                    <th className="text-right px-5 py-2 text-xs font-medium text-[var(--muted)] whitespace-nowrap">단가</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((m, idx) => (
                                    <tr key={m.id} className={`border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02] transition-colors ${idx % 2 === 0 ? "" : "bg-white/[0.01]"}`}>
                                      <td className="px-5 py-2.5 font-medium">{m.name}</td>
                                      <td className="px-4 py-2.5 text-[var(--muted)] whitespace-nowrap">{m.brand !== "-" ? m.brand : ""}</td>
                                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                                        <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${m.grade === "고급" ? "bg-[var(--orange)]/10 text-[var(--orange)]" : m.grade === "중급" ? "bg-[var(--blue)]/10 text-[var(--blue)]" : "bg-[var(--card)] text-[var(--muted)]"}`}>
                                          {m.grade}
                                        </span>
                                      </td>
                                      <td className="px-4 py-2.5 text-center text-[var(--muted)] whitespace-nowrap">{m.unit}</td>
                                      <td className="px-5 py-2.5 text-right font-medium tabular-nums whitespace-nowrap">{fmt(m.unitPrice)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Orders Tab */
        <>
          {/* Search */}
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
            <Search size={18} className="text-[var(--muted)]" />
            <input
              type="text"
              placeholder="자재명, 현장명 검색..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3 p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[var(--muted)]" />
                <span className="text-sm font-medium">필터</span>
              </div>
              {hasOrdFilters && (
                <button
                  onClick={resetOrdFilters}
                  className="flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                >
                  <RotateCcw size={12} />
                  초기화
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={ordFilterSite}
                onChange={(e) => setOrdFilterSite(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
              >
                <option value="">현장 전체</option>
                {ordSiteOptions.map((s) => (<option key={s} value={s}>{s}</option>))}
              </select>

              <select
                value={ordFilterCategory}
                onChange={(e) => setOrdFilterCategory(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
              >
                <option value="">공종 전체</option>
                {ordCategoryOptions.map((c) => (<option key={c} value={c}>{CATEGORY_ICONS[c] || "📁"} {c}</option>))}
              </select>

              <select
                value={ordFilterUser}
                onChange={(e) => setOrdFilterUser(e.target.value)}
                className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
              >
                <option value="">발주자 전체</option>
                {ordUserOptions.map(([id, name]) => (<option key={id} value={id}>{id === "system" ? "시스템" : name}</option>))}
              </select>

              <select
                value={ordGroupBy}
                onChange={(e) => setOrdGroupBy(e.target.value as "" | "site" | "category" | "user")}
                className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
              >
                <option value="">그룹 없음</option>
                <option value="site">현장별 그룹</option>
                <option value="category">공종별 그룹</option>
                <option value="user">발주자별 그룹</option>
              </select>
            </div>

            {/* 기간 필터 */}
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-[var(--muted)] shrink-0" />
              <input
                type="date"
                value={ordFilterDateFrom}
                onChange={(e) => setOrdFilterDateFrom(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
              />
              <span className="text-xs text-[var(--muted)]">~</span>
              <input
                type="date"
                value={ordFilterDateTo}
                onChange={(e) => setOrdFilterDateTo(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-sm focus:border-[var(--green)] focus:outline-none"
              />
            </div>
          </div>

          {/* Summary */}
          {!loading && filteredOrders.length > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white/[0.03] border border-[var(--border)]">
              <span className="text-sm text-[var(--muted)]">
                {hasOrdFilters ? `${filteredOrders.length}건 (전체 ${orders.length}건)` : `${orders.length}건`}
              </span>
              <span className="text-sm font-medium">합계 {fmt(ordTotalAmount)}</span>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 rounded-2xl animate-shimmer" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <EmptyState
              icon={Package}
              title="발주 내역이 없습니다"
              action={
                <div className="flex items-center gap-2">
                  <button onClick={() => setShowReceiptModal(true)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)]">
                    영수증 분석
                  </button>
                  <button onClick={() => setShowOrdModal(true)} className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium">
                    첫 발주 등록하기
                  </button>
                </div>
              }
            />
          ) : filteredOrders.length === 0 ? (
            <EmptyState icon={Filter} title="필터 조건에 맞는 발주가 없습니다" description="다른 필터를 시도해보세요." />
          ) : groupedOrders ? (
            /* Grouped view */
            <div className="space-y-4">
              {[...groupedOrders.entries()].map(([groupName, groupItems]) => {
                const groupTotal = groupItems.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
                return (
                  <div key={groupName} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        {ordGroupBy === "category" && <span>{CATEGORY_ICONS[groupName] || "📁"}</span>}
                        <span className="font-semibold text-sm">{groupName}</span>
                        <span className="px-2 py-0.5 rounded-md bg-white/[0.06] text-xs text-[var(--muted)]">{groupItems.length}건</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{fmt(groupTotal)}</span>
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {groupItems.map((o) => (
                        <div key={o.id} className="flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                          <div>
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-sm font-medium">{o.materialName}</p>
                              <StatusBadge status={o.status} />
                              {o.category && ordGroupBy !== "category" && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">
                                  {o.category.split(" > ")[0].trim()}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--muted)]">
                              {ordGroupBy !== "site" && (o.siteName || "현장 미지정")}
                              {ordGroupBy !== "site" && " · "}{o.quantity}개
                              {o.orderedDate && ` · ${fmtDate(o.orderedDate)}`}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-medium tabular-nums">{fmt(o.totalAmount)}</p>
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditOrd(o)} className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors" title="편집">
                                <Pencil size={14} />
                              </button>
                              <button onClick={() => setDeleteOrdId(o.id)} className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--red)] transition-colors" title="삭제">
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Flat list */
            <div className="space-y-2">
              {filteredOrders.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium">{o.materialName}</p>
                      <StatusBadge status={o.status} />
                      {o.category && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">
                          {o.category.split(" > ")[0].trim()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[var(--muted)]">
                      {o.siteName || "현장 미지정"} · {o.quantity}개
                      {o.orderedDate && ` · 발주 ${fmtDate(o.orderedDate)}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{fmt(o.totalAmount)}</p>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditOrd(o)} className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--foreground)] transition-colors" title="편집">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => setDeleteOrdId(o.id)} className="p-1.5 rounded-lg hover:bg-[var(--border)] text-[var(--muted)] hover:text-[var(--red)] transition-colors" title="삭제">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Receipt Analysis Modal */}
      <Modal open={showReceiptModal} onClose={() => { setShowReceiptModal(false); resetReceipt(); }} title="영수증 분석">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Upload area */}
          <label className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--green)] cursor-pointer transition-colors">
            <Upload size={28} className="text-[var(--muted)]" />
            <div className="text-center">
              <p className="text-sm font-medium">{receiptImages.length === 0 ? "영수증 이미지를 업로드하세요" : "이미지 추가하기"}</p>
              <p className="text-xs text-[var(--muted)] mt-1">JPG, PNG, WEBP 지원 · 여러 장 선택 가능</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>

          {/* Image previews */}
          {receiptImages.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-2">
                {receiptImages.map((img, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
                    <img
                      src={`data:${img.mimeType};base64,${img.base64}`}
                      alt={img.name}
                      className="w-full h-24 object-cover"
                    />
                    <button
                      onClick={() => removeReceiptImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-md bg-black/60 hover:bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                    <p className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 bg-black/60 text-[10px] text-white truncate">{img.name}</p>
                  </div>
                ))}
              </div>

              {/* Site selection */}
              <div>
                <label className="block text-sm text-[var(--muted)] mb-1">현장 (선택)</label>
                <select
                  value={receiptSiteId}
                  onChange={(e) => setReceiptSiteId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none"
                >
                  <option value="">현장 미지정</option>
                  {sites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                </select>
              </div>

              {/* Analyze button */}
              {!analysisResult && !saveResult && (
                <button
                  onClick={analyzeReceipt}
                  disabled={analyzing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--green)] text-black font-medium text-sm disabled:opacity-50 transition-colors"
                >
                  {analyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      AI가 영수증을 분석 중... ({analyzeProgress.current}/{analyzeProgress.total})
                    </>
                  ) : (
                    <>
                      <Camera size={18} />
                      {receiptImages.length}장 영수증 분석하기
                    </>
                  )}
                </button>
              )}

              {/* Error */}
              {analyzeError && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--red)]/10 border border-[var(--red)]/20">
                  <AlertCircle size={16} className="text-[var(--red)] mt-0.5 shrink-0" />
                  <p className="text-sm text-[var(--red)]">{analyzeError}</p>
                </div>
              )}

              {/* Analysis result */}
              {analysisResult && !saveResult && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{analysisResult.storeName}</p>
                      <p className="text-xs text-[var(--muted)]">{analysisResult.purchaseDate}</p>
                    </div>
                    <p className="text-sm font-medium">{fmt(analysisResult.totalAmount)}</p>
                  </div>

                  <div className="space-y-1">
                    {analysisResult.items.map((item, idx) => (
                      <div
                        key={idx}
                        onClick={() => toggleItemSelection(idx)}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                          item.selected
                            ? "border-[var(--green)]/30 bg-[var(--green)]/5"
                            : "border-[var(--border)] bg-white/[0.02] opacity-50"
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          item.selected ? "border-[var(--green)] bg-[var(--green)]" : "border-[var(--border)]"
                        }`}>
                          {item.selected && <Check size={12} className="text-black" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{item.name}</p>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-white/[0.06] text-[var(--muted)]">{item.category}</span>
                          </div>
                          <p className="text-xs text-[var(--muted)]">
                            {item.quantity}{item.unit} x {item.unitPrice.toLocaleString()}원
                          </p>
                        </div>
                        <p className="text-sm font-medium tabular-nums whitespace-nowrap">
                          {fmt(item.totalAmount)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={saveReceiptItems}
                    disabled={savingReceipt || analysisResult.items.filter((i) => i.selected).length === 0}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--green)] text-black font-medium text-sm disabled:opacity-50 transition-colors"
                  >
                    {savingReceipt ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      <>
                        <Check size={18} />
                        {analysisResult.items.filter((i) => i.selected).length}개 항목 발주 내역에 추가
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Save result */}
              {saveResult && (
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-[var(--green)]/10 border border-[var(--green)]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Check size={18} className="text-[var(--green)]" />
                      <p className="font-medium text-[var(--green)]">저장 완료</p>
                    </div>
                    <div className="space-y-1 text-sm text-[var(--muted)]">
                      <p>발주 내역 추가: {saveResult.ordersAdded}건</p>
                      {saveResult.materialsAdded > 0 && (
                        <p>신규 자재 등록: {saveResult.materialsAdded}건</p>
                      )}
                      {saveResult.materialsUpdated > 0 && (
                        <p>기존 자재 가격 참고사항 업데이트: {saveResult.materialsUpdated}건</p>
                      )}
                    </div>
                  </div>

                  {saveResult.priceNotes.length > 0 && (
                    <div className="p-4 rounded-xl bg-[var(--orange)]/10 border border-[var(--orange)]/20">
                      <p className="text-sm font-medium text-[var(--orange)] mb-2">가격 변동 감지</p>
                      <div className="space-y-1">
                        {saveResult.priceNotes.map((note, idx) => (
                          <p key={idx} className="text-xs text-[var(--muted)]">{note}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setShowReceiptModal(false); resetReceipt(); }}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
                  >
                    닫기
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Order Modal */}
      <Modal open={showOrdModal} onClose={() => setShowOrdModal(false)} title="발주 등록">
        <form onSubmit={handleOrdSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">자재명 *</label>
              <KoreanInput type="text" required value={ordForm.materialName} onChange={(v) => setOrdForm({ ...ordForm, materialName: v })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="자재명" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">현장</label>
              <select value={ordForm.siteId} onChange={(e) => setOrdForm({ ...ordForm, siteId: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none">
                <option value="">선택</option>
                {sites.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">수량 *</label>
              <input type="number" required value={ordForm.quantity} onChange={(e) => setOrdForm({ ...ordForm, quantity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">단가</label>
              <input type="number" value={ordForm.unitPrice} onChange={(e) => setOrdForm({ ...ordForm, unitPrice: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" placeholder="원" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">발주일</label>
              <input type="date" value={ordForm.orderedDate} onChange={(e) => setOrdForm({ ...ordForm, orderedDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">입고 예정일</label>
              <input type="date" value={ordForm.deliveryDate} onChange={(e) => setOrdForm({ ...ordForm, deliveryDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowOrdModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Order Modal */}
      <Modal open={showEditOrdModal} onClose={() => setShowEditOrdModal(false)} title="발주 수정">
        <form onSubmit={handleEditOrdSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">자재명 *</label>
            <KoreanInput type="text" required value={editOrdForm.materialName} onChange={(v) => setEditOrdForm({ ...editOrdForm, materialName: v })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">수량</label>
              <input type="number" value={editOrdForm.quantity} onChange={(e) => setEditOrdForm({ ...editOrdForm, quantity: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">단가</label>
              <input type="number" value={editOrdForm.unitPrice} onChange={(e) => setEditOrdForm({ ...editOrdForm, unitPrice: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">발주일</label>
              <input type="date" value={editOrdForm.orderedDate} onChange={(e) => setEditOrdForm({ ...editOrdForm, orderedDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">입고 예정일</label>
              <input type="date" value={editOrdForm.deliveryDate} onChange={(e) => setEditOrdForm({ ...editOrdForm, deliveryDate: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
            <select value={editOrdForm.status} onChange={(e) => setEditOrdForm({ ...editOrdForm, status: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] text-sm focus:border-[var(--green)] focus:outline-none">
              {["발주", "배송중", "입고", "취소"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowEditOrdModal(false)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
          </div>
        </form>
      </Modal>

      {/* Delete Order Confirmation */}
      <Modal open={!!deleteOrdId} onClose={() => setDeleteOrdId(null)} title="발주 삭제">
        <div className="space-y-4">
          <p className="text-sm text-[var(--muted)]">이 발주를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setDeleteOrdId(null)} className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">취소</button>
            <button onClick={() => deleteOrdId && handleDeleteOrd(deleteOrdId)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--red)] text-white font-medium text-sm">
              <Trash2 size={16} />
              삭제
            </button>
          </div>
        </div>
      </Modal>
    </div>
    </FeatureGate>
  );
}

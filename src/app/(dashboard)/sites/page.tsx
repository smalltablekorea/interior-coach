"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Building2 } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { apiFetch } from "@/lib/api-client";
import { KoreanInput, KoreanTextarea } from "@/components/ui/KoreanInput";
import { fmtDate } from "@/lib/utils";
import { SITE_STATUSES, BUILDING_TYPES } from "@/lib/constants";
import Link from "next/link";

interface Site {
  id: string;
  name: string;
  address: string | null;
  buildingType: string | null;
  areaPyeong: number | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
  customerName: string | null;
  customerId: string | null;
  createdAt: string;
}

interface Customer {
  id: string;
  name: string;
}

export default function SitesPage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { checkFeature } = useSubscription();
  const [form, setForm] = useState({
    name: "",
    customerId: "",
    address: "",
    buildingType: "",
    areaPyeong: "",
    status: "상담중",
    startDate: "",
    endDate: "",
    memo: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [sitesRes, customersRes] = await Promise.all([
        apiFetch("/api/sites").then((r) => (r.ok ? r.json() : [])).catch(() => []),
        apiFetch("/api/customers").then((r) => (r.ok ? r.json() : [])).catch(() => []),
      ]);
      setSites(Array.isArray(sitesRes) ? sitesRes : sitesRes?.items ?? []);
      setCustomers(Array.isArray(customersRes) ? customersRes : customersRes?.items ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await apiFetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        areaPyeong: form.areaPyeong ? parseFloat(form.areaPyeong) : null,
        customerId: form.customerId || null,
      }),
    });
    if (res.ok) {
      // Check if this was the first real site — trigger congratulations
      const result = await res.json().catch(() => null);
      if (sites.length === 0) {
        localStorage.setItem("first-site-created", JSON.stringify({
          name: form.name,
          id: result?.id || "",
          timestamp: Date.now(),
        }));
      }
      setShowModal(false);
      setForm({
        name: "",
        customerId: "",
        address: "",
        buildingType: "",
        areaPyeong: "",
        status: "상담중",
        startDate: "",
        endDate: "",
        memo: "",
      });
      fetchData();
    }
    setSaving(false);
  };

  const filtered = sites.filter((s) => {
    const matchSearch =
      !search ||
      s.name.includes(search) ||
      s.address?.includes(search) ||
      s.customerName?.includes(search);
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">현장 관리</h1>
        <button
          onClick={() => {
            const check = checkFeature("sites");
            if (!check.allowed) { setShowUpgrade(true); return; }
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
        >
          <Plus size={18} />
          현장 등록
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex-1">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="현장명, 주소, 고객명으로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilterStatus("")}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              !filterStatus
                ? "bg-[var(--green)]/10 text-[var(--green)]"
                : "bg-white/[0.04] text-[var(--muted)] hover:text-[var(--foreground)]"
            }`}
          >
            전체
          </button>
          {SITE_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === s
                  ? "bg-[var(--green)]/10 text-[var(--green)]"
                  : "bg-white/[0.04] text-[var(--muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={search || filterStatus ? "조건에 맞는 현장이 없습니다" : "등록된 현장이 없습니다"}
          description={
            !search && !filterStatus
              ? "현장을 등록하고 프로젝트를 관리해보세요."
              : undefined
          }
          action={
            !search &&
            !filterStatus && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                첫 현장 등록하기
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <Link
              key={s.id}
              href={`/sites/${s.id}`}
              className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium">{s.name}</p>
                  <StatusBadge status={s.status} />
                </div>
                <p className="text-sm text-[var(--muted)]">
                  {s.customerName || "고객 미지정"}
                  {s.address && ` · ${s.address}`}
                  {s.buildingType && ` · ${s.buildingType}`}
                  {s.areaPyeong && ` · ${s.areaPyeong}평`}
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                {s.startDate && <p>시작 {fmtDate(s.startDate)}</p>}
                {s.endDate && <p>종료 {fmtDate(s.endDate)}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="현장 등록"
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">현장명 *</label>
            <KoreanInput
              type="text"
              required
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="예: 강남 래미안 32평 리모델링"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">고객</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              >
                <option value="">선택 안함</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">건물유형</label>
              <select
                value={form.buildingType}
                onChange={(e) => setForm({ ...form, buildingType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              >
                <option value="">선택</option>
                {BUILDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">주소</label>
            <KoreanInput
              type="text"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="현장 주소"
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">평수</label>
              <input
                type="number"
                value={form.areaPyeong}
                onChange={(e) => setForm({ ...form, areaPyeong: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder="평"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">시작일</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">종료일</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <KoreanTextarea
              value={form.memo}
              onChange={(v) => setForm({ ...form, memo: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors resize-none h-20"
              placeholder="참고사항"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </Modal>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan={checkFeature("sites").requiredPlan || "starter"}
        featureLabel="현장"
        currentUsage={checkFeature("sites").current}
        limit={checkFeature("sites").limit}
      />
    </div>
  );
}

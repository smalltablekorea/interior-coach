"use client";

import { useEffect, useState } from "react";
import { Plus, Search, Users, Phone, Mail } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/ui/StatusBadge";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";
import { CUSTOMER_STATUSES } from "@/lib/constants";
import { fmtDate } from "@/lib/utils";
import Link from "next/link";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  memo: string | null;
  status: string | null;
  referredBy: string | null;
  createdAt: string;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [showModal, setShowModal] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { checkFeature } = useSubscription();
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "", memo: "", status: "상담중" });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = (status?: string) => {
    const url = status ? `/api/customers?status=${status}` : "/api/customers";
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchCustomers(statusFilter || undefined);
  }, [statusFilter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setShowModal(false);
      setForm({ name: "", phone: "", email: "", address: "", memo: "", status: "상담중" });
      fetchCustomers(statusFilter || undefined);
    }
    setSaving(false);
  };

  const filtered = customers.filter(
    (c) =>
      c.name.includes(search) ||
      c.phone?.includes(search) ||
      c.email?.includes(search) ||
      c.address?.includes(search)
  );

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">고객 관리</h1>
        <button
          onClick={() => {
            const check = checkFeature("customers");
            if (!check.allowed) { setShowUpgrade(true); return; }
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
        >
          <Plus size={18} />
          고객 등록
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setStatusFilter("")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
            statusFilter === "" ? "bg-white/10 text-white" : "text-[var(--muted)] hover:text-white hover:bg-white/[0.04]"
          }`}
        >
          전체
        </button>
        {CUSTOMER_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              statusFilter === s ? "bg-white/10 text-white" : "text-[var(--muted)] hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)]">
        <Search size={18} className="text-[var(--muted)]" />
        <input
          type="text"
          placeholder="이름, 전화번호, 이메일로 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "검색 결과가 없습니다" : "등록된 고객이 없습니다"}
          description={search ? undefined : "고객을 등록하고 현장을 연결해보세요."}
          action={
            !search && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                첫 고객 등록하기
              </button>
            )
          }
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/customers/${c.id}`}
              className="flex items-center justify-between p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] hover:border-[var(--border-hover)] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[var(--green)]/10 flex items-center justify-center text-[var(--green)] font-medium">
                  {c.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{c.name}</p>
                    {c.status && <StatusBadge status={c.status} />}
                  </div>
                  <div className="flex items-center gap-3 text-sm text-[var(--muted)]">
                    {c.phone && (
                      <span className="flex items-center gap-1">
                        <Phone size={12} />
                        {c.phone}
                      </span>
                    )}
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail size={12} />
                        {c.email}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <span className="text-xs text-[var(--muted)]">{fmtDate(c.createdAt)}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="고객 등록">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">이름 *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="고객명"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">전화번호</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder="010-0000-0000"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">이메일</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder="email@example.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">상태</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors"
            >
              {CUSTOMER_STATUSES.map((s) => (
                <option key={s} value={s} className="bg-[#111]">{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">주소</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="주소"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => setForm({ ...form, memo: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors resize-none h-20"
              placeholder="참고사항"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
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
        requiredPlan={checkFeature("customers").requiredPlan || "starter"}
        featureLabel="고객"
        currentUsage={checkFeature("customers").current}
        limit={checkFeature("customers").limit}
      />
    </div>
  );
}

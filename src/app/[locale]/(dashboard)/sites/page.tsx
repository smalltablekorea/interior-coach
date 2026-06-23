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
import { Link } from "@/i18n/navigation";
import { useTranslations } from "use-intl";

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
  const t = useTranslations("sites.list");
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
  const [saveError, setSaveError] = useState<string | null>(null);

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
    setSaveError(null);
    try {
      // 빈 문자열은 enum/UUID/date 검증을 통과시키기 위해 null로 변환.
      const payload = {
        name: form.name.trim(),
        customerId: form.customerId || null,
        address: form.address.trim() || null,
        buildingType: form.buildingType || null,
        areaPyeong: form.areaPyeong ? parseFloat(form.areaPyeong) : null,
        status: form.status,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        memo: form.memo.trim() || null,
      };
      const res = await apiFetch("/api/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
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
      } else {
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error || body?.message || "";
        } catch {
          /* body 파싱 실패 시 status만 안내 */
        }
        if (res.status === 403) {
          setSaveError(detail || t("errors.noWorkspace"));
        } else if (res.status === 400) {
          setSaveError(detail || t("errors.invalidInput"));
        } else if (res.status === 401) {
          setSaveError(t("errors.sessionExpired"));
        } else {
          setSaveError(detail || t("errors.generic", { status: res.status }));
        }
      }
    } catch {
      setSaveError(t("errors.network"));
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex items-center gap-2">
          <Link
            href="/sites/quick-new"
            onClick={(e) => {
              const check = checkFeature("sites");
              if (!check.allowed) {
                e.preventDefault();
                setShowUpgrade(true);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors"
            title={t("newSiteTitle")}
          >
            <Plus size={18} />
            {t("newSite")}
          </Link>
          <button
            onClick={() => {
              const check = checkFeature("sites");
              if (!check.allowed) { setShowUpgrade(true); return; }
              setShowModal(true);
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[var(--border)] text-[var(--muted)] text-xs hover:border-[var(--green)]/40 hover:text-[var(--foreground)] transition-colors"
            title={t("quickAddTitle")}
          >
            {t("quickAdd")}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] flex-1">
          <Search size={18} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
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
            {t("filterAll")}
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
          title={search || filterStatus ? t("emptyNoMatch") : t("emptyTitle")}
          description={
            !search && !filterStatus
              ? t("emptyDescription")
              : undefined
          }
          action={
            !search &&
            !filterStatus && (
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
              >
                {t("emptyAction")}
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
                  {s.customerName || t("row.noCustomer")}
                  {s.address && ` · ${s.address}`}
                  {s.buildingType && ` · ${s.buildingType}`}
                  {s.areaPyeong && ` · ${s.areaPyeong}평`}
                </p>
              </div>
              <div className="text-right text-xs text-[var(--muted)]">
                {s.startDate || s.endDate ? (
                  <>
                    <p>{t("row.startLabel", { date: s.startDate ? fmtDate(s.startDate) : t("row.tbd") })}</p>
                    <p>{t("row.endLabel", { date: s.endDate ? fmtDate(s.endDate) : t("row.tbd") })}</p>
                  </>
                ) : (
                  <p className="opacity-70">{t("row.noSchedule")}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        open={showModal}
        onClose={() => { setShowModal(false); setSaveError(null); }}
        title={t("modal.title")}
        maxWidth="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {saveError && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {saveError}
            </div>
          )}
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.siteNameRequired")}</label>
            <KoreanInput
              type="text"
              required
              value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder={t("modal.siteNamePlaceholder")}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.customer")}</label>
              <select
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              >
                <option value="">{t("modal.selectNone")}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-[11px] text-[var(--muted)] leading-snug">
                {customers.length === 0 ? (
                  <>
                    <Link href="/customers" className="text-[var(--green)] underline hover:opacity-80">
                      고객 관리
                    </Link>
                    에서 먼저 등록해야 선택할 수 있습니다. 비워두고 현장을 먼저 등록한 뒤 나중에 연결해도 됩니다.
                  </>
                ) : (
                  <>
                    <Link href="/customers" className="text-[var(--green)] underline hover:opacity-80">
                      고객 관리
                    </Link>
                    에 등록된 고객만 선택할 수 있습니다. 비워두고 나중에 연결도 가능합니다.
                  </>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.buildingType")}</label>
              <select
                value={form.buildingType}
                onChange={(e) => setForm({ ...form, buildingType: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              >
                <option value="">{t("modal.select")}</option>
                {BUILDING_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.address")}</label>
            <KoreanInput
              type="text"
              value={form.address}
              onChange={(v) => setForm({ ...form, address: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder={t("modal.addressPlaceholder")}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.areaPyeong")}</label>
              <input
                type="number"
                value={form.areaPyeong}
                onChange={(e) => setForm({ ...form, areaPyeong: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
                placeholder={t("modal.areaPyeongPlaceholder")}
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.startDate")}</label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.endDate")}</label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] focus:border-[var(--green)] focus:outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">{t("modal.memo")}</label>
            <KoreanTextarea
              value={form.memo}
              onChange={(v) => setForm({ ...form, memo: v })}
              className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors resize-none h-20"
              placeholder={t("modal.memoPlaceholder")}
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
              {saving ? t("modal.submitting") : t("modal.submit")}
            </button>
          </div>
        </form>
      </Modal>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan={checkFeature("sites").requiredPlan || "starter"}
        featureLabel={t("featureLabel")}
        currentUsage={checkFeature("sites").current}
        limit={checkFeature("sites").limit}
      />
    </div>
  );
}

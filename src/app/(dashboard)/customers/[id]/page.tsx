"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Phone, Mail, MapPin, Building2, FileText, FileCheck,
  Pencil, Trash2, Save, X, MessageSquare, Plus, Clock, ExternalLink, Copy, Check,
} from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import Modal from "@/components/ui/Modal";
import { CUSTOMER_STATUSES, COMMUNICATION_TYPES } from "@/lib/constants";
import { fmt, fmtDate } from "@/lib/utils";

interface SiteRef {
  id: string;
  name: string;
  status: string;
  areaPyeong: number;
}

interface EstimateRef {
  id: string;
  siteName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ContractRef {
  id: string;
  siteName: string;
  contractAmount: number;
  paidAmount: number;
}

interface CommunicationLog {
  id: string;
  date: string;
  type: string;
  content: string | null;
  staffName: string | null;
  createdAt: string;
}

interface CustomerDetail {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  memo: string | null;
  status: string | null;
  referredBy: string | null;
  createdAt: string;
  sites: SiteRef[];
  estimates: EstimateRef[];
  contracts: ContractRef[];
}

type TabKey = "info" | "comm" | "projects";

export default function CustomerDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", address: "", memo: "", status: "상담중" });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Communication logs
  const [commLogs, setCommLogs] = useState<CommunicationLog[]>([]);
  const [commLoading, setCommLoading] = useState(false);
  const [showCommModal, setShowCommModal] = useState(false);
  const [commForm, setCommForm] = useState({ date: new Date().toISOString().split("T")[0], type: "전화", content: "", staffName: "" });
  const [commSaving, setCommSaving] = useState(false);

  // Portal link
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [portalGenerating, setPortalGenerating] = useState(false);
  const [portalCopied, setPortalCopied] = useState(false);

  const generatePortalLink = async () => {
    setPortalGenerating(true);
    try {
      const res = await fetch("/api/portal/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id }),
      });
      if (res.ok) {
        const data = await res.json();
        setPortalUrl(`${window.location.origin}${data.url}`);
      }
    } catch {}
    setPortalGenerating(false);
  };

  const copyPortalUrl = () => {
    if (!portalUrl) return;
    navigator.clipboard.writeText(portalUrl);
    setPortalCopied(true);
    setTimeout(() => setPortalCopied(false), 2000);
  };

  const fetchCustomer = () => {
    fetch(`/api/customers/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setCustomer(null);
        else setCustomer(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const fetchCommLogs = () => {
    setCommLoading(true);
    fetch(`/api/customers/${id}/communications`)
      .then((r) => r.json())
      .then((data) => {
        setCommLogs(data);
        setCommLoading(false);
      })
      .catch(() => setCommLoading(false));
  };

  useEffect(() => {
    fetchCustomer();
  }, [id]);

  useEffect(() => {
    if (activeTab === "comm") fetchCommLogs();
  }, [activeTab, id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        fetchCustomer();
      }
    } catch {}
    setIsEditing(false);
    setSaving(false);
  };

  const handleDelete = async () => {
    try {
      await fetch(`/api/customers/${id}`, { method: "DELETE" });
    } catch {}
    window.location.href = "/customers";
  };

  const handleStatusChange = async (newStatus: string) => {
    await fetch(`/api/customers/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setCustomer((prev) => (prev ? { ...prev, status: newStatus } : prev));
  };

  const handleCommSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommSaving(true);
    const res = await fetch(`/api/customers/${id}/communications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(commForm),
    });
    if (res.ok) {
      setShowCommModal(false);
      setCommForm({ date: new Date().toISOString().split("T")[0], type: "전화", content: "", staffName: "" });
      fetchCommLogs();
    }
    setCommSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 rounded-xl animate-shimmer" />
        <div className="h-[400px] rounded-2xl animate-shimmer" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--muted)]">고객을 찾을 수 없습니다.</p>
        <Link href="/customers" className="text-[var(--green)] hover:underline text-sm mt-2 inline-block">
          목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const totalContract = customer.contracts.reduce((s, c) => s + c.contractAmount, 0);
  const totalPaid = customer.contracts.reduce((s, c) => s + c.paidAmount, 0);

  const inputClass = "w-full px-4 py-2.5 rounded-xl bg-white/5 border border-[var(--border)] text-white text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none";

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "info", label: "기본정보", icon: <Phone size={16} /> },
    { key: "comm", label: "소통기록", icon: <MessageSquare size={16} /> },
    { key: "projects", label: "현장/계약", icon: <Building2 size={16} /> },
  ];

  const commTypeIcon = (type: string) => {
    switch (type) {
      case "전화": return "📞";
      case "문자": return "💬";
      case "방문": return "🏠";
      case "카톡": return "💛";
      default: return "📝";
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/customers"
            className="w-9 h-9 rounded-xl border border-[var(--border)] flex items-center justify-center hover:bg-white/[0.04] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[var(--green)]/10 flex items-center justify-center text-[var(--green)] text-xl font-bold">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">{customer.name}</h1>
                {customer.status && <StatusBadge status={customer.status} />}
              </div>
              <p className="text-sm text-[var(--muted)]">등록일 {fmtDate(customer.createdAt)}</p>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(true);
                setEditForm({
                  name: customer.name,
                  phone: customer.phone || "",
                  email: customer.email || "",
                  address: customer.address || "",
                  memo: customer.memo || "",
                  status: customer.status || "상담중",
                });
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
            >
              <Pencil size={16} /> 수정
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--red)]/30 text-sm text-[var(--red)] hover:bg-[var(--red)]/10 transition-colors"
            >
              <Trash2 size={16} /> 삭제
            </button>
            <button
              onClick={generatePortalLink}
              disabled={portalGenerating}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-sm text-blue-400 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
            >
              <ExternalLink size={16} /> {portalGenerating ? "생성 중..." : "포탈 링크"}
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium disabled:opacity-50"
            >
              <Save size={16} /> {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]"
            >
              <X size={16} /> 취소
            </button>
          </div>
        )}
      </div>

      {/* Portal URL */}
      {portalUrl && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <ExternalLink size={18} className="text-blue-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-400 mb-0.5">고객 포탈 링크 (30일 유효)</p>
            <p className="text-sm text-white truncate">{portalUrl}</p>
          </div>
          <button
            onClick={copyPortalUrl}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-sm hover:bg-blue-500/30 transition-colors shrink-0"
          >
            {portalCopied ? <><Check size={14} /> 복사됨</> : <><Copy size={14} /> 복사</>}
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-2xl font-bold">{customer.sites.length}</p>
          <p className="text-sm text-[var(--muted)] mt-1">현장</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-2xl font-bold">{customer.contracts.length}</p>
          <p className="text-sm text-[var(--muted)] mt-1">계약</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-xl font-bold text-[var(--blue)]">{fmt(totalContract)}</p>
          <p className="text-sm text-[var(--muted)] mt-1">총 계약액</p>
        </div>
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 text-center">
          <p className="text-xl font-bold text-[var(--green)]">{fmt(totalPaid)}</p>
          <p className="text-sm text-[var(--muted)] mt-1">수금액</p>
        </div>
      </div>

      {/* Status Quick Change */}
      {!isEditing && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[var(--muted)]">상태:</span>
          {CUSTOMER_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                customer.status === s
                  ? "bg-[var(--green)]/20 text-[var(--green)] border border-[var(--green)]/30"
                  : "bg-white/[0.04] text-[var(--muted)] border border-[var(--border)] hover:bg-white/[0.08]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.key
                ? "border-[var(--green)] text-[var(--green)]"
                : "border-transparent text-[var(--muted)] hover:text-white"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
          <h2 className="text-sm font-semibold text-[var(--muted)] mb-4">연락처 정보</h2>
          {isEditing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">이름</label>
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} placeholder="이름" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">전화번호</label>
                <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} placeholder="전화번호" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">이메일</label>
                <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} placeholder="이메일" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">주소</label>
                <input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} placeholder="주소" className={inputClass} />
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">상태</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className={inputClass}
                >
                  {CUSTOMER_STATUSES.map((s) => (
                    <option key={s} value={s} className="bg-[#111]">{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-[var(--muted)] mb-1 block">메모</label>
                <textarea value={editForm.memo} onChange={(e) => setEditForm({ ...editForm, memo: e.target.value })} placeholder="메모" rows={3} className={inputClass} />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[var(--muted)]" />
                  <span className="text-sm">{customer.phone}</span>
                </div>
              )}
              {customer.email && (
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-[var(--muted)]" />
                  <span className="text-sm">{customer.email}</span>
                </div>
              )}
              {customer.address && (
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-[var(--muted)]" />
                  <span className="text-sm">{customer.address}</span>
                </div>
              )}
              {!customer.phone && !customer.email && !customer.address && (
                <p className="text-sm text-[var(--muted)]">등록된 연락처가 없습니다.</p>
              )}
              {customer.memo && (
                <div className="mt-3 p-3 rounded-xl bg-white/[0.03] text-sm text-[var(--muted)]">
                  {customer.memo}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "comm" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">소통 기록</h2>
            <button
              onClick={() => setShowCommModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors"
            >
              <Plus size={16} />
              기록 추가
            </button>
          </div>

          {commLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-shimmer" />
              ))}
            </div>
          ) : commLogs.length === 0 ? (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
              <MessageSquare size={32} className="mx-auto text-[var(--muted)] mb-2" />
              <p className="text-sm text-[var(--muted)]">소통 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-5 top-2 bottom-2 w-px bg-[var(--border)]" />

              <div className="space-y-3">
                {commLogs.map((log) => (
                  <div key={log.id} className="relative flex gap-4 pl-2">
                    {/* Timeline dot */}
                    <div className="w-7 h-7 rounded-full bg-[var(--card)] border-2 border-[var(--border)] flex items-center justify-center text-xs z-10 shrink-0">
                      {commTypeIcon(log.type)}
                    </div>

                    <div className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{log.type}</span>
                          {log.staffName && (
                            <span className="text-xs text-[var(--muted)]">담당: {log.staffName}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-[var(--muted)]">
                          <Clock size={12} />
                          {fmtDate(log.date)}
                        </div>
                      </div>
                      {log.content && (
                        <p className="text-sm text-[var(--muted)] whitespace-pre-wrap">{log.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-4">
          {/* Sites */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Building2 size={18} className="text-[var(--muted)]" />
              <h2 className="text-lg font-semibold">연결된 현장</h2>
            </div>
            {customer.sites.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">연결된 현장이 없습니다.</p>
            ) : (
              <div className="space-y-2">
                {customer.sites.map((s) => (
                  <Link
                    key={s.id}
                    href={`/sites/${s.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{s.name}</p>
                      <StatusBadge status={s.status} />
                    </div>
                    <span className="text-sm text-[var(--muted)]">{s.areaPyeong}평</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Estimates */}
          {customer.estimates.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileText size={18} className="text-[var(--muted)]" />
                <h2 className="text-lg font-semibold">견적서</h2>
              </div>
              <div className="space-y-2">
                {customer.estimates.map((e) => (
                  <Link
                    key={e.id}
                    href={`/estimates/${e.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{e.siteName}</p>
                        <StatusBadge status={e.status} />
                      </div>
                      <p className="text-xs text-[var(--muted)]">{fmtDate(e.createdAt)}</p>
                    </div>
                    <p className="font-bold">{fmt(e.totalAmount)}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Contracts */}
          {customer.contracts.length > 0 && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5">
              <div className="flex items-center gap-2 mb-4">
                <FileCheck size={18} className="text-[var(--muted)]" />
                <h2 className="text-lg font-semibold">계약</h2>
              </div>
              <div className="space-y-2">
                {customer.contracts.map((c) => (
                  <Link
                    key={c.id}
                    href={`/contracts/${c.id}`}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-white/[0.03] transition-colors"
                  >
                    <p className="font-medium">{c.siteName}</p>
                    <div className="text-right">
                      <p className="font-bold">{fmt(c.contractAmount)}</p>
                      <p className="text-xs text-[var(--muted)]">수금 {fmt(c.paidAmount)}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">삭제 확인</h3>
            <p className="text-sm text-[var(--muted)] mb-4">정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)]">
                취소
              </button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-[var(--red)] text-white text-sm font-medium">
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Communication Log Modal */}
      <Modal open={showCommModal} onClose={() => setShowCommModal(false)} title="소통 기록 추가">
        <form onSubmit={handleCommSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">날짜 *</label>
              <input
                type="date"
                required
                value={commForm.date}
                onChange={(e) => setCommForm({ ...commForm, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--muted)] mb-1">유형 *</label>
              <select
                value={commForm.type}
                onChange={(e) => setCommForm({ ...commForm, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white focus:border-[var(--green)] focus:outline-none transition-colors"
              >
                {COMMUNICATION_TYPES.map((t) => (
                  <option key={t} value={t} className="bg-[#111]">{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">담당자</label>
            <input
              type="text"
              value={commForm.staffName}
              onChange={(e) => setCommForm({ ...commForm, staffName: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors"
              placeholder="담당자명"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--muted)] mb-1">내용</label>
            <textarea
              value={commForm.content}
              onChange={(e) => setCommForm({ ...commForm, content: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-[var(--border)] text-white placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none transition-colors resize-none h-24"
              placeholder="소통 내용을 기록하세요"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowCommModal(false)}
              className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={commSaving}
              className="px-4 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50"
            >
              {commSaving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

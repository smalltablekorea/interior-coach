"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Loader2,
  AlertCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Clock,
  Mail,
  CreditCard,
  FileCheck,
  MessageSquare,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MKT_LEAD_STATUS_LABELS } from "@/lib/types/marketing";
import type {
  LeadListItem,
  LeadDetail,
  LeadTimeline,
  MktLeadStatus,
} from "@/lib/types/marketing";

const STATUS_COLORS: Record<MktLeadStatus, { bg: string; text: string }> = {
  anonymous: { bg: "bg-white/[0.06]", text: "text-[var(--muted)]" },
  identified: { bg: "bg-blue-500/10", text: "text-blue-400" },
  engaged: { bg: "bg-purple-500/10", text: "text-purple-400" },
  qualified: { bg: "bg-[var(--orange)]/10", text: "text-[var(--orange)]" },
  customer: { bg: "bg-[var(--green)]/10", text: "text-[var(--green)]" },
  churned: { bg: "bg-[var(--red)]/10", text: "text-[var(--red)]" },
};

const EVENT_LABELS: Record<string, string> = {
  signup_completed: "회원가입 완료",
  login_completed: "로그인",
  upload_started: "업로드 시작",
  upload_file_added: "파일 추가",
  upload_submitted: "업로드 제출",
  analysis_completed: "분석 완료",
  paywall_viewed: "페이월 조회",
  checkout_started: "결제 시작",
  payment_succeeded: "결제 성공",
  payment_failed: "결제 실패",
  report_viewed: "리포트 확인",
  report_downloaded: "리포트 다운로드",
  companies_viewed: "업체 조회",
  company_clicked: "업체 클릭",
  inquiry_submitted: "업체문의 제출",
  referral_shared: "추천 공유",
  referral_signup: "추천 가입",
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sort, setSort] = useState("lead_score");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLead, setSelectedLead] = useState<LeadDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchLeads = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "30",
      sort,
      dir: "desc",
    });
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    fetch(`/api/admin/marketing/leads?${params}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setLeads(d.leads || []);
        setTotal(d.pagination?.total || 0);
        setTotalPages(d.pagination?.totalPages || 1);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, sort, search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const openDetail = (id: string) => {
    setLoadingDetail(true);
    fetch(`/api/admin/marketing/leads/${id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setSelectedLead(d); setLoadingDetail(false); })
      .catch(() => setLoadingDetail(false));
  };

  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--card)] border border-[var(--border)] flex-1 min-w-[200px]">
          <Search size={16} className="text-[var(--muted)]" />
          <input
            type="text"
            placeholder="이메일 또는 이름 검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="bg-transparent text-sm flex-1 focus:outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
        >
          <option value="">상태 전체</option>
          {Object.entries(MKT_LEAD_STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-[var(--border)] text-sm focus:outline-none"
        >
          <option value="lead_score">리드 점수순</option>
          <option value="last_active">최근 활동순</option>
          <option value="created_at">가입일순</option>
        </select>
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-[var(--muted)]">
        <span>총 {total.toLocaleString()}명</span>
        <span>
          {page}/{totalPages} 페이지
        </span>
      </div>

      {/* Lead Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
        </div>
      ) : leads.length === 0 ? (
        <div className="text-center py-16 text-[var(--muted)]">
          <User size={32} className="mx-auto mb-2" />
          <p className="text-sm">리드 데이터가 없습니다</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.02]">
                <tr className="text-xs text-[var(--muted)]">
                  <th className="text-left py-2.5 px-4">사용자</th>
                  <th className="text-left py-2.5 px-3">최근 행동</th>
                  <th className="text-left py-2.5 px-3">유입</th>
                  <th className="text-right py-2.5 px-3">점수</th>
                  <th className="text-left py-2.5 px-3">상태</th>
                  <th className="text-left py-2.5 px-3">마지막 접속</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  const sColor = STATUS_COLORS[lead.status] || STATUS_COLORS.anonymous;
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openDetail(lead.id)}
                      className="border-t border-[var(--border)] hover:bg-white/[0.02] cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-4">
                        <p className="font-medium">{lead.name || lead.email || "익명"}</p>
                        {lead.email && lead.name && (
                          <p className="text-[10px] text-[var(--muted)]">{lead.email}</p>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        {lead.lastEvent ? (
                          <span className="text-xs">
                            {EVENT_LABELS[lead.lastEvent] || lead.lastEvent}
                          </span>
                        ) : (
                          <span className="text-xs text-[var(--muted)]">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="text-xs text-[var(--muted)]">
                          {lead.source || "-"}
                          {lead.medium ? ` / ${lead.medium}` : ""}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span
                          className={cn(
                            "text-xs font-bold tabular-nums",
                            lead.leadScore >= 80
                              ? "text-[var(--green)]"
                              : lead.leadScore >= 40
                              ? "text-[var(--orange)]"
                              : "text-[var(--muted)]"
                          )}
                        >
                          {lead.leadScore}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={cn(
                            "px-1.5 py-0.5 rounded text-[10px] font-medium",
                            sColor.bg,
                            sColor.text
                          )}
                        >
                          {MKT_LEAD_STATUS_LABELS[lead.status] || lead.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-xs text-[var(--muted)] tabular-nums">
                        {lead.lastActiveAt
                          ? new Date(lead.lastActiveAt).toLocaleDateString("ko-KR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-30"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-[var(--muted)]">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-[var(--border)] disabled:opacity-30"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Lead Detail Panel */}
      {(selectedLead || loadingDetail) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSelectedLead(null)}
          />
          <div className="relative w-full max-w-lg bg-[var(--card)] border-l border-[var(--border)] overflow-y-auto">
            <div className="sticky top-0 bg-[var(--card)] z-10 p-4 border-b border-[var(--border)] flex items-center justify-between">
              <h3 className="font-medium">리드 상세</h3>
              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg hover:bg-white/[0.06]"
              >
                <X size={18} />
              </button>
            </div>
            {loadingDetail ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
              </div>
            ) : selectedLead ? (
              <div className="p-4 space-y-5">
                {/* Lead Info */}
                <div>
                  <p className="text-lg font-bold">
                    {selectedLead.name || selectedLead.email || "익명 사용자"}
                  </p>
                  {selectedLead.email && (
                    <p className="text-sm text-[var(--muted)] flex items-center gap-1 mt-0.5">
                      <Mail size={12} /> {selectedLead.email}
                    </p>
                  )}
                </div>

                {/* Status Cards */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] text-center">
                    <p className="text-lg font-bold">{selectedLead.leadScore}</p>
                    <p className="text-[10px] text-[var(--muted)]">리드 점수</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] text-center">
                    <p className="text-sm font-medium">
                      {selectedLead.paymentStatus === "paid" ? (
                        <span className="text-[var(--green)]">결제 완료</span>
                      ) : (
                        <span className="text-[var(--muted)]">미결제</span>
                      )}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">결제</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-[var(--border)] text-center">
                    <p className="text-sm font-medium">
                      {selectedLead.hasInquiry ? (
                        <span className="text-[var(--green)]">완료</span>
                      ) : (
                        <span className="text-[var(--muted)]">미완료</span>
                      )}
                    </p>
                    <p className="text-[10px] text-[var(--muted)]">업체문의</p>
                  </div>
                </div>

                {/* Recommended Action */}
                {selectedLead.recommendedAction && (
                  <div className="p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                    <p className="text-xs text-[var(--muted)] mb-0.5">추천 액션</p>
                    <p className="text-sm font-medium text-[var(--green)]">
                      {selectedLead.recommendedAction}
                    </p>
                  </div>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                    <Clock size={14} /> 행동 타임라인
                  </h4>
                  {selectedLead.timeline.length === 0 ? (
                    <p className="text-xs text-[var(--muted)]">이벤트 없음</p>
                  ) : (
                    <div className="space-y-1.5">
                      {selectedLead.timeline.map((evt, i) => (
                        <TimelineItem key={i} event={evt} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({ event }: { event: LeadTimeline }) {
  return (
    <div className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-white/[0.02]">
      <div className="w-1.5 h-1.5 rounded-full bg-[var(--green)] mt-1.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium">
          {EVENT_LABELS[event.eventType] || event.eventType}
        </p>
        <p className="text-[10px] text-[var(--muted)] tabular-nums">
          {new Date(event.occurredAt).toLocaleString("ko-KR", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
    </div>
  );
}
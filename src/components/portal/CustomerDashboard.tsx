"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Home,
  BarChart3,
  Camera,
  CreditCard,
  MessageCircle,
  FileEdit,
  CalendarDays,
  MapPin,
  Building,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { ProgressRing } from "./ProgressRing";
import { PhaseTimeline } from "./PhaseTimeline";
import { PhotoGallery } from "./PhotoGallery";
import { PaymentTimeline } from "./PaymentTimeline";
import { MessagePanel } from "./MessagePanel";
import { ChangeRequestForm } from "./ChangeRequestForm";

interface CustomerDashboardProps {
  token: string;
  customerName: string;
  siteName: string;
  siteAddress: string;
}

type Section = "overview" | "phases" | "photos" | "payments" | "messages" | "change-request";

const sections: { id: Section; label: string; icon: typeof Home }[] = [
  { id: "overview", label: "진행 현황", icon: Home },
  { id: "phases", label: "공정 일정", icon: BarChart3 },
  { id: "photos", label: "시공 사진", icon: Camera },
  { id: "payments", label: "수금 현황", icon: CreditCard },
  { id: "messages", label: "메시지", icon: MessageCircle },
  { id: "change-request", label: "변경 요청", icon: FileEdit },
];

export function CustomerDashboard({
  token,
  customerName,
  siteName,
  siteAddress,
}: CustomerDashboardProps) {
  const [activeSection, setActiveSection] = useState<Section>("overview");
  const [overview, setOverview] = useState<any>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any>({ before: [], during: [], after: [] });
  const [payments, setPayments] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const apiBase = `/api/portal/${token}`;

  const fetchData = useCallback(
    async (endpoint: string, key: string) => {
      setLoading((prev) => ({ ...prev, [key]: true }));
      setErrors((prev) => ({ ...prev, [key]: "" }));
      try {
        const res = await fetch(`${apiBase}/${endpoint}`);
        if (!res.ok) throw new Error("데이터를 불러올 수 없습니다.");
        const data = await res.json();
        return data;
      } catch (err: any) {
        setErrors((prev) => ({ ...prev, [key]: err.message }));
        return null;
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }));
      }
    },
    [apiBase]
  );

  // Load overview on mount
  useEffect(() => {
    fetchData("overview", "overview").then((data) => {
      if (data) setOverview(data);
    });
  }, [fetchData]);

  // Load data when section changes
  useEffect(() => {
    if (activeSection === "phases" && phases.length === 0) {
      fetchData("phases", "phases").then((data) => {
        if (data) setPhases(data.phases);
      });
    } else if (activeSection === "photos") {
      fetchData("photos", "photos").then((data) => {
        if (data) setPhotos(data.photos);
      });
    } else if (activeSection === "payments" && payments.length === 0) {
      fetchData("payments", "payments").then((data) => {
        if (data) setPayments(data.payments);
      });
    } else if (activeSection === "messages") {
      fetchData("messages", "messages").then((data) => {
        if (data) setMessages(data.messages);
      });
    }
  }, [activeSection, fetchData]);

  const handleSendMessage = async (content: string) => {
    const res = await fetch(`${apiBase}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!res.ok) throw new Error("메시지 전송 실패");
    const data = await res.json();
    setMessages((prev) => [...prev, data.message]);
  };

  const handleChangeRequest = async (reqData: {
    category: string;
    title: string;
    description: string;
  }) => {
    const res = await fetch(`${apiBase}/change-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reqData),
    });
    if (!res.ok) throw new Error("변경 요청 실패");
  };

  const progress = overview?.site?.progress ?? 0;

  return (
    <div className="min-h-[80vh]">
      {/* Customer info banner */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shrink-0">
          {customerName.charAt(0)}
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-gray-900 truncate">
            {customerName}님의 시공 현황
          </h1>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building className="w-3 h-3" />
            <span className="truncate">{siteName}</span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="bg-white border-b border-gray-100 -mx-4 px-4 sticky top-0 z-30 overflow-x-auto mb-6">
        <div className="flex gap-1">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex flex-col items-center gap-1 py-2.5 px-3 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  isActive
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                <Icon className="w-4 h-4" />
                {section.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content */}
      <div>
        {/* Overview Section */}
        {activeSection === "overview" && (
          <div className="space-y-6">
            {/* Progress Ring */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col items-center">
                <ProgressRing progress={progress} />
                {overview?.currentPhase && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">현재 진행 공정</p>
                    <p className="font-semibold text-gray-900 text-lg">
                      {overview.currentPhase.category}
                    </p>
                    <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      {overview.currentPhase.progress}% 진행
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Site info */}
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-3">현장 정보</h3>
              <div className="space-y-2.5">
                {siteAddress && (
                  <div className="flex items-start gap-2.5 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{siteAddress}</span>
                  </div>
                )}
                {overview?.site?.buildingType && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <Building className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-600">
                      {overview.site.buildingType}
                      {overview.site.areaPyeong ? ` · ${overview.site.areaPyeong}평` : ""}
                    </span>
                  </div>
                )}
                {overview?.site?.startDate && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CalendarDays className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-gray-600">
                      {overview.site.startDate}
                      {overview.site.endDate ? ` ~ ${overview.site.endDate}` : ""}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Pinned summary */}
            {overview?.pinnedSummary && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-3">요약</h3>
                <div className="grid grid-cols-2 gap-3">
                  {overview.pinnedSummary.nextMilestoneTitle && (
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <p className="text-xs text-blue-600 mb-1">다음 일정</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {overview.pinnedSummary.nextMilestoneTitle}
                      </p>
                      {overview.pinnedSummary.nextMilestoneDate && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {overview.pinnedSummary.nextMilestoneDate}
                        </p>
                      )}
                    </div>
                  )}
                  {overview.pinnedSummary.pendingPaymentAmount > 0 && (
                    <div className="p-3 bg-orange-50 rounded-xl">
                      <p className="text-xs text-orange-600 mb-1">미납 금액</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {overview.pinnedSummary.pendingPaymentAmount.toLocaleString("ko-KR")}원
                      </p>
                      {overview.pinnedSummary.pendingPaymentDueDate && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          기한: {overview.pinnedSummary.pendingPaymentDueDate}
                        </p>
                      )}
                    </div>
                  )}
                  {(overview.pinnedSummary.openDefectsCount ?? 0) > 0 && (
                    <div className="p-3 bg-red-50 rounded-xl">
                      <p className="text-xs text-red-600 mb-1">미처리 하자</p>
                      <p className="font-semibold text-sm text-gray-900">
                        {overview.pinnedSummary.openDefectsCount}건
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Phases Section */}
        {activeSection === "phases" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">공정 일정표</h3>
              <button
                onClick={() =>
                  fetchData("phases", "phases").then((data) => {
                    if (data) setPhases(data.phases);
                  })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className={`w-4 h-4 ${loading.phases ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loading.phases && phases.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
            ) : errors.phases ? (
              <ErrorMessage message={errors.phases} />
            ) : (
              <PhaseTimeline phases={phases} />
            )}
          </div>
        )}

        {/* Photos Section */}
        {activeSection === "photos" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">시공 사진</h3>
              <button
                onClick={() =>
                  fetchData("photos", "photos").then((data) => {
                    if (data) setPhotos(data.photos);
                  })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className={`w-4 h-4 ${loading.photos ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loading.photos ? (
              <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
            ) : errors.photos ? (
              <ErrorMessage message={errors.photos} />
            ) : (
              <PhotoGallery photos={photos} />
            )}
          </div>
        )}

        {/* Payments Section */}
        {activeSection === "payments" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">수금 현황</h3>
              <button
                onClick={() =>
                  fetchData("payments", "payments").then((data) => {
                    if (data) setPayments(data.payments);
                  })
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <RefreshCw className={`w-4 h-4 ${loading.payments ? "animate-spin" : ""}`} />
              </button>
            </div>
            {loading.payments && payments.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">불러오는 중...</div>
            ) : errors.payments ? (
              <ErrorMessage message={errors.payments} />
            ) : (
              <PaymentTimeline payments={payments} />
            )}
          </div>
        )}

        {/* Messages Section */}
        {activeSection === "messages" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">시공팀 메시지</h3>
              <p className="text-xs text-gray-400 mt-0.5">시공팀과 직접 소통하세요</p>
            </div>
            {errors.messages ? (
              <div className="p-5">
                <ErrorMessage message={errors.messages} />
              </div>
            ) : (
              <MessagePanel
                messages={messages}
                onSend={handleSendMessage}
                loading={loading.messages || false}
              />
            )}
          </div>
        )}

        {/* Change Request Section */}
        {activeSection === "change-request" && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-1">변경 요청</h3>
            <p className="text-xs text-gray-400 mb-4">
              디자인, 자재, 일정 변경 등을 요청하실 수 있습니다.
            </p>
            <ChangeRequestForm onSubmit={handleChangeRequest} />
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
      <AlertTriangle className="w-4 h-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

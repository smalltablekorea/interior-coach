"use client";

import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Send, Bot, User, Loader2, MessageSquare } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/ui/EmptyState";
import UpgradeModal from "@/components/subscription/UpgradeModal";
import { useSubscription } from "@/hooks/useSubscription";

interface Consultation {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  createdAt: string;
}

const QUICK_QUESTIONS = [
  "인테리어 사업자 부가세 신고 방법이 궁금해요",
  "일용직 근로자 원천징수 방법을 알려주세요",
  "프리랜서 3.3% 원천징수 계산법이 궁금합니다",
  "인테리어 사업 경비 처리 가능한 항목은?",
  "세금계산서 발행 시 주의사항은?",
  "4대보험 가입 기준과 요율이 궁금합니다",
];

export default function TaxAiAdvisorPage() {
  const [history, setHistory] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const { checkFeature } = useSubscription();

  useEffect(() => {
    fetch("/api/tax/ai-advisor")
      .then((r) => r.json())
      .then((data) => { setHistory(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, asking]);

  const handleAsk = async (q?: string) => {
    const text = q || question.trim();
    if (!text || asking) return;
    const check = checkFeature("aiTaxAdvisor");
    if (!check.allowed) { setShowUpgrade(true); return; }
    setAsking(true);
    setQuestion("");

    try {
      const res = await fetch("/api/tax/ai-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text }),
      });
      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => [data, ...prev]);
      }
    } catch {
      // silent
    }
    setAsking(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  };

  return (
    <div className="space-y-5 animate-fade-up">
      <div className="flex items-center gap-3">
        <Link href="/tax" className="p-2 rounded-lg hover:bg-white/[0.06] text-[var(--muted)]"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-bold">AI 세무 상담</h1>
          <p className="text-xs text-[var(--muted)] mt-0.5">인테리어 사업 세무/회계 전문 AI 상담</p>
        </div>
      </div>

      {/* Quick Questions */}
      {history.length === 0 && !loading && (
        <div className="space-y-3">
          <p className="text-sm text-[var(--muted)]">자주 묻는 질문</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {QUICK_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleAsk(q)}
                disabled={asking}
                className="text-left p-3 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-white/[0.04] text-sm transition-colors disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat History */}
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
          </div>
        ) : history.length === 0 && !asking ? (
          <EmptyState icon={MessageSquare} title="아직 상담 내역이 없습니다" description="아래에서 세무 관련 질문을 해보세요" />
        ) : (
          [...history].reverse().map((item) => (
            <div key={item.id} className="space-y-3">
              {/* User Question */}
              <div className="flex items-start gap-3 justify-end">
                <div className="max-w-[80%] p-3.5 rounded-2xl rounded-tr-md bg-[var(--green)]/10 border border-[var(--green)]/20">
                  <p className="text-sm whitespace-pre-wrap">{item.question}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <User size={16} className="text-[var(--muted)]" />
                </div>
              </div>
              {/* AI Answer */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-[var(--blue)]" />
                </div>
                <div className="max-w-[80%] p-3.5 rounded-2xl rounded-tl-md bg-[var(--card)] border border-[var(--border)]">
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{item.answer}</p>
                  <p className="text-[10px] text-[var(--muted)] mt-2">
                    {new Date(item.createdAt).toLocaleString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Loading indicator while asking */}
        {asking && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--blue)]/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-[var(--blue)]" />
            </div>
            <div className="p-3.5 rounded-2xl rounded-tl-md bg-[var(--card)] border border-[var(--border)]">
              <div className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin text-[var(--muted)]" />
                <span className="text-sm text-[var(--muted)]">답변 생성 중...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-[var(--card)] border border-[var(--border)]">
        <input
          type="text"
          placeholder="세무/회계 질문을 입력하세요..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={asking}
          className="flex-1 px-3 py-2.5 bg-transparent text-sm focus:outline-none placeholder:text-[var(--muted)] disabled:opacity-50"
        />
        <button
          onClick={() => handleAsk()}
          disabled={!question.trim() || asking}
          className="p-2.5 rounded-xl bg-[var(--green)] text-black disabled:opacity-30 transition-opacity"
        >
          <Send size={18} />
        </button>
      </div>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        requiredPlan={checkFeature("aiTaxAdvisor").requiredPlan || "starter"}
        featureLabel="AI 세무 상담"
        currentUsage={checkFeature("aiTaxAdvisor").current}
        limit={checkFeature("aiTaxAdvisor").limit}
      />
    </div>
  );
}

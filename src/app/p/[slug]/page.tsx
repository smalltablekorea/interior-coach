"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, Camera, BarChart3, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import type { SiteChatMessage, PinnedSummary } from "@/components/site-chat/types";

// 고객 포털 — 로그인 불필요, 모바일 우선 미니멀 디자인

interface PortalData {
  room: { title: string; businessName: string };
  messages: SiteChatMessage[];
  summary: PinnedSummary;
}

export default function ClientPortalPage() {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Message form
  const [name, setName] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/portal-v2/${slug}`)
      .then(r => {
        if (!r.ok) throw new Error(r.status === 404 ? "not_found" : "error");
        return r.json();
      })
      .then(d => { setData(d); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [slug]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages.length]);

  const handleSend = async () => {
    if (!messageText.trim() || !slug) return;
    setSending(true);
    try {
      const res = await fetch(`/api/portal-v2/${slug}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "고객", content: messageText.trim() }),
      });
      if (res.ok) {
        setSent(true);
        setMessageText("");
        setTimeout(() => setSent(false), 3000);
        // 새 메시지 반영
        if (data) {
          const newMsg: SiteChatMessage = {
            id: `client-${Date.now()}`,
            roomId: "",
            senderId: null,
            senderType: "client",
            senderDisplayName: name.trim() || "고객",
            content: messageText.trim(),
            contentType: "text",
            replyToId: null,
            metadata: null,
            createdAt: new Date().toISOString(),
            editedAt: null,
            deletedAt: null,
          };
          setData({ ...data, messages: [...data.messages, newMsg] });
        }
      } else if (res.status === 429) {
        alert("메시지 전송 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch { /* ignore */ }
    setSending(false);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[var(--green)]/30 border-t-[var(--green)] rounded-full animate-spin" />
      </div>
    );
  }

  // 404
  if (error === "not_found" || !data) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 text-center">
        <div className="text-4xl mb-4">🏗️</div>
        <h1 className="text-xl font-bold mb-2">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm text-[var(--muted)]">링크가 만료되었거나 잘못된 주소입니다.</p>
      </div>
    );
  }

  const { room, messages, summary } = data;
  const progress = summary?.currentProgressPercent || 0;

  // 고객에게 보이는 메시지만 필터 (system_event 중 internal 제외)
  const visibleMessages = messages.filter(m =>
    m.contentType !== "system_event" || !m.metadata?.internal
  );

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col max-w-2xl mx-auto">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-[var(--background)]/90 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[var(--green)] font-medium">{room.businessName}</p>
            <h1 className="text-sm font-bold">{room.title} 진행 상황</h1>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-[var(--green)]">{progress}%</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden mt-2">
          <div className="h-full rounded-full bg-[var(--green)] transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Collapsible info */}
        <button
          onClick={() => setShowInfo(!showInfo)}
          className="flex items-center gap-1 text-[10px] text-[var(--muted)] mt-2 w-full"
        >
          현장 정보 {showInfo ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
        </button>
        {showInfo && summary && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            {summary.nextMilestoneTitle && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-[var(--border)]">
                <Calendar size={10} className="text-blue-400" />
                <div>
                  <p className="text-[9px] text-[var(--muted)]">다음 공정</p>
                  <p className="text-[10px] font-medium">{summary.nextMilestoneTitle}</p>
                </div>
              </div>
            )}
            {(summary.photoCount ?? 0) > 0 && (
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-white/[0.03] border border-[var(--border)]">
                <Camera size={10} className="text-amber-400" />
                <div>
                  <p className="text-[9px] text-[var(--muted)]">시공 사진</p>
                  <p className="text-[10px] font-medium">{summary.photoCount}장</p>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Message timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 ? (
          <div className="text-center py-16 text-[var(--muted)]">
            <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">아직 공유된 내용이 없습니다</p>
          </div>
        ) : (
          visibleMessages.map((msg) => {
            const isClient = msg.senderType === "client";
            const isSystem = msg.senderType === "system" || msg.contentType === "system_event";
            const time = new Date(msg.createdAt).toLocaleString("ko-KR", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <span className="px-3 py-1 rounded-full bg-white/[0.04] text-[10px] text-[var(--muted)]">{msg.content}</span>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  {!isClient && (
                    <span className="text-[9px] text-[var(--muted)] mb-0.5 block">{msg.senderDisplayName}</span>
                  )}
                  <div className={`px-3 py-2 rounded-xl text-sm ${
                    isClient ? "bg-purple-500/10" : "bg-white/[0.06]"
                  }`}>
                    {msg.contentType === "image" && msg.attachments?.length ? (
                      <div className="space-y-1">
                        {msg.attachments.map(att => (
                          att.thumbnailPath ? (
                            <img key={att.id} src={att.thumbnailPath} alt="시공 사진" className="rounded-lg max-w-full" loading="lazy" />
                          ) : (
                            <div key={att.id} className="flex items-center gap-2 text-[var(--muted)]">
                              <Camera size={14} /><span className="text-xs">사진</span>
                            </div>
                          )
                        ))}
                        {msg.content && <p className="mt-1">{msg.content}</p>}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--muted)] mt-0.5 block">{time}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message input */}
      <div className="border-t border-[var(--border)] bg-[var(--card)] p-4 space-y-2">
        {sent && (
          <div className="text-center text-xs text-[var(--green)] font-medium py-1">
            메시지가 전송되었습니다
          </div>
        )}
        <div className="flex gap-2">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="이름 (선택)"
            className="w-24 px-2.5 py-2 rounded-lg bg-white/[0.04] border border-[var(--border)] text-xs placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
          />
          <div className="flex-1 flex gap-1.5">
            <input
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="업체에 메시지 보내기"
              className="flex-1 px-3 py-2 rounded-lg bg-white/[0.04] border border-[var(--border)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
            />
            <button
              onClick={handleSend}
              disabled={sending || !messageText.trim()}
              className="px-3 py-2 rounded-lg bg-[var(--green)] text-black hover:opacity-90 disabled:opacity-30 transition-opacity"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-3 text-[9px] text-[var(--muted)]">
        Powered by 인테리어코치
      </div>
    </div>
  );
}

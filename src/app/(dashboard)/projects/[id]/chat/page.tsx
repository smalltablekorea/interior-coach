"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Users, Settings } from "lucide-react";
import Link from "next/link";
import ChatMessageList from "@/components/site-chat/ChatMessageList";
import ChatComposer from "@/components/site-chat/ChatComposer";
import RoomSidebar from "@/components/site-chat/RoomSidebar";
import ClientPortalToggle from "@/components/site-chat/ClientPortalToggle";
import { useAuth } from "@/components/auth/AuthProvider";
import type { SiteChatMessage, SiteChatRoom, PinnedSummary } from "@/components/site-chat/types";

export default function SiteChatPage() {
  const { id: roomId } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  const [room, setRoom] = useState<SiteChatRoom | null>(null);
  const [messages, setMessages] = useState<SiteChatMessage[]>([]);
  const [summary, setSummary] = useState<PinnedSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSidebar, setShowSidebar] = useState(true);
  const [reconnecting, setReconnecting] = useState(false);

  // 세션 로딩이 끝났는데도 인증되지 않은 경우 로그인 페이지로 리다이렉트
  // (미들웨어가 1차 방어선이지만 클라이언트에서도 안전장치)
  useEffect(() => {
    if (!authLoading && !user) {
      const callbackUrl = encodeURIComponent(`/projects/${roomId}/chat`);
      router.replace(`/auth/login?callbackUrl=${callbackUrl}`);
    }
  }, [authLoading, user, roomId, router]);

  // Fetch room + messages
  useEffect(() => {
    if (!roomId) return;
    setLoading(true);
    Promise.all([
      fetch(`/api/site-chat/rooms/${roomId}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/site-chat/messages?roomId=${roomId}&limit=50`).then(r => r.ok ? r.json() : { messages: [] }),
    ]).then(([roomData, msgData]) => {
      if (roomData?.room) setRoom(roomData.room);
      if (roomData?.pinnedSummary) setSummary(roomData.pinnedSummary);
      setMessages(msgData?.messages || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [roomId]);

  // SSE Realtime
  useEffect(() => {
    if (!roomId) return;
    let es: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      es = new EventSource(`/api/site-chat/sse?roomId=${roomId}`);
      es.onopen = () => setReconnecting(false);
      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "new_message") {
            setMessages(prev => {
              // 낙관적 업데이트된 메시지 교체
              const existing = prev.find(m => m._optimistic && m.content === data.message.content);
              if (existing) return prev.map(m => m.id === existing.id ? data.message : m);
              return [...prev, data.message];
            });
          } else if (data.type === "summary_update") {
            setSummary(data.summary);
          }
        } catch { /* ignore parse errors */ }
      };
      es.onerror = () => {
        setReconnecting(true);
        es?.close();
        retryTimeout = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => { es?.close(); clearTimeout(retryTimeout); };
  }, [roomId]);

  // Send message
  const handleSend = useCallback(async (text: string, files?: File[]) => {
    if (!roomId) return;
    if (!userId) return; // 인증되지 않은 사용자는 메시지 전송 불가

    // 낙관적 업데이트
    const optimisticMsg: SiteChatMessage = {
      id: `opt-${Date.now()}`,
      roomId,
      senderId: userId,
      senderType: "owner",
      senderDisplayName: "나",
      content: text,
      contentType: files?.length ? "image" : "text",
      replyToId: null,
      metadata: null,
      createdAt: new Date().toISOString(),
      editedAt: null,
      deletedAt: null,
      _optimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // Upload files first if any
      let attachmentIds: string[] = [];
      if (files && files.length > 0) {
        const formData = new FormData();
        formData.append("roomId", roomId);
        files.forEach(f => formData.append("files", f));
        const uploadRes = await fetch("/api/site-chat/upload", { method: "POST", body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          attachmentIds = uploadData.attachmentIds || [];
        }
      }

      const res = await fetch("/api/site-chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomId,
          content: text || null,
          contentType: files?.length ? "image" : "text",
          attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
        }),
      });

      if (!res.ok) {
        // 전송 실패 표시
        setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, _failed: true, _optimistic: false } : m));
      }
    } catch {
      setMessages(prev => prev.map(m => m.id === optimisticMsg.id ? { ...m, _failed: true, _optimistic: false } : m));
    }
  }, [roomId, userId]);

  // Retry failed message
  const handleRetry = useCallback(async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    handleSend(msg.content || "");
  }, [messages, handleSend]);

  const handlePortalToggle = async (enabled: boolean) => {
    if (!room) return;
    await fetch(`/api/site-chat/rooms/${room.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientPortalEnabled: enabled }),
    });
    setRoom(prev => prev ? { ...prev, clientPortalEnabled: enabled } : null);
  };

  if (loading || authLoading || !userId) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[var(--green)]/30 border-t-[var(--green)] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Reconnecting banner */}
      {reconnecting && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-center">
          <span className="text-xs text-amber-400 font-medium">재연결 중...</span>
        </div>
      )}

      {/* Sample room banner */}
      {room?.isSample && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
          <span className="text-xs text-amber-400 font-medium">이건 샘플 현장입니다. 자유롭게 눌러보세요</span>
          <button
            onClick={() => router.push("/sites")}
            className="text-xs font-bold text-[var(--green)] hover:underline"
          >
            내 진짜 현장 만들기
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Link href="/sites" className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[var(--muted)]">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-sm font-bold">{room?.title || "톡방"}</h1>
            {room?.clientPortalEnabled && (
              <span className="text-[9px] text-[var(--green)]">고객 포털 활성</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-lg hover:bg-white/[0.04] text-[var(--muted)]">
            <Users size={16} />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded-lg hover:bg-white/[0.04] ${showSidebar ? "text-[var(--green)]" : "text-[var(--muted)]"}`}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatMessageList
            messages={messages}
            currentUserId={userId}
            onRetry={handleRetry}
          />
          <ChatComposer onSend={handleSend} />
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="w-64 border-l border-[var(--border)] bg-[var(--card)] hidden md:flex flex-col">
            <RoomSidebar
              summary={summary}
              isSample={room?.isSample}
              onCreateRealRoom={() => router.push("/sites")}
            />
            {/* Portal toggle at bottom */}
            <div className="p-4 border-t border-[var(--border)]">
              <ClientPortalToggle
                enabled={room?.clientPortalEnabled || false}
                slug={room?.clientPortalSlug || null}
                onToggle={handlePortalToggle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import type { SiteChatMessage } from "./types";

interface ChatMessageListProps {
  messages: SiteChatMessage[];
  currentUserId: string | null;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  onRetry?: (id: string) => void;
}

export default function ChatMessageList({
  messages,
  currentUserId,
  onLoadMore,
  hasMore,
  loading,
  onRetry,
}: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Infinite scroll — load more when scrolled to top
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onLoadMore || !hasMore) return;

    const handleScroll = () => {
      if (container.scrollTop < 100 && !loading) {
        onLoadMore();
      }
    };
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [onLoadMore, hasMore, loading]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-3"
    >
      {/* Load more indicator */}
      {loading && (
        <div className="flex justify-center py-2">
          <span className="w-5 h-5 border-2 border-[var(--green)]/30 border-t-[var(--green)] rounded-full animate-spin" />
        </div>
      )}

      {hasMore && !loading && (
        <button
          onClick={onLoadMore}
          className="w-full text-center text-xs text-[var(--muted)] hover:text-[var(--foreground)] py-2 transition-colors"
        >
          이전 메시지 더 보기
        </button>
      )}

      {/* Messages */}
      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          message={msg}
          isOwn={msg.senderId === currentUserId}
          onRetry={onRetry}
        />
      ))}

      {/* Empty state */}
      {messages.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-16 text-[var(--muted)]">
          <p className="text-sm">아직 메시지가 없습니다</p>
          <p className="text-xs mt-1">첫 메시지를 보내보세요</p>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}

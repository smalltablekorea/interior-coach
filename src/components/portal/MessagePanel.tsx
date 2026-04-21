"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  senderId: string | null;
  senderType: string;
  senderDisplayName: string;
  content: string | null;
  contentType: string;
  createdAt: string;
}

interface MessagePanelProps {
  messages: Message[];
  onSend: (content: string) => Promise<void>;
  loading: boolean;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h < 12 ? "오전" : "오후";
  const hour = h % 12 || 12;
  return `${ampm} ${hour}:${m}`;
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${days[d.getDay()]})`;
}

export function MessagePanel({ messages, onSend, loading }: MessagePanelProps) {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await onSend(input.trim());
      setInput("");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Group messages by date
  let lastDate = "";

  return (
    <div className="flex flex-col h-[400px]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-3">
        {loading ? (
          <div className="text-center text-gray-400 text-sm py-8">
            메시지를 불러오는 중...
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm py-8">
            아직 메시지가 없습니다.
            <br />
            시공팀에 메시지를 보내보세요!
          </div>
        ) : (
          messages.map((msg) => {
            const msgDate = new Date(msg.createdAt).toDateString();
            let showDateHeader = false;
            if (msgDate !== lastDate) {
              showDateHeader = true;
              lastDate = msgDate;
            }
            const isClient = msg.senderType === "client";

            return (
              <div key={msg.id}>
                {showDateHeader && (
                  <div className="text-center my-3">
                    <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                      {formatDateHeader(msg.createdAt)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isClient ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] ${isClient ? "order-2" : ""}`}>
                    {!isClient && (
                      <p className="text-xs text-gray-500 mb-1 ml-1">
                        {msg.senderDisplayName}
                      </p>
                    )}
                    <div
                      className={`px-3 py-2 rounded-2xl text-sm ${
                        isClient
                          ? "bg-blue-500 text-white rounded-br-md"
                          : "bg-gray-100 text-gray-900 rounded-bl-md"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <p
                      className={`text-[10px] text-gray-400 mt-0.5 ${
                        isClient ? "text-right mr-1" : "ml-1"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="메시지를 입력하세요..."
          className="flex-1 px-4 py-2 rounded-full bg-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

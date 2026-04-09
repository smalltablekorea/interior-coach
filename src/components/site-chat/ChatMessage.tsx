"use client";

import { Camera, File, AlertCircle, RotateCw } from "lucide-react";
import type { SiteChatMessage } from "./types";

const SENDER_STYLES: Record<string, { bg: string; label: string }> = {
  owner: { bg: "bg-[var(--green)]/15 text-[var(--green)]", label: "사장님" },
  team: { bg: "bg-blue-500/15 text-blue-400", label: "팀" },
  partner: { bg: "bg-amber-500/15 text-amber-400", label: "협력사" },
  client: { bg: "bg-purple-500/15 text-purple-400", label: "고객" },
  system: { bg: "", label: "" },
};

interface ChatMessageProps {
  message: SiteChatMessage;
  isOwn: boolean;
  onRetry?: (id: string) => void;
}

export default function ChatMessage({ message, isOwn, onRetry }: ChatMessageProps) {
  const { senderType, senderDisplayName, content, contentType, createdAt, attachments, _optimistic, _failed } = message;

  // System message
  if (senderType === "system" || contentType === "system_event") {
    return (
      <div className="flex justify-center py-1">
        <span className="px-3 py-1 rounded-full bg-white/[0.04] text-[10px] text-[var(--muted)]">
          {content}
        </span>
      </div>
    );
  }

  const style = SENDER_STYLES[senderType] || SENDER_STYLES.team;
  const time = new Date(createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} ${_optimistic ? "opacity-60" : ""}`}>
      <div className={`max-w-[75%] ${isOwn ? "items-end" : "items-start"}`}>
        {/* Sender name */}
        {!isOwn && (
          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold mb-1 ${style.bg}`}>
            {senderDisplayName || style.label}
          </span>
        )}

        {/* Bubble */}
        <div className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
          isOwn
            ? "bg-[var(--green)]/10 text-[var(--foreground)]"
            : senderType === "client"
              ? "bg-purple-500/10 text-[var(--foreground)]"
              : "bg-white/[0.06] text-[var(--foreground)]"
        }`}>
          {/* Image attachment */}
          {contentType === "image" && attachments && attachments.length > 0 ? (
            <div className="space-y-2">
              {attachments.map((att) => (
                <div key={att.id} className="rounded-lg overflow-hidden bg-white/[0.04] flex items-center justify-center min-h-[120px]">
                  {att.thumbnailPath ? (
                    <img src={att.thumbnailPath} alt="시공 사진" className="max-w-full rounded-lg" loading="lazy" />
                  ) : (
                    <div className="flex items-center gap-2 p-4 text-[var(--muted)]">
                      <Camera size={16} />
                      <span className="text-xs">사진</span>
                    </div>
                  )}
                </div>
              ))}
              {content && <p>{content}</p>}
            </div>
          ) : contentType === "file" ? (
            <div className="flex items-center gap-2">
              <File size={14} className="text-[var(--muted)]" />
              <span className="text-xs">{content || "파일 첨부"}</span>
            </div>
          ) : (
            <p className="whitespace-pre-wrap">{content}</p>
          )}
        </div>

        {/* Time + status */}
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[9px] text-[var(--muted)]">{time}</span>
          {_failed && (
            <button
              onClick={() => onRetry?.(message.id)}
              className="flex items-center gap-1 text-[9px] text-red-400 hover:text-red-300"
            >
              <AlertCircle size={10} />
              전송 실패
              <RotateCw size={9} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

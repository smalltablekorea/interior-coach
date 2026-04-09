"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageSquare, Building2, ChevronRight, Globe } from "lucide-react";

interface ChatRoom {
  id: string;
  siteId: string;
  title: string;
  clientPortalSlug: string | null;
  clientPortalEnabled: boolean;
  createdAt: string;
  updatedAt: string;
  progressPercent?: number;
  nextMilestone?: string;
  lastMessage?: string;
}

export default function ChatListPage() {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/site-chat/rooms")
      .then(r => r.ok ? r.json() : { rooms: [] })
      .then(data => { setRooms(data.rooms || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare size={24} className="text-[var(--green)]" />
          <h1 className="text-xl font-bold">현장 톡방</h1>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-2xl animate-shimmer" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[var(--muted)]">
          <MessageSquare size={48} className="mb-4 opacity-30" />
          <p className="text-base font-medium mb-1">톡방이 없습니다</p>
          <p className="text-sm mb-4">현장을 만들면 톡방이 자동 생성됩니다</p>
          <Link
            href="/sites"
            className="px-5 py-2.5 rounded-xl bg-[var(--green)] text-black text-sm font-medium"
          >
            현장 관리로 이동
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {rooms.map(room => (
            <Link
              key={room.id}
              href={`/projects/${room.id}/chat`}
              className="flex items-center gap-4 p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] hover:border-[var(--green)]/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--green)]/10 flex items-center justify-center shrink-0">
                <Building2 size={18} className="text-[var(--green)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold truncate">{room.title}</span>
                  {room.clientPortalEnabled && (
                    <Globe size={12} className="text-[var(--green)] shrink-0" />
                  )}
                </div>
                {room.nextMilestone && (
                  <p className="text-xs text-[var(--muted)] truncate mt-0.5">
                    다음: {room.nextMilestone}
                  </p>
                )}
              </div>
              {room.progressPercent !== undefined && (
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-[var(--green)]">{room.progressPercent}%</span>
                </div>
              )}
              <ChevronRight size={16} className="text-[var(--muted)] shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

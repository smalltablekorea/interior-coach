"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { useSubscription } from "@/hooks/useSubscription";
import PlanBadge from "@/components/subscription/PlanBadge";
import {
  Bell,
  LogOut,
  Moon,
  Search,
  Settings,
  Sun,
  FileText,
  Wallet,
  Hammer,
  Users,
  X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/components/theme/ThemeProvider";
import Link from "next/link";

interface Notification {
  id: string;
  type: "estimate" | "payment" | "construction" | "customer";
  title: string;
  description: string;
  time: string;
  read: boolean;
  href: string;
}

const NOTIF_ICONS = {
  estimate: FileText,
  payment: Wallet,
  construction: Hammer,
  customer: Users,
};

const NOTIF_COLORS = {
  estimate: "var(--blue)",
  payment: "var(--green)",
  construction: "var(--orange)",
  customer: "var(--green)",
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "payment",
    title: "수금 예정 알림",
    description: "강남 아파트 리모델링 중도금 500만원 수금일이 다가옵니다.",
    time: "방금 전",
    read: false,
    href: "/contracts",
  },
  {
    id: "2",
    type: "construction",
    title: "시공 일정 알림",
    description: "마포 오피스텔 목공 공정이 내일 시작 예정입니다.",
    time: "1시간 전",
    read: false,
    href: "/construction",
  },
  {
    id: "3",
    type: "estimate",
    title: "견적서 승인",
    description: "서초 빌라 견적서가 고객에 의해 승인되었습니다.",
    time: "3시간 전",
    read: true,
    href: "/estimates",
  },
  {
    id: "4",
    type: "customer",
    title: "신규 상담 문의",
    description: "송파구 김민수 고객이 인테리어 상담을 요청했습니다.",
    time: "어제",
    read: true,
    href: "/customers",
  },
];

export default function Header() {
  const { user, signOut } = useAuth();
  const { plan } = useSubscription();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const menuRef = useRef<HTMLDivElement>(null);
  const notiRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (notiRef.current && !notiRef.current.contains(e.target as Node)) {
        setNotiOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <header className="h-16 border-b border-[var(--border)] bg-[var(--background)] flex items-center justify-between px-6 sticky top-0 z-30">
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <Search size={18} className="text-[var(--muted)]" />
        <input
          type="text"
          placeholder="검색..."
          className="bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none w-full"
        />
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTheme}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--border)] text-[var(--muted)] transition-colors"
          title={theme === "dark" ? "라이트 모드" : "다크 모드"}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notiRef}>
          <button
            onClick={() => {
              setNotiOpen(!notiOpen);
              setMenuOpen(false);
            }}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-[var(--border)] text-[var(--muted)] transition-colors relative"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--red)] rounded-full text-[10px] text-white font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {notiOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                <h3 className="text-sm font-semibold">알림</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllRead}
                      className="text-xs text-[var(--green)] hover:underline"
                    >
                      모두 읽음
                    </button>
                  )}
                  <button
                    onClick={() => setNotiOpen(false)}
                    className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-[var(--border)] text-[var(--muted)]"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="py-12 text-center text-sm text-[var(--muted)]">
                    알림이 없습니다
                  </div>
                ) : (
                  notifications.map((noti) => {
                    const Icon = NOTIF_ICONS[noti.type];
                    const color = NOTIF_COLORS[noti.type];
                    return (
                      <Link
                        key={noti.id}
                        href={noti.href}
                        onClick={() => {
                          markRead(noti.id);
                          setNotiOpen(false);
                        }}
                        className={`flex gap-3 px-4 py-3 hover:bg-[var(--border)] transition-colors ${
                          !noti.read ? "bg-[var(--card-hover)]" : ""
                        }`}
                      >
                        <div
                          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{ background: `${color}15` }}
                        >
                          <Icon size={16} style={{ color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">
                              {noti.title}
                            </p>
                            {!noti.read && (
                              <span className="w-2 h-2 rounded-full bg-[var(--green)] shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5">
                            {noti.description}
                          </p>
                          <p className="text-[10px] text-[var(--muted)] mt-1">
                            {noti.time}
                          </p>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => {
              setMenuOpen(!menuOpen);
              setNotiOpen(false);
            }}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-[var(--border)] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--green)]/20 flex items-center justify-center text-[var(--green)] text-sm font-medium">
              {user?.name?.charAt(0) || "?"}
            </div>
            <span className="text-sm hidden sm:block">
              {user?.name || "사용자"}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1">
              <div className="px-4 py-2 border-b border-[var(--border)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <PlanBadge plan={plan} />
                </div>
                <p className="text-xs text-[var(--muted)]">{user?.email}</p>
              </div>
              <Link
                href="/settings"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--muted)] hover:bg-[var(--border)] transition-colors"
              >
                <Settings size={16} />
                설정 / 요금제
              </Link>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--red)] hover:bg-[var(--border)] transition-colors"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

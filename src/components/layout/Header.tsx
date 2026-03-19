"use client";

import { useAuth } from "@/components/auth/AuthProvider";
import { Bell, LogOut, Search } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Header() {
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.04] text-[var(--muted)] transition-colors">
          <Bell size={18} />
        </button>

        {/* User Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white/[0.04] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--green)]/20 flex items-center justify-center text-[var(--green)] text-sm font-medium">
              {user?.name?.charAt(0) || "?"}
            </div>
            <span className="text-sm hidden sm:block">{user?.name || "사용자"}</span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-lg py-1">
              <div className="px-4 py-2 border-b border-[var(--border)]">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-[var(--muted)]">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--red)] hover:bg-white/[0.04] transition-colors"
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

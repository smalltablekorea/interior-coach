"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";
import {
  Users,
  UserPlus,
  Shield,
  Trash2,
  Copy,
  Check,
  X,
  Loader2,
  Mail,
  Link2,
} from "lucide-react";
import { isRoleAtLeast, type WorkspaceRole } from "@/lib/workspace/permissions";

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  name: string;
  email: string;
  image: string | null;
}

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "관리자",
  manager: "매니저",
  member: "멤버",
  viewer: "뷰어",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "var(--green)",
  admin: "var(--blue)",
  manager: "var(--orange)",
  member: "var(--foreground)",
  viewer: "var(--muted)",
};

export default function WorkspaceMembersPage() {
  const { workspace } = useWorkspace();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [error, setError] = useState("");

  const myRole = (workspace?.myRole || "member") as WorkspaceRole;
  const canManage = isRoleAtLeast(myRole, "admin");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch("/api/workspace/members");
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      setMembers(data.members || []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleRoleChange = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch("/api/workspace/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "역할 변경 실패");
        return;
      }
      fetchMembers();
    } catch {
      alert("역할 변경 실패");
    }
  };

  const handleRemove = async (memberId: string, memberName: string) => {
    if (!confirm(`${memberName}님을 워크스페이스에서 제거하시겠습니까?`)) return;
    try {
      const res = await fetch("/api/workspace/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "멤버 제거 실패");
        return;
      }
      fetchMembers();
    } catch {
      alert("멤버 제거 실패");
    }
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setError("");
    try {
      const res = await fetch("/api/workspace/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteEmail("");
      setInviteOpen(false);
      alert("초대가 생성되었습니다.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "초대 실패");
    } finally {
      setInviteLoading(false);
    }
  };

  const copyInviteCode = () => {
    if (workspace?.inviteCode) {
      navigator.clipboard.writeText(workspace.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users size={24} />
            멤버 관리
          </h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            {workspace?.name} - {members.length}/{workspace?.maxMembers}명
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setInviteOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--green)] text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            <UserPlus size={16} />
            초대하기
          </button>
        )}
      </div>

      {/* Invite Code Card */}
      {canManage && workspace?.inviteCode && (
        <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link2 size={18} className="text-[var(--muted)]" />
              <div>
                <p className="text-sm font-medium">초대코드</p>
                <p className="text-xs text-[var(--muted)]">이 코드를 공유하면 누구나 참여할 수 있습니다</p>
              </div>
            </div>
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-sm font-mono tracking-widest hover:bg-[var(--border)] transition-all"
            >
              {workspace.inviteCode}
              {codeCopied ? <Check size={14} className="text-[var(--green)]" /> : <Copy size={14} className="text-[var(--muted)]" />}
            </button>
          </div>
        </div>
      )}

      {/* Members List */}
      <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={24} className="animate-spin mx-auto text-[var(--muted)]" />
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {members.map((member) => (
              <div key={member.id} className="flex items-center gap-4 px-6 py-4">
                <div className="w-10 h-10 rounded-full bg-[var(--green)]/20 flex items-center justify-center text-[var(--green)] font-medium shrink-0">
                  {member.name?.charAt(0) || "?"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{member.name}</p>
                  <p className="text-xs text-[var(--muted)]">{member.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {canManage && member.role !== "owner" ? (
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.id, e.target.value)}
                      className="text-xs px-2 py-1 rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                    >
                      <option value="admin">관리자</option>
                      <option value="manager">매니저</option>
                      <option value="member">멤버</option>
                      <option value="viewer">뷰어</option>
                    </select>
                  ) : (
                    <span
                      className="text-xs font-medium px-2 py-1 rounded-lg"
                      style={{ color: ROLE_COLORS[member.role] }}
                    >
                      <Shield size={12} className="inline mr-1" />
                      {ROLE_LABELS[member.role] || member.role}
                    </span>
                  )}
                  {canManage && member.role !== "owner" && (
                    <button
                      onClick={() => handleRemove(member.id, member.name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/10 text-[var(--muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--card)] rounded-2xl border border-[var(--border)] w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Mail size={18} />
                멤버 초대
              </h2>
              <button onClick={() => setInviteOpen(false)} className="text-[var(--muted)] hover:text-[var(--foreground)]">
                <X size={18} />
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">이메일</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none focus:ring-2 focus:ring-[var(--green)]/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">역할</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]"
                >
                  <option value="admin">관리자 - 전체 접근</option>
                  <option value="manager">매니저 - 읽기/쓰기</option>
                  <option value="member">멤버 - 기본 접근</option>
                  <option value="viewer">뷰어 - 읽기 전용</option>
                </select>
              </div>
              <button
                onClick={handleInvite}
                disabled={inviteLoading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[var(--green)] text-white font-medium hover:opacity-90 transition-all disabled:opacity-50"
              >
                {inviteLoading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                초대 보내기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

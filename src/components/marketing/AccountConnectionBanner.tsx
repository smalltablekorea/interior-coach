"use client";

import { useState, useEffect, useCallback } from "react";
import { Link2, Unlink, Loader2, CheckCircle2, AlertCircle, RefreshCw, ExternalLink } from "lucide-react";

type ConnectionType = "oauth_meta" | "oauth_google" | "credentials" | "api_key" | "blog";

interface ConnectionState {
  connected: boolean;
  accountName?: string | null;
  accountId?: string | null;
  hasToken?: boolean;
  tokenExpiresAt?: string | null;
  isActive?: boolean;
  lastSyncAt?: string | null;
}

interface AccountConnectionBannerProps {
  channel: string;
  channelLabel: string;
  channelIcon: string;
  connectionType: ConnectionType;
  onConnectionChange?: (connected: boolean, data?: ConnectionState) => void;
}

const OAUTH_PROVIDERS: Record<string, string> = {
  oauth_meta: "meta",
  oauth_google: "google",
};

const CONNECT_BUTTON_STYLES: Record<ConnectionType, { bg: string; label: string }> = {
  oauth_meta: { bg: "bg-[#1877F2]", label: "Meta 계정으로 로그인" },
  oauth_google: { bg: "bg-[#EA4335]", label: "Google 계정으로 로그인" },
  credentials: { bg: "bg-[var(--green)]", label: "계정 연결" },
  api_key: { bg: "bg-[var(--green)]", label: "API 연결" },
  blog: { bg: "bg-[#03C75A]", label: "블로그 연결" },
};

export default function AccountConnectionBanner({
  channel,
  channelLabel,
  channelIcon,
  connectionType,
  onConnectionChange,
}: AccountConnectionBannerProps) {
  const [connection, setConnection] = useState<ConnectionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form fields for credentials/api_key/blog
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");
  const [field3, setField3] = useState("");

  const fetchConnection = useCallback(async () => {
    try {
      let url: string;
      if (connectionType === "credentials") {
        url = `/api/marketing/${channel}/connect`;
      } else if (connectionType === "api_key") {
        url = `/api/marketing/${channel}/connect`;
      } else if (connectionType === "blog") {
        url = `/api/marketing/${channel}/connect`;
      } else {
        url = `/api/marketing/channels?channel=${channel}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const conn: ConnectionState = {
          connected: data?.connected ?? data?.hasToken ?? data?.isActive ?? false,
          accountName: data?.accountName,
          accountId: data?.accountId,
          hasToken: data?.hasToken,
          tokenExpiresAt: data?.tokenExpiresAt,
          isActive: data?.isActive,
          lastSyncAt: data?.lastSyncAt,
        };
        setConnection(conn);
        onConnectionChange?.(conn.connected, conn);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [channel, connectionType, onConnectionChange]);

  useEffect(() => {
    fetchConnection();
    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    if (params.get("oauth_success") === "true") {
      fetchConnection();
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [fetchConnection]);

  const handleDisconnect = async () => {
    setSubmitting(true);
    try {
      if (connectionType === "credentials" || connectionType === "api_key" || connectionType === "blog") {
        await fetch(`/api/marketing/${channel}/connect`, { method: "DELETE" });
      } else {
        await fetch("/api/marketing/channels", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ channel }),
        });
      }
      const newConn = { connected: false };
      setConnection(newConn);
      onConnectionChange?.(false);
      setFormOpen(false);
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefreshToken = async () => {
    setSubmitting(true);
    try {
      await fetch("/api/marketing/oauth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
      await fetchConnection();
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      let body: Record<string, string>;
      if (connectionType === "credentials") {
        body = { adlogId: field1, adlogPassword: field2 };
      } else if (connectionType === "api_key") {
        body = { apiKey: field1, apiSecret: field2, senderPhone: field3 };
      } else {
        body = { blogId: field1, blogUrl: field2 };
      }
      const res = await fetch(`/api/marketing/${channel}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "연결에 실패했습니다");
        return;
      }
      const conn: ConnectionState = { connected: true, accountName: data.accountName };
      setConnection(conn);
      onConnectionChange?.(true, conn);
      setFormOpen(false);
      setField1("");
      setField2("");
      setField3("");
    } catch {
      setError("연결 중 오류가 발생했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-4 mb-6 animate-pulse">
        <div className="h-10 bg-white/[0.04] rounded-lg" />
      </div>
    );
  }

  // ─── Connected State ───
  if (connection?.connected) {
    return (
      <div className="rounded-2xl border border-[var(--green)]/20 bg-[var(--green)]/[0.04] p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{channelIcon}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">{connection.accountName || channelLabel}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--green)]/15 text-[var(--green)] text-xs font-medium">
                  <CheckCircle2 size={10} /> 연결됨
                </span>
              </div>
              {connection.tokenExpiresAt && (
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  토큰 만료: {new Date(connection.tokenExpiresAt).toLocaleDateString("ko-KR")}
                </p>
              )}
              {connection.lastSyncAt && (
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  마지막 동기화: {new Date(connection.lastSyncAt).toLocaleDateString("ko-KR")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(connectionType === "oauth_meta" || connectionType === "oauth_google") && (
              <button
                onClick={handleRefreshToken}
                disabled={submitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--muted)] hover:bg-white/[0.04] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={12} /> 토큰 갱신
              </button>
            )}
            <button
              onClick={handleDisconnect}
              disabled={submitting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-xs text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {submitting ? <Loader2 size={12} className="animate-spin" /> : <Unlink size={12} />}
              연결 해제
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Not Connected State ───
  const style = CONNECT_BUTTON_STYLES[connectionType];

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-5 mb-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-2xl">{channelIcon}</span>
        <div>
          <p className="font-semibold text-sm">{channelLabel} 계정을 연결해주세요</p>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            계정을 연결하면 콘텐츠 발행, 분석 등 모든 기능을 사용할 수 있습니다.
          </p>
        </div>
      </div>

      {/* OAuth buttons */}
      {(connectionType === "oauth_meta" || connectionType === "oauth_google") && (
        <a
          href={`/api/marketing/oauth/${OAUTH_PROVIDERS[connectionType]}?channel=${channel}`}
          className={`inline-flex items-center gap-2 ${style.bg} text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:brightness-110 transition-all`}
        >
          <ExternalLink size={14} />
          {style.label}
        </a>
      )}

      {/* Credential / API Key / Blog forms */}
      {(connectionType === "credentials" || connectionType === "api_key" || connectionType === "blog") && (
        <>
          {!formOpen ? (
            <button
              onClick={() => setFormOpen(true)}
              className={`inline-flex items-center gap-2 ${style.bg} text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:brightness-110 transition-all`}
            >
              <Link2 size={14} />
              {style.label}
            </button>
          ) : (
            <form onSubmit={handleCredentialSubmit} className="space-y-3 mt-3 max-w-md">
              {connectionType === "credentials" && (
                <>
                  <input
                    type="text"
                    value={field1}
                    onChange={(e) => setField1(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="아이디"
                    required
                  />
                  <input
                    type="password"
                    value={field2}
                    onChange={(e) => setField2(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="비밀번호"
                    required
                  />
                </>
              )}
              {connectionType === "api_key" && (
                <>
                  <input
                    type="text"
                    value={field1}
                    onChange={(e) => setField1(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="API Key"
                    required
                  />
                  <input
                    type="password"
                    value={field2}
                    onChange={(e) => setField2(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="API Secret"
                    required
                  />
                  <input
                    type="tel"
                    value={field3}
                    onChange={(e) => setField3(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="발신번호 (예: 01012345678)"
                    required
                  />
                </>
              )}
              {connectionType === "blog" && (
                <>
                  <input
                    type="text"
                    value={field1}
                    onChange={(e) => setField1(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="블로그 ID (예: myblog)"
                    required
                  />
                  <input
                    type="url"
                    value={field2}
                    onChange={(e) => setField2(e.target.value)}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm outline-none focus:border-[var(--green)] transition-colors"
                    placeholder="블로그 URL (예: https://blog.naver.com/myblog)"
                  />
                </>
              )}
              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-[var(--green)] text-black px-5 py-2.5 rounded-xl text-sm font-medium hover:brightness-110 transition disabled:opacity-50"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
                  연결
                </button>
                <button
                  type="button"
                  onClick={() => { setFormOpen(false); setError(""); }}
                  className="px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:bg-white/[0.04] transition-colors"
                >
                  취소
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
}

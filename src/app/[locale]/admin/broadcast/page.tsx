"use client";

import { useState } from "react";
import { Megaphone, Send, AlertTriangle, CheckCircle2, ExternalLink } from "lucide-react";

interface BroadcastResult {
  sent: number;
  skipped: number;
  total: number;
}

const PRESETS: Array<{
  label: string;
  title: string;
  message: string;
  link: string;
  type: string;
}> = [
  {
    label: "7/31 전면 무료 안내",
    title: "🎉 7월 31일까지 전체 기능 무료",
    message: "결제 없이 모든 Pro 기능을 사용해보세요. 마감 후 자동으로 무료 플랜으로 전환됩니다.",
    link: "/pricing",
    type: "system",
  },
  {
    label: "신기능 업데이트",
    title: "🚀 새 기능이 추가됐어요",
    message: "이번 업데이트에서 추가된 기능을 확인해 보세요.",
    link: "/dashboard",
    type: "info",
  },
  {
    label: "데모 신청 안내",
    title: "💬 1:1 데모 신청 받습니다",
    message: "도입 검토 중이시면 30분 라이브 데모를 신청해주세요.",
    link: "/demo-request",
    type: "marketing",
  },
];

export default function AdminBroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [type, setType] = useState("system");
  const [dedupe, setDedupe] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<BroadcastResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  function loadPreset(preset: (typeof PRESETS)[number]) {
    setTitle(preset.title);
    setMessage(preset.message);
    setLink(preset.link);
    setType(preset.type);
    setResult(null);
    setError(null);
  }

  async function send() {
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim() || null,
          link: link.trim() || null,
          type,
          dedupeKey: dedupe ? `${type}:${title.trim()}` : null,
        }),
      });
      const j = await res.json();
      if (!res.ok) {
        setError(j?.error || `발송 실패 (${res.status})`);
        return;
      }
      setResult((j?.data ?? j) as BroadcastResult);
      setConfirmOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "네트워크 오류");
    } finally {
      setSending(false);
    }
  }

  const canSubmit = title.trim().length > 0 && title.trim().length <= 200;

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-1">공지 발송</h1>
      <p className="text-sm text-[var(--muted)] mb-6">
        가입자 전원에게 인앱 알림 발송 · 중복 방지 옵션 지원
      </p>

      {/* 프리셋 */}
      <div className="mb-6">
        <div className="text-xs text-[var(--muted)] mb-2">자주 쓰는 템플릿</div>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              onClick={() => loadPreset(p)}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] text-xs hover:bg-[var(--card)] transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 폼 */}
      <div className="space-y-4 mb-6">
        <Field label={`제목 (${title.length}/200)`} required>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            placeholder="예: 🎉 7월 31일까지 전체 기능 무료"
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
          />
        </Field>

        <Field label="본문 (선택)">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="알림 본문 — 비워두면 제목만 표시됩니다."
            className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="이동 링크 (선택)">
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/pricing 또는 https://..."
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm font-mono"
            />
          </Field>

          <Field label="타입">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              <option value="system">시스템 공지</option>
              <option value="info">정보 안내</option>
              <option value="marketing">마케팅</option>
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dedupe}
            onChange={(e) => setDedupe(e.target.checked)}
            className="w-4 h-4 rounded"
          />
          <span className="text-sm">
            중복 발송 방지 — 같은 제목+타입의 알림을 이미 받은 사용자는 자동 제외
          </span>
        </label>
      </div>

      {/* 미리보기 */}
      {title && (
        <div className="mb-6">
          <div className="text-xs text-[var(--muted)] mb-2">사용자에게 보일 알림 미리보기</div>
          <div className="p-4 rounded-xl border border-[var(--border)] bg-[var(--card)]">
            <div className="font-semibold mb-1">{title}</div>
            {message && <div className="text-sm text-[var(--muted)] whitespace-pre-wrap">{message}</div>}
            {link && (
              <div className="mt-2 text-xs text-[var(--green)] flex items-center gap-1">
                <ExternalLink size={11} />
                {link}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 결과 / 에러 */}
      {result && (
        <div className="mb-6 p-4 rounded-xl border border-[var(--green)]/30 bg-[var(--green)]/5">
          <div className="flex items-center gap-2 font-semibold text-[var(--green)] mb-2">
            <CheckCircle2 size={16} />
            발송 완료
          </div>
          <div className="text-sm space-y-1">
            <div>전체 사용자: <span className="font-mono">{result.total}</span>명</div>
            <div className="text-[var(--green)]">발송: <span className="font-mono">{result.sent}</span>명</div>
            {result.skipped > 0 && (
              <div className="text-[var(--muted)]">중복 제외: <span className="font-mono">{result.skipped}</span>명</div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 rounded-xl border border-red-500/30 bg-red-500/5 flex items-start gap-2 text-red-300">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* 발송 버튼 */}
      <button
        onClick={() => setConfirmOpen(true)}
        disabled={!canSubmit || sending}
        className="px-5 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm hover:bg-[var(--green-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <Megaphone size={16} />
        가입자 전원에게 발송
      </button>

      {/* 발송 확인 모달 */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={20} className="text-amber-400" />
              <h3 className="text-lg font-semibold">발송 확인</h3>
            </div>
            <div className="text-sm text-[var(--muted)] mb-5 space-y-2">
              <p>
                <span className="font-semibold text-[var(--foreground)]">가입자 전원</span>에게 인앱 알림이 발송됩니다.
              </p>
              <p>실수로 발송된 알림은 사용자별로 따로 삭제할 수 없습니다. 한 번 더 검토해주세요.</p>
              {dedupe && (
                <p className="text-xs text-[var(--green)]">
                  ✓ 중복 방지 활성 — 같은 알림 받은 사람은 자동 제외
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={send}
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--green)] text-black font-medium text-sm disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? (
                  "발송 중..."
                ) : (
                  <>
                    <Send size={14} />
                    발송
                  </>
                )}
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                disabled={sending}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--border)] text-sm disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({
  label, required, children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-[var(--muted)] mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

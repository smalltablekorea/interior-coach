"use client";

import { useState } from "react";
import { Globe, Copy, Check, QrCode, ExternalLink } from "lucide-react";

interface ClientPortalToggleProps {
  enabled: boolean;
  slug: string | null;
  onToggle: (enabled: boolean) => void;
}

export default function ClientPortalToggle({ enabled, slug, onToggle }: ClientPortalToggleProps) {
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const portalUrl = slug ? `${typeof window !== "undefined" ? window.location.origin : ""}/p/${slug}` : null;

  const handleCopy = async () => {
    if (!portalUrl) return;
    await navigator.clipboard.writeText(portalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe size={14} className={enabled ? "text-[var(--green)]" : "text-[var(--muted)]"} />
          <span className="text-xs font-medium">고객 포털</span>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? "bg-[var(--green)]" : "bg-white/[0.1]"}`}
        >
          <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "left-5.5 translate-x-0" : "left-0.5"}`}
            style={{ left: enabled ? "22px" : "2px" }}
          />
        </button>
      </div>

      {/* Portal URL */}
      {enabled && portalUrl && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <input
              readOnly
              value={portalUrl}
              className="flex-1 px-2.5 py-1.5 rounded-lg bg-white/[0.04] border border-[var(--border)] text-[10px] text-[var(--muted)] truncate"
            />
            <button
              onClick={handleCopy}
              className="shrink-0 p-1.5 rounded-lg border border-[var(--border)] hover:bg-white/[0.04] transition-colors"
              title="URL 복사"
            >
              {copied ? <Check size={12} className="text-[var(--green)]" /> : <Copy size={12} className="text-[var(--muted)]" />}
            </button>
            <button
              onClick={() => setShowQR(!showQR)}
              className="shrink-0 p-1.5 rounded-lg border border-[var(--border)] hover:bg-white/[0.04] transition-colors"
              title="QR 코드"
            >
              <QrCode size={12} className="text-[var(--muted)]" />
            </button>
          </div>

          {/* QR placeholder */}
          {showQR && (
            <div className="p-4 rounded-xl bg-white flex items-center justify-center">
              <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 text-xs">
                QR Code
              </div>
            </div>
          )}

          {/* Open in new tab */}
          <a
            href={portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] text-[var(--green)] hover:underline"
          >
            <ExternalLink size={10} />
            포털 미리보기
          </a>

          <p className="text-[9px] text-[var(--muted)]">
            이 링크를 고객에게 공유하면 로그인 없이 진행 상황을 볼 수 있습니다
          </p>
        </div>
      )}
    </div>
  );
}

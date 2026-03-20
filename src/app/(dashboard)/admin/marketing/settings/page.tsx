"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Settings,
  Link2,
  Shield,
  Bell,
  BarChart3,
  Lock,
  ExternalLink,
  Check,
  X as XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelConfig {
  id: string;
  label: string;
  isConnected: boolean;
  configUrl: string;
}

interface SendPolicy {
  nightSendBlock: { enabled: boolean; start: string; end: string };
  maxSendPerUser: { daily: number; weekly: number; monthly: number };
  dedupeWindow: number;
  globalDailyLimit: number;
}

interface DefaultUtm {
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}

interface Notifications {
  slackWebhook: string;
  emailAlerts: boolean;
  alertThresholds: {
    conversionDropPercent: number;
    paymentFailurePercent: number;
    uploadFailurePercent: number;
  };
}

interface Privacy {
  consentRequired: boolean;
  consentText: string;
  dataRetentionDays: number;
  rightToDelete: boolean;
  privacyPolicyUrl: string;
}

interface SettingsData {
  channels: ChannelConfig[];
  sendPolicy: SendPolicy;
  defaultUtm: DefaultUtm;
  notifications: Notifications;
  leadScoring: Record<string, number>;
  privacy: Privacy;
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/marketing/settings")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16 text-[var(--muted)]">
        <Settings size={32} className="mx-auto mb-2" />
        <p className="text-sm">설정을 불러올 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Channel Connections */}
      <section>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
          <Link2 size={14} /> 채널 연동 상태
        </h3>
        <div className="grid gap-2">
          {data.channels.map((ch) => (
            <div
              key={ch.id}
              className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]"
            >
              <div className="flex items-center gap-2">
                {ch.isConnected ? (
                  <Check size={14} className="text-[var(--green)]" />
                ) : (
                  <XIcon size={14} className="text-[var(--red)]" />
                )}
                <span className="text-sm">{ch.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px]",
                    ch.isConnected
                      ? "bg-[var(--green)]/10 text-[var(--green)]"
                      : "bg-[var(--red)]/10 text-[var(--red)]"
                  )}
                >
                  {ch.isConnected ? "연결됨" : "미연결"}
                </span>
              </div>
              <a
                href={ch.configUrl}
                className="p-1.5 rounded-lg hover:bg-white/[0.06]"
              >
                <ExternalLink size={14} className="text-[var(--muted)]" />
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Send Policy */}
      <section>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
          <Shield size={14} /> 발송 제한 정책
        </h3>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3">
          <PolicyRow
            label="야간 발송 금지"
            value={
              data.sendPolicy.nightSendBlock.enabled
                ? `${data.sendPolicy.nightSendBlock.start} ~ ${data.sendPolicy.nightSendBlock.end}`
                : "비활성"
            }
            active={data.sendPolicy.nightSendBlock.enabled}
          />
          <PolicyRow
            label="일일 최대 발송"
            value={`${data.sendPolicy.maxSendPerUser.daily}회 / 유저`}
          />
          <PolicyRow
            label="주간 최대 발송"
            value={`${data.sendPolicy.maxSendPerUser.weekly}회 / 유저`}
          />
          <PolicyRow
            label="월간 최대 발송"
            value={`${data.sendPolicy.maxSendPerUser.monthly}회 / 유저`}
          />
          <PolicyRow
            label="중복 발송 제한"
            value={`${data.sendPolicy.dedupeWindow}시간`}
          />
          <PolicyRow
            label="전역 일일 한도"
            value={`${data.sendPolicy.globalDailyLimit.toLocaleString()}건`}
          />
        </div>
      </section>

      {/* UTM Rules */}
      <section>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
          <BarChart3 size={14} /> 기본 UTM 규칙
        </h3>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <UtmRow label="Source" value={data.defaultUtm.source} />
            <UtmRow label="Medium" value={data.defaultUtm.medium} />
            <UtmRow label="Campaign" value={data.defaultUtm.campaign} />
            <UtmRow label="Content" value={data.defaultUtm.content} />
            <UtmRow label="Term" value={data.defaultUtm.term || "-"} />
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
          <Bell size={14} /> 운영자 알림
        </h3>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3">
          <PolicyRow
            label="Slack Webhook"
            value={data.notifications.slackWebhook}
            active={data.notifications.slackWebhook === "연결됨"}
          />
          <PolicyRow
            label="이메일 알림"
            value={data.notifications.emailAlerts ? "활성" : "비활성"}
            active={data.notifications.emailAlerts}
          />
          <div className="pt-2 border-t border-[var(--border)]">
            <p className="text-[10px] text-[var(--muted)] mb-2">이상 감지 임계값</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--red)]/10 text-[var(--red)]">
                전환율 {data.notifications.alertThresholds.conversionDropPercent}%↓
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[var(--orange)]/10 text-[var(--orange)]">
                결제 실패 {data.notifications.alertThresholds.paymentFailurePercent}%↑
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-yellow-500/10 text-yellow-400">
                업로드 실패 {data.notifications.alertThresholds.uploadFailurePercent}%↑
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Scoring Rules */}
      <section>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
          <BarChart3 size={14} /> 리드 점수 규칙
        </h3>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)]">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
            {Object.entries(data.leadScoring).map(([key, score]) => (
              <div
                key={key}
                className="flex items-center justify-between py-1 text-sm"
              >
                <span className="text-[var(--muted)] text-xs">{key}</span>
                <span
                  className={cn(
                    "font-medium text-xs tabular-nums",
                    score > 0
                      ? "text-[var(--green)]"
                      : score < 0
                      ? "text-[var(--red)]"
                      : ""
                  )}
                >
                  {score > 0 ? `+${score}` : score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy */}
      <section>
        <h3 className="text-sm font-medium flex items-center gap-1.5 mb-3">
          <Lock size={14} /> 개인정보 / 동의
        </h3>
        <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] space-y-3">
          <PolicyRow
            label="동의 필수"
            value={data.privacy.consentRequired ? "예" : "아니오"}
            active={data.privacy.consentRequired}
          />
          <PolicyRow
            label="동의 문구"
            value={data.privacy.consentText}
          />
          <PolicyRow
            label="데이터 보존"
            value={`${data.privacy.dataRetentionDays}일`}
          />
          <PolicyRow
            label="삭제 요청 권리"
            value={data.privacy.rightToDelete ? "보장" : "미보장"}
            active={data.privacy.rightToDelete}
          />
          <PolicyRow
            label="개인정보 처리방침"
            value={data.privacy.privacyPolicyUrl}
          />
        </div>
      </section>
    </div>
  );
}

function PolicyRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <span
        className={cn(
          "font-medium",
          active === true
            ? "text-[var(--green)]"
            : active === false
            ? "text-[var(--red)]"
            : ""
        )}
      >
        {value}
      </span>
    </div>
  );
}

function UtmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-xs text-[var(--muted)]">{label}</span>
      <code className="text-xs bg-white/[0.06] px-1.5 py-0.5 rounded">
        {value}
      </code>
    </div>
  );
}

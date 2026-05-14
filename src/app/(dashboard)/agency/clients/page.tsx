"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Copy, Check, ExternalLink } from "lucide-react";

interface AgencyClient {
  id: string;
  businessName: string;
  contactPerson: string | null;
  contactPhone: string | null;
  contractStart: string | null;
  contractMonths: number;
  monthlyPrice: number;
  status: string;
  createdAt: string;
}

interface CreateResult {
  client: AgencyClient;
  portalUrl: string;
  alimtalk: { template: string; to: string; body: string };
}

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function AgencyClientsPage() {
  const [clients, setClients] = useState<AgencyClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<CreateResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/agency/clients");
      const j = await r.json();
      setClients(j.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submit = async (form: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        businessName: form.get("businessName"),
        contactPerson: form.get("contactPerson"),
        contactPhone: form.get("contactPhone"),
        contactEmail: form.get("contactEmail"),
        contractStart: form.get("contractStart"),
        contractMonths: Number(form.get("contractMonths") || 3),
        monthlyPrice: Number(form.get("monthlyPrice") || 300000),
      };
      const r = await fetch("/api/agency/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "등록 실패");
      setLastCreated(j);
      setFormOpen(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSubmitting(false);
    }
  };

  const copyUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">클라이언트</h1>
          <p className="text-sm text-[var(--muted)] mt-1">대행 계약 인테리어 업체 목록</p>
        </div>
        <button
          onClick={() => {
            setFormOpen((v) => !v);
            setLastCreated(null);
          }}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm bg-[var(--green)] text-white hover:opacity-90"
        >
          <Plus size={16} /> 신규 클라이언트
        </button>
      </header>

      {error && (
        <div className="p-3 rounded-xl border border-red-300 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {lastCreated && (
        <div className="p-5 rounded-2xl border border-[var(--green)]/40 bg-[var(--green)]/5 space-y-3">
          <h3 className="font-semibold text-sm">
            ✓ "{lastCreated.client.businessName}" 등록 완료. 포털 URL이 발급되었습니다.
          </h3>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 rounded-lg bg-white border border-[var(--border)] text-xs break-all">
              {lastCreated.portalUrl}
            </code>
            <button
              onClick={() => copyUrl(lastCreated.portalUrl)}
              className="px-3 py-2 rounded-lg bg-[var(--green)] text-white text-xs inline-flex items-center gap-1"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "복사됨" : "복사"}
            </button>
            <a
              href={lastCreated.portalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 rounded-lg border border-[var(--border)] text-xs inline-flex items-center gap-1"
            >
              <ExternalLink size={14} /> 열기
            </a>
          </div>
          <details className="text-xs">
            <summary className="cursor-pointer text-[var(--muted)]">알림톡 발송 결과 (mock)</summary>
            <pre className="mt-2 p-3 rounded-lg bg-white border border-[var(--border)] whitespace-pre-wrap">
              [{lastCreated.alimtalk.template}] → {lastCreated.alimtalk.to}
              {"\n"}
              {lastCreated.alimtalk.body}
            </pre>
          </details>
          <Link
            href={`/agency/clients/${lastCreated.client.id}/onboarding`}
            className="inline-block text-sm text-[var(--green)] underline"
          >
            온보딩 상세 정보 입력 →
          </Link>
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(new FormData(e.currentTarget));
          }}
          className="p-5 rounded-2xl border border-[var(--border)] space-y-3"
        >
          <h3 className="font-semibold text-sm">신규 클라이언트 등록</h3>
          <p className="text-xs text-[var(--muted)]">
            기본 정보만 입력하면 포털 URL이 자동 발급됩니다. 브랜드 톤·과거 시공 사례는 등록 후 온보딩 탭에서.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="업체명 *" name="businessName" required placeholder="OO인테리어" />
            <Field label="대표자" name="contactPerson" placeholder="홍길동" />
            <Field label="연락처" name="contactPhone" placeholder="010-0000-0000" />
            <Field label="이메일" name="contactEmail" type="email" placeholder="biz@example.com" />
            <Field label="약정 시작일 *" name="contractStart" type="date" required defaultValue={todayYmd()} />
            <Field label="약정 개월수" name="contractMonths" type="number" defaultValue="3" min="1" />
            <Field label="월 단가 (원)" name="monthlyPrice" type="number" defaultValue="300000" min="0" />
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-[var(--green)] text-white text-sm disabled:opacity-50"
            >
              {submitting ? "등록 중..." : "등록 + 포털 URL 발급"}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm"
            >
              취소
            </button>
          </div>
        </form>
      )}

      <section className="rounded-2xl border border-[var(--border)] overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-[var(--muted)]">불러오는 중…</div>
        ) : clients.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-[var(--muted)] mb-2">아직 등록된 클라이언트가 없습니다.</p>
            <p className="text-xs text-[var(--muted)]">
              위 "신규 클라이언트" 버튼을 눌러 첫 클라이언트를 등록하세요. (베타: 본인을 dogfooding으로 등록 가능)
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[var(--sidebar)] text-xs text-[var(--muted)]">
              <tr>
                <th className="text-left px-4 py-3">업체명</th>
                <th className="text-left px-4 py-3">대표</th>
                <th className="text-left px-4 py-3">약정</th>
                <th className="text-left px-4 py-3">월 단가</th>
                <th className="text-left px-4 py-3">상태</th>
                <th className="text-right px-4 py-3">탐색</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {clients.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3 font-medium">{c.businessName}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{c.contactPerson || "—"}</td>
                  <td className="px-4 py-3 text-[var(--muted)]">
                    {c.contractStart || "—"} · {c.contractMonths}개월
                  </td>
                  <td className="px-4 py-3 text-[var(--muted)]">{c.monthlyPrice.toLocaleString()}원</td>
                  <td className="px-4 py-3 text-[var(--muted)]">{c.status}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/agency/clients/${c.id}/onboarding`}
                      className="text-[var(--green)] underline text-xs mr-3"
                    >
                      온보딩
                    </Link>
                    <Link
                      href={`/agency/clients/${c.id}/uploads`}
                      className="text-[var(--green)] underline text-xs"
                    >
                      업로드
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
  placeholder,
  defaultValue,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  min?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs text-[var(--muted)] mb-1">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        min={min}
        className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-white text-sm"
      />
    </label>
  );
}

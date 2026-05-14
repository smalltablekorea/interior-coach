"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";

type Status = "idle" | "submitting" | "success" | "error";

export default function DemoRequestForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [form, setForm] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    sites: "1-3",
    message: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    // 백엔드 엔드포인트가 아직 없음 — 콘솔 로그로 기록. 이후 /api/demo-request로 연결.
    try {
      console.info("[demo-request] submission", form);
      await new Promise((r) => setTimeout(r, 600));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="rounded-3xl border border-[var(--green)]/40 bg-[var(--green)]/5 p-8 md:p-10 text-center">
        <CheckCircle2
          size={48}
          className="text-[var(--green)] mx-auto mb-4"
          aria-hidden
        />
        <h2 className="text-xl md:text-2xl font-bold">데모 신청 완료</h2>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          하루 안에 담당자가 연락드립니다.
          <br />
          편하신 시간 알려주시면 맞춰드릴게요.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 p-6 md:p-8 rounded-3xl border border-[var(--border)] bg-[var(--sidebar)]"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="이름"
          required
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <Field
          label="업체명"
          required
          value={form.company}
          onChange={(v) => setForm({ ...form, company: v })}
        />
        <Field
          label="연락처"
          type="tel"
          required
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder="010-0000-0000"
        />
        <Field
          label="이메일"
          type="email"
          required
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
          현재 운영 현장 수
        </label>
        <select
          value={form.sites}
          onChange={(e) => setForm({ ...form, sites: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
          aria-label="현재 운영 현장 수"
        >
          <option value="1-3">1~3개</option>
          <option value="4-10">4~10개</option>
          <option value="11-30">11~30개</option>
          <option value="30+">30개 이상</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
          특별히 해결하고 싶은 것 (선택)
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={4}
          placeholder="예: 엑셀 공정표 대체, 고객 응대 자동화…"
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        aria-label="데모 신청 제출"
        className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--green)] text-black font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {status === "submitting" ? (
          "전송 중..."
        ) : (
          <>
            데모 신청 제출 <Send size={16} />
          </>
        )}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-400 text-center">
          전송에 실패했습니다. 잠시 후 다시 시도해주세요.
        </p>
      )}
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
        {label} {required && <span className="text-[var(--green)]">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
      />
    </div>
  );
}

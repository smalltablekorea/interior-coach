"use client";

import { useState } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { useTranslations } from "use-intl";

type Status = "idle" | "submitting" | "success" | "error";

export default function DemoRequestForm() {
  const t = useTranslations("demoRequest");
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
        <h2 className="text-xl md:text-2xl font-bold">{t("successTitle")}</h2>
        <p className="mt-3 text-sm text-[var(--muted)] leading-relaxed">
          {t("successLine1")}
          <br />
          {t("successLine2")}
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
          label={t("form.name")}
          required
          value={form.name}
          onChange={(v) => setForm({ ...form, name: v })}
        />
        <Field
          label={t("form.company")}
          required
          value={form.company}
          onChange={(v) => setForm({ ...form, company: v })}
        />
        <Field
          label={t("form.phone")}
          type="tel"
          required
          value={form.phone}
          onChange={(v) => setForm({ ...form, phone: v })}
          placeholder={t("form.phonePlaceholder")}
        />
        <Field
          label={t("form.email")}
          type="email"
          required
          value={form.email}
          onChange={(v) => setForm({ ...form, email: v })}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
          {t("form.sitesLabel")}
        </label>
        <select
          value={form.sites}
          onChange={(e) => setForm({ ...form, sites: e.target.value })}
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none"
          aria-label={t("form.sitesLabel")}
        >
          <option value="1-3">{t("form.sitesOption1to3")}</option>
          <option value="4-10">{t("form.sitesOption4to10")}</option>
          <option value="11-30">{t("form.sitesOption11to30")}</option>
          <option value="30+">{t("form.sitesOption30plus")}</option>
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-[var(--muted)] mb-2">
          {t("form.messageLabel")}
        </label>
        <textarea
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={4}
          placeholder={t("form.messagePlaceholder")}
          className="w-full px-4 py-3 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm focus:border-[var(--green)] outline-none resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        aria-label={t("form.submitAria")}
        className="w-full inline-flex items-center justify-center gap-2 py-4 rounded-xl bg-[var(--green)] text-black font-bold disabled:opacity-60 hover:opacity-90 transition-opacity"
      >
        {status === "submitting" ? (
          t("form.submitting")
        ) : (
          <>
            {t("form.submit")} <Send size={16} />
          </>
        )}
      </button>

      {status === "error" && (
        <p className="text-sm text-red-400 text-center">
          {t("form.errorMessage")}
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

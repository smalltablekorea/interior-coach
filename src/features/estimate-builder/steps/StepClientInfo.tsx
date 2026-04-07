"use client";

import { useState } from "react";

export interface ClientInfoData {
  name: string;
  projectName: string;
  address: string;
  phone: string;
  date: string;
}

interface Props {
  info: ClientInfoData;
  onChange: (info: ClientInfoData) => void;
}

const FIELDS: {
  key: keyof ClientInfoData;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  full?: boolean;
}[] = [
  {
    key: "projectName",
    label: "현장명",
    placeholder: "예) 강남 래미안 32평 리모델링",
    required: true,
  },
  { key: "name", label: "고객명", placeholder: "예) 홍길동" },
  {
    key: "address",
    label: "현장 주소",
    placeholder: "예) 서울시 강남구 역삼동 123-45",
    full: true,
  },
  { key: "phone", label: "연락처", placeholder: "예) 010-1234-5678" },
  { key: "date", label: "견적 일자", placeholder: "", type: "date" },
];

export function StepClientInfo({ info, onChange }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">기본 정보</h2>
        <p className="text-sm text-[var(--muted)]">
          고객 및 현장 정보를 입력하세요.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => {
          const error = touched[f.key] && f.required && !info[f.key].trim();
          return (
            <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
              <label className="block text-xs text-[var(--muted)] mb-1.5">
                {f.label}
                {f.required && (
                  <span className="text-red-500 ml-0.5">*</span>
                )}
              </label>
              <input
                type={f.type || "text"}
                placeholder={f.placeholder}
                value={info[f.key]}
                onChange={(e) =>
                  onChange({ ...info, [f.key]: e.target.value })
                }
                onBlur={() => setTouched((p) => ({ ...p, [f.key]: true }))}
                className={`w-full px-4 py-3 rounded-xl bg-[var(--card)] border text-sm placeholder:text-[var(--muted)] focus:outline-none transition-colors ${
                  error
                    ? "border-red-500/60 ring-1 ring-red-500/30"
                    : "border-[var(--border)] focus:border-[var(--green)]"
                }`}
              />
              {error && (
                <p className="text-[10px] text-red-500 mt-1">
                  현장명을 입력하세요
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

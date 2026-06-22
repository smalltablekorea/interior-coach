"use client";

import { useState } from "react";
import CustomerPicker, { type CustomerDetail } from "@/components/customers/CustomerPicker";

export interface ClientInfoData {
  name: string;
  projectName: string;
  address: string;
  phone: string;
  date: string;
  /** 연결된 기존 고객 id — 없으면 신규 작성 */
  customerId?: string | null;
}

interface Props {
  info: ClientInfoData;
  onChange: (info: ClientInfoData) => void;
}

/** customerId 는 폼에서 직접 편집하는 필드가 아니라 picker 가 관리. FIELDS 에서 제외. */
type EditableKey = Exclude<keyof ClientInfoData, "customerId">;
const FIELDS: {
  key: EditableKey;
  label: string;
  placeholder: string;
  type?: string;
  required?: boolean;
  full?: boolean;
}[] = [
  { key: "projectName", label: "현장명", placeholder: "", required: true },
  { key: "name", label: "고객명", placeholder: "" },
  { key: "address", label: "현장 주소", placeholder: "", full: true },
  { key: "phone", label: "연락처", placeholder: "" },
  { key: "date", label: "견적 일자", placeholder: "", type: "date" },
];

export function StepClientInfo({ info, onChange }: Props) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // CustomerPicker 가 onSelect 로 넘기는 detail 에는 sites 도 들어 있음.
  // 자동 채움: 고객명·연락처·주소 + 사이트가 1개면 그 이름을 projectName 으로.
  const handleCustomerSelect = (c: CustomerDetail) => {
    const primarySite = c.sites && c.sites.length > 0 ? c.sites[0] : null;
    onChange({
      ...info,
      customerId: c.id,
      name: c.name,
      phone: c.phone || info.phone,
      address: primarySite?.address || c.address || info.address,
      projectName: primarySite?.name || info.projectName,
    });
  };
  const handleCustomerClear = () => {
    onChange({ ...info, customerId: null });
  };

  // CustomerPicker 의 value 형태로 변환
  const pickerValue = info.customerId
    ? {
        id: info.customerId,
        name: info.name,
        phone: info.phone || null,
        email: null,
        address: info.address || null,
        memo: null,
        status: "상담중",
      }
    : null;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold mb-1">기본 정보</h2>
        <p className="text-sm text-[var(--muted)]">
          고객 및 현장 정보를 입력하세요. 기존 고객이면 위에서 검색해 자동으로 채울 수 있습니다.
        </p>
      </div>

      {/* 고객 불러오기 — 신규 고객은 아래 폼에 직접 입력 가능 */}
      <CustomerPicker
        value={pickerValue}
        onSelect={handleCustomerSelect}
        onClear={handleCustomerClear}
      />

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

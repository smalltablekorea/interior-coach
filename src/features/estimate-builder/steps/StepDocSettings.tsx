"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "interior-coach-company-info";

export interface CompanyInfo {
  companyName: string;
  representative: string;
  companyAddress: string;
  companyPhone: string;
  businessNumber: string;
}

interface Props {
  company: CompanyInfo;
  profitRate: number;
  overheadRate: number;
  vatOn: boolean;
  notes: string;
  onCompanyChange: (info: CompanyInfo) => void;
  onProfitRateChange: (rate: number) => void;
  onOverheadRateChange: (rate: number) => void;
  onVatToggle: () => void;
  onNotesChange: (notes: string) => void;
}

const FIELDS: {
  key: keyof CompanyInfo;
  label: string;
  placeholder: string;
  full?: boolean;
}[] = [
  {
    key: "companyName",
    label: "시공사명",
    placeholder: "예) (주)디자인인테리어",
  },
  { key: "representative", label: "대표자", placeholder: "예) 김대표" },
  {
    key: "companyAddress",
    label: "시공사 주소",
    placeholder: "예) 서울시 강남구 테헤란로 123",
    full: true,
  },
  {
    key: "companyPhone",
    label: "시공사 연락처",
    placeholder: "예) 02-1234-5678",
  },
  {
    key: "businessNumber",
    label: "사업자등록번호",
    placeholder: "예) 123-45-67890",
  },
];

export function StepDocSettings({
  company,
  profitRate,
  overheadRate,
  vatOn,
  notes,
  onCompanyChange,
  onProfitRateChange,
  onOverheadRateChange,
  onVatToggle,
  onNotesChange,
}: Props) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<CompanyInfo>;
        const hasData = Object.values(parsed).some(
          (v) => v && String(v).trim()
        );
        const isEmpty = Object.values(company).every(
          (v) => !v || !String(v).trim()
        );
        if (hasData && isEmpty) {
          onCompanyChange({ ...company, ...parsed });
          setLoaded(true);
        }
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasData = Object.values(company).some(
      (v) => v && String(v).trim()
    );
    if (hasData) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(company));
      } catch {
        /* ignore */
      }
    }
  }, [company]);

  return (
    <div className="space-y-6">
      {/* Company info */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-xl font-bold">시공사 정보</h2>
          {loaded && (
            <span className="text-[10px] text-[var(--green)] bg-[var(--green)]/10 px-2 py-0.5 rounded-full">
              이전 정보 불러옴
            </span>
          )}
        </div>
        <p className="text-sm text-[var(--muted)] mb-3">
          견적서에 표시될 시공사 정보를 입력하세요.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.full ? "sm:col-span-2" : ""}>
              <label className="block text-xs text-[var(--muted)] mb-1">
                {f.label}
              </label>
              <input
                placeholder={f.placeholder}
                value={company[f.key]}
                onChange={(e) =>
                  onCompanyChange({
                    ...company,
                    [f.key]: e.target.value,
                  })
                }
                className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Profit/Overhead rates */}
      <div>
        <h2 className="text-xl font-bold mb-1">이윤 및 경비</h2>
        <p className="text-sm text-[var(--muted)] mb-3">
          이윤율, 경비율, 부가세 설정
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              이윤율
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={40}
                value={profitRate}
                onChange={(e) =>
                  onProfitRateChange(Number(e.target.value))
                }
                className="flex-1 accent-[var(--green)] h-1.5"
              />
              <span className="text-sm font-bold text-[var(--green)] min-w-[40px] text-right">
                {profitRate}%
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              경비율
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={20}
                value={overheadRate}
                onChange={(e) =>
                  onOverheadRateChange(Number(e.target.value))
                }
                className="flex-1 accent-[var(--green)] h-1.5"
              />
              <span className="text-sm font-bold text-[var(--green)] min-w-[40px] text-right">
                {overheadRate}%
              </span>
            </div>
          </div>
          <div>
            <label className="block text-xs text-[var(--muted)] mb-1">
              부가세 (VAT 10%)
            </label>
            <button
              onClick={onVatToggle}
              className={`w-full rounded-xl border p-2.5 text-sm font-medium transition-colors ${
                vatOn
                  ? "border-[var(--green)] bg-[var(--green)]/10 text-[var(--green)]"
                  : "border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
              }`}
            >
              {vatOn ? "VAT 포함" : "VAT 미포함"}
            </button>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs text-[var(--muted)] mb-1">
          비고 / 특이사항
        </label>
        <textarea
          placeholder="견적서에 포함할 특이사항이나 조건을 입력하세요..."
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[var(--card)] border border-[var(--border)] text-sm placeholder:text-[var(--muted)] focus:border-[var(--green)] focus:outline-none resize-none"
        />
      </div>
    </div>
  );
}

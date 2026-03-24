"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  FileText,
  BarChart3,
  Megaphone,
  ArrowRight,
  Check,
  Sparkles,
} from "lucide-react";

const STORAGE_KEY = "onboarding_done_v1";

const steps = [
  {
    icon: Sparkles,
    title: "인테리어코치에 오신 걸 환영합니다!",
    description:
      "고객, 현장, 견적, 계약, 시공, 자재를 한곳에서 관리할 수 있는 업무 관리 플랫폼입니다.",
    color: "var(--green)",
  },
  {
    icon: Building2,
    title: "현장 · 고객 관리",
    description:
      "고객 정보와 시공 현장을 등록하고, 상담부터 A/S까지 전 과정을 추적하세요.",
    color: "var(--blue)",
  },
  {
    icon: FileText,
    title: "견적 · 계약 관리",
    description:
      "AI 견적코치로 빠르게 견적서를 만들고, 계약 및 수금 현황을 실시간으로 확인하세요.",
    color: "var(--orange)",
  },
  {
    icon: BarChart3,
    title: "정산 · 세무 관리",
    description:
      "매출/매입 관리, 세금계산서 발행, 급여대장 등 세무 업무를 체계적으로 처리하세요.",
    color: "var(--red)",
  },
  {
    icon: Megaphone,
    title: "마케팅 자동화",
    description:
      "SNS 콘텐츠 생성, 자동 포스팅, 광고 분석까지 마케팅을 손쉽게 관리하세요.",
    color: "var(--green)",
  },
];

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setOpen(false);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  if (!open) return null;

  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-md bg-[var(--card)] border border-[var(--border)] rounded-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Illustration */}
        <div
          className="h-48 flex items-center justify-center"
          style={{ background: `${current.color}10` }}
        >
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{ background: `${current.color}20` }}
          >
            <Icon size={40} style={{ color: current.color }} />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pt-6 pb-4 text-center">
          <h2 className="text-xl font-bold mb-2">{current.title}</h2>
          <p className="text-sm text-[var(--muted)] leading-relaxed">
            {current.description}
          </p>
        </div>

        {/* Step Dots */}
        <div className="flex justify-center gap-1.5 py-3">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className="w-2 h-2 rounded-full transition-all"
              style={{
                background:
                  i === step ? current.color : "var(--border)",
                width: i === step ? "16px" : "8px",
              }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--border)] transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2"
            style={{ background: current.color, color: "#000" }}
          >
            {isLast ? (
              <>
                <Check size={16} /> 시작하기
              </>
            ) : (
              <>
                다음 <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>

        {/* Skip */}
        {!isLast && (
          <div className="text-center pb-4">
            <button
              onClick={handleComplete}
              className="text-xs text-[var(--muted)] hover:underline"
            >
              건너뛰기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

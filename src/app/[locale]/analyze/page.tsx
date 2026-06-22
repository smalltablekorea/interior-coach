"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import {
  Upload,
  Camera,
  FileText,
  ArrowRight,
  Sparkles,
  Lock,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = "upload" | "analyzing" | "preview";

export default function AnalyzePage() {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);

    if (selected.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(selected);
    } else {
      setPreview(null);
    }
  };

  const handleAnalyze = () => {
    if (!file) return;
    setStep("analyzing");
    // 시뮬레이션: 3초 후 preview 상태로 전환
    setTimeout(() => setStep("preview"), 3000);
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Header */}
      <header className="border-b border-[var(--border)] sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-md">
        <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--green)] flex items-center justify-center">
              <span className="text-black font-bold text-sm">IC</span>
            </div>
            <span className="font-bold text-lg">견적코치</span>
          </Link>
          <Link
            href="/auth/login"
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            로그인
          </Link>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* ─── Step 1: Upload ─── */}
        {step === "upload" && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center space-y-3">
              <h1 className="text-2xl md:text-3xl font-bold">
                견적서를 올려주세요
              </h1>
              <p className="text-sm text-[var(--muted)]">
                사진이나 PDF를 올리면 AI가 무료 요약을 먼저 보여드립니다
              </p>
            </div>

            {/* 면책 배너 */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 flex items-start gap-2.5">
              <span className="text-amber-500 shrink-0 mt-0.5 text-xs">⚠️</span>
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                본인이 받은 견적서만 업로드해 주세요. 타인의 견적서를 무단으로 업로드하면 영업비밀 침해에 해당할 수 있습니다.
              </p>
            </div>

            {/* Upload Area */}
            {!file ? (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="p-10 rounded-2xl border-2 border-dashed border-[var(--border)] hover:border-[var(--green)]/50 cursor-pointer transition-colors text-center"
                >
                  <Upload size={40} className="mx-auto mb-4 text-[var(--muted)]" />
                  <p className="text-sm font-medium">견적서 파일 선택</p>
                  <p className="text-xs text-[var(--muted)] mt-1">
                    JPG, PNG, PDF (최대 10MB)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:bg-white/[0.04] transition-colors"
                  >
                    <Camera size={18} className="text-[var(--muted)]" />
                    <span className="text-sm">카메라 촬영</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 p-4 rounded-xl border border-[var(--border)] hover:bg-white/[0.04] transition-colors"
                  >
                    <FileText size={18} className="text-[var(--muted)]" />
                    <span className="text-sm">파일 선택</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="p-4 rounded-xl bg-[var(--card)] border border-[var(--border)] flex items-center gap-3">
                  {preview ? (
                    <img src={preview} alt="견적서" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-white/[0.04] flex items-center justify-center">
                      <FileText size={24} className="text-[var(--muted)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-[var(--muted)]">{(file.size / 1024 / 1024).toFixed(1)}MB</p>
                  </div>
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="p-2 rounded-lg hover:bg-white/[0.04] text-[var(--muted)]"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* 타인 견적서 확인 체크 */}
                <label className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-[var(--border)] cursor-pointer">
                  <input type="checkbox" id="own-estimate" className="mt-0.5 accent-[var(--green)]" required />
                  <span className="text-xs text-[var(--muted)] leading-relaxed">
                    본인이 받은 견적서이며, 타인의 견적서를 무단으로 업로드하지 않겠습니다.
                  </span>
                </label>

                <button
                  onClick={handleAnalyze}
                  className="w-full py-3.5 rounded-xl bg-[var(--green)] text-black font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Sparkles size={18} />
                  무료 요약 분석 시작
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={handleFileSelect}
            />
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />

            <p className="text-center text-[10px] text-[var(--muted)]">
              로그인 없이 무료 요약을 먼저 확인할 수 있습니다
            </p>
          </div>
        )}

        {/* ─── Step 2: Analyzing ─── */}
        {step === "analyzing" && (
          <div className="text-center py-20 space-y-6 animate-fade-up">
            <div className="relative mx-auto w-20 h-20">
              <div className="w-20 h-20 rounded-full border-4 border-[var(--green)]/20 border-t-[var(--green)] animate-spin" />
              <Sparkles size={24} className="absolute inset-0 m-auto text-[var(--green)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI가 견적서를 분석하고 있습니다</h2>
              <p className="text-sm text-[var(--muted)] mt-2">
                공종 식별 → 단가 비교 → 과다/과소 판별 중...
              </p>
            </div>
            <div className="max-w-xs mx-auto space-y-2">
              {["견적서 OCR 인식", "공종 분류 완료", "참고 가격 범위 비교 중..."].map((t, i) => (
                <div key={t} className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  {i < 2 ? (
                    <CheckCircle2 size={14} className="text-[var(--green)]" />
                  ) : (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  {t}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Step 3: Free Preview (Teaser) ─── */}
        {step === "preview" && (
          <div className="space-y-6 animate-fade-up">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--green)]/10 text-xs text-[var(--green)]">
                <CheckCircle2 size={14} />
                분석 완료
              </div>
              <h1 className="text-2xl font-bold">무료 요약 분석 결과</h1>
            </div>

            {/* 무료 요약 3줄 */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--green)] font-bold">12</span>
                <span className="text-[var(--muted)]">개 공종 식별됨</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--green)] font-bold">약 4,200만원</span>
                <span className="text-[var(--muted)]">총 견적 금액 (32평 기준 참고 가격 범위 내)</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-[var(--green)] font-bold">평당 131만원</span>
                <span className="text-[var(--muted)]">스탠다드 등급 수준</span>
              </div>
            </div>

            {/* 블러 처리된 상세 분석 */}
            <div className="p-5 rounded-2xl bg-[var(--card)] border border-[var(--border)] relative overflow-hidden">
              <h3 className="text-sm font-medium mb-3">공종별 상세 분석</h3>
              <div className="blur-[6px] pointer-events-none select-none space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">목공사 단가 과다 의심</p>
                    <p className="text-xs text-[var(--muted)]">시세 대비 약 30% 높음</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[var(--green)]/5 border border-[var(--green)]/20">
                  <CheckCircle2 size={16} className="text-[var(--green)] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">설비공사 적정 수준</p>
                    <p className="text-xs text-[var(--muted)]">참고 가격 범위 내</p>
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center bg-[var(--background)]/30">
                <div className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-[var(--card)]/95 backdrop-blur-sm border border-[var(--border)] shadow-lg">
                  <Lock size={24} className="text-[var(--muted)]" />
                  <p className="text-sm font-medium">전체 분석은 로그인 후 확인</p>
                </div>
              </div>
            </div>

            {/* CTA: 로그인 → 결제 → 전체 분석 */}
            <div className="space-y-3">
              <Link
                href="/auth/login?callbackUrl=/dashboard&from=analyze"
                className={cn(
                  "w-full py-3.5 rounded-xl bg-[var(--green)] text-black font-semibold",
                  "hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                )}
              >
                로그인하고 전체 분석 보기
                <ArrowRight size={18} />
              </Link>
              <p className="text-center text-xs text-[var(--muted)]">
                1건 39,900원 · 분석 완료 후 24시간 이내 전액 환불 가능
              </p>
            </div>

            {/* 면책 */}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <p className="text-[10px] text-[var(--muted)] leading-relaxed">
                본 분석은 참고용이며, 실제 시공 가격은 현장 조건에 따라 달라질 수 있습니다.
                견적코치는 가격을 보증하지 않으며, 본 분석을 근거로 한 의사결정에 대해 책임지지 않습니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

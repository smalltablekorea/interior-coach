"use client";

import { useRef, useState } from "react";
import { Printer, Link2, Check, FileSpreadsheet, Save } from "lucide-react";
import { EstimateDocument } from "../components/EstimateDocument";
import type { CompanyInfo } from "./StepDocSettings";
import type { SubOverride, CustomSub } from "./StepDetails";
import { CATS, gradeMap, calcSub } from "@/lib/estimate-engine";

interface ClientInfo {
  name: string;
  projectName: string;
  address: string;
  phone: string;
  date: string;
}

interface Props {
  clientInfo: ClientInfo;
  companyInfo: CompanyInfo;
  area: number;
  grade: string;
  enabled: Record<string, boolean>;
  catGrades: Record<string, string>;
  catAdj: Record<string, number>;
  subOverrides: Record<string, SubOverride>;
  customSubs: Record<string, CustomSub[]>;
  profitRate: number;
  overheadRate: number;
  vatOn: boolean;
  notes: string;
  amounts: Record<string, number>;
  subtotal: number;
  profit: number;
  overhead: number;
  vat: number;
  grandTotal: number;
}

export function StepPreview(props: Props) {
  const docRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<"success" | "error" | null>(
    null
  );

  const handlePrint = () => window.print();

  const handleShareLink = async () => {
    try {
      const data = {
        a: props.area,
        g: props.grade,
        e: props.enabled,
        cg: props.catGrades,
        ca: props.catAdj,
        pr: props.profitRate,
        oh: props.overheadRate,
        v: props.vatOn,
        ci: props.clientInfo,
        co: props.companyInfo,
        n: props.notes,
      };
      const encoded = btoa(encodeURIComponent(JSON.stringify(data)));
      const url = `${window.location.origin}/estimates/builder?d=${encoded}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleExcelDownload = () => {
    const activeCats = CATS.filter(
      (c) => props.enabled[c.id] !== false
    );
    let rows =
      "<tr><th>No</th><th>항목</th><th>수량</th><th>단위</th><th>금액 (원)</th><th>비율</th></tr>";
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

    activeCats.forEach((cat, i) => {
      const cg = props.catGrades[cat.id] || props.grade;
      const cgD = gradeMap[cg];
      const amt = props.amounts[cat.id] || 0;
      const pct =
        props.subtotal > 0
          ? ((amt / props.subtotal) * 100).toFixed(1)
          : "0.0";
      rows += `<tr style="background:#f0f0f0;font-weight:bold"><td>${i + 1}</td><td>${esc(cat.name)} (${esc(cgD.label)})</td><td></td><td></td><td>${Math.round(amt)}</td><td>${pct}%</td></tr>`;
      cat.subs.forEach((sub, si) => {
        const ov = props.subOverrides[`${cat.id}-${si}`] || {};
        const subAmt =
          ov.amount != null
            ? ov.amount
            : Math.round(calcSub(sub, props.area));
        rows += `<tr><td></td><td>  ${esc(ov.name ?? sub.name)}</td><td>${ov.qty ?? 1}</td><td>${esc(ov.unit ?? "식")}</td><td>${Math.round(subAmt)}</td><td></td></tr>`;
      });
      (props.customSubs[cat.id] || []).forEach((cs) => {
        rows += `<tr><td></td><td>  ${esc(cs.name)}</td><td>${cs.qty}</td><td>${esc(cs.unit)}</td><td>${Math.round(cs.amount)}</td><td></td></tr>`;
      });
    });

    rows += `<tr style="background:#e0ecff;font-weight:bold"><td colspan="4">직접 공사비 소계</td><td>${Math.round(props.subtotal)}</td><td>100%</td></tr>`;
    rows += `<tr><td colspan="4">이윤 (${props.profitRate}%)</td><td>${Math.round(props.profit)}</td><td></td></tr>`;
    rows += `<tr><td colspan="4">일반관리비 (${props.overheadRate}%)</td><td>${Math.round(props.overhead)}</td><td></td></tr>`;
    if (props.vatOn)
      rows += `<tr><td colspan="4">부가세 (VAT 10%)</td><td>${Math.round(props.vat)}</td><td></td></tr>`;
    rows += `<tr style="background:#1a1a2e;color:#fff;font-weight:bold"><td colspan="4">합계</td><td>${Math.round(props.grandTotal)}</td><td></td></tr>`;

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="utf-8"><style>td,th{border:1px solid #ccc;padding:4px 8px;} th{background:#f5f5f5;}</style></head><body><table>${rows}</table></body></html>`;
    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `견적서_${props.clientInfo.projectName || "인테리어코치"}.xls`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveResult(null);
    try {
      const activeCats = CATS.filter(
        (c) => props.enabled[c.id] !== false
      );

      const categories = activeCats.map((cat) => {
        const cg = props.catGrades[cat.id] || props.grade;
        const cgD = gradeMap[cg];
        const amt = props.amounts[cat.id] || 0;

        const lineItems = cat.subs.map((sub, si) => {
          const ov = props.subOverrides[`${cat.id}-${si}`] || {};
          const subAmt =
            ov.amount != null
              ? ov.amount
              : Math.round(calcSub(sub, props.area));
          return {
            name: ov.name ?? sub.name,
            qty: ov.qty ?? 1,
            unit: ov.unit ?? "식",
            amount: Math.round(subAmt),
          };
        });

        const customItems = (props.customSubs[cat.id] || []).map(
          (cs) => ({
            name: cs.name,
            qty: cs.qty,
            unit: cs.unit,
            amount: Math.round(cs.amount),
          })
        );

        return {
          id: cat.id,
          name: cat.name,
          grade: cgD.label,
          gradeKey: cg,
          amount: Math.round(amt),
          lineItems: [...lineItems, ...customItems],
        };
      });

      const res = await fetch("/api/v1/estimates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: props.clientInfo.projectName || "견적서",
          clientName: props.clientInfo.name,
          siteAddress: props.clientInfo.address,
          clientPhone: props.clientInfo.phone,
          estimateDate: props.clientInfo.date,
          areaPyeong: String(props.area),
          gradeKey: props.grade,
          gradeName: gradeMap[props.grade]?.label,
          projectType: "전체 인테리어",
          categories,
          subtotal: Math.round(props.subtotal),
          profitRate: props.profitRate,
          profitAmount: Math.round(props.profit),
          overheadRate: props.overheadRate,
          overheadAmount: Math.round(props.overhead),
          vatOn: props.vatOn,
          vatAmount: Math.round(props.vat),
          grandTotal: Math.round(props.grandTotal),
          companyInfo: props.companyInfo,
          notes: props.notes,
        }),
      });

      if (res.ok) {
        setSaveResult("success");
        setTimeout(() => setSaveResult(null), 3000);
      } else {
        setSaveResult("error");
        setTimeout(() => setSaveResult(null), 3000);
      }
    } catch {
      setSaveResult("error");
      setTimeout(() => setSaveResult(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold mb-1">견적서 미리보기</h2>
          <p className="text-sm text-[var(--muted)]">
            완성된 견적서를 확인하고 인쇄 또는 저장하세요.
          </p>
        </div>
        <div className="flex gap-2 print:hidden flex-wrap">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              saveResult === "success"
                ? "bg-green-600 text-white"
                : saveResult === "error"
                  ? "bg-red-500 text-white"
                  : "bg-[var(--primary)] text-white hover:bg-[#1d4ed8]"
            } disabled:opacity-50`}
          >
            {saveResult === "success" ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving
              ? "저장 중..."
              : saveResult === "success"
                ? "저장됨"
                : saveResult === "error"
                  ? "저장 실패"
                  : "저장"}
          </button>
          <button
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
          >
            {copied ? (
              <Check size={16} className="text-[var(--primary)]" />
            ) : (
              <Link2 size={16} />
            )}
            {copied ? "복사됨" : "공유 링크"}
          </button>
          <button
            onClick={handleExcelDownload}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
          >
            <FileSpreadsheet size={16} />
            엑셀
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-sm text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/[0.04] transition-colors"
          >
            <Printer size={16} />
            인쇄
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-white shadow-lg">
        <EstimateDocument ref={docRef} {...props} />
      </div>
    </div>
  );
}

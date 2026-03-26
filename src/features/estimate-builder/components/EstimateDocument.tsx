"use client";

import React, { forwardRef } from "react";
import {
  CATS,
  gradeMap,
  calcSub,
  fmt,
} from "@/lib/estimate-engine";
import type { CompanyInfo } from "../steps/StepDocSettings";
import type { SubOverride, CustomSub } from "../steps/StepDetails";

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
  subOverrides?: Record<string, SubOverride>;
  customSubs?: Record<string, CustomSub[]>;
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

export const EstimateDocument = forwardRef<HTMLDivElement, Props>(
  function EstimateDocument(
    {
      clientInfo,
      companyInfo,
      area,
      grade,
      enabled,
      catGrades,
      subOverrides = {},
      customSubs = {},
      profitRate,
      overheadRate,
      vatOn,
      notes,
      amounts,
      subtotal,
      profit,
      overhead,
      vat,
      grandTotal,
    },
    ref
  ) {
    const gd = gradeMap[grade];
    const activeCats = CATS.filter((c) => enabled[c.id] !== false);

    const formatDate = (d: string) => {
      if (!d) return "-";
      const dt = new Date(d);
      return `${dt.getFullYear()}년 ${dt.getMonth() + 1}월 ${dt.getDate()}일`;
    };

    // All inline styles for print-ready document
    const S = {
      page: {
        fontFamily:
          "'Pretendard Variable', -apple-system, 'Noto Sans KR', sans-serif",
        color: "#1a1a2e",
        background: "#fff",
        padding: "48px 56px",
        maxWidth: 900,
        margin: "0 auto",
        fontSize: 12,
        lineHeight: 1.6,
      },
      section: { marginBottom: 28 } as React.CSSProperties,
      sectionTitle: {
        fontSize: 13,
        fontWeight: 700,
        color: "#1a1a2e",
        borderBottom: "2px solid #1a1a2e",
        paddingBottom: 6,
        marginBottom: 12,
      } as React.CSSProperties,
      table: {
        width: "100%",
        borderCollapse: "collapse" as const,
        fontSize: 11,
      },
      th: {
        background: "#f0f4ff",
        border: "1px solid #e5e7eb",
        padding: "7px 8px",
        fontWeight: 600,
        textAlign: "left" as const,
      },
      td: { border: "1px solid #e5e7eb", padding: "6px 8px" },
      tdRight: {
        border: "1px solid #e5e7eb",
        padding: "6px 8px",
        textAlign: "right" as const,
      },
      totalRow: {
        background: "#e0ecff",
        fontWeight: 700,
      } as React.CSSProperties,
      grandRow: {
        background: "#1a1a2e",
        color: "#fff",
        fontWeight: 700,
        fontSize: 13,
      } as React.CSSProperties,
    };

    return (
      <div ref={ref} style={S.page} className="print-document">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              letterSpacing: 12,
              color: "#1a1a2e",
            }}
          >
            견 적 서
          </div>
          <div
            style={{
              fontSize: 10,
              color: "#999",
              marginTop: 4,
              letterSpacing: 2,
            }}
          >
            ESTIMATE
          </div>
          <div
            style={{
              width: 60,
              height: 3,
              background: "#2563eb",
              margin: "12px auto 0",
            }}
          />
        </div>

        {/* Grand total box */}
        <div
          style={{
            background: "#f0f4ff",
            border: "2px solid #1a1a2e",
            borderRadius: 8,
            padding: "16px 24px",
            marginBottom: 28,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{ fontSize: 10, color: "#666", fontWeight: 600 }}
            >
              견적 총액 (VAT {vatOn ? "포함" : "별도"})
            </div>
            <div
              style={{ fontSize: 11, color: "#999", marginTop: 2 }}
            >
              전용 {area}평 ({(area * 3.3058).toFixed(1)}m²) ·{" "}
              {gd.label} 등급
            </div>
          </div>
          <div
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#1a1a2e",
            }}
          >
            {fmt(grandTotal)}
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                marginLeft: 4,
              }}
            >
              원
            </span>
          </div>
        </div>

        {/* Client / Company info */}
        <div
          style={{ display: "flex", gap: 16, marginBottom: 28 }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                borderLeft: "3px solid #2563eb",
                paddingLeft: 8,
                marginBottom: 8,
              }}
            >
              고객 정보
            </div>
            <table style={S.table}>
              <tbody>
                {(
                  [
                    ["현장명", clientInfo.projectName || "-"],
                    ["고객명", clientInfo.name || "-"],
                    ["연락처", clientInfo.phone || "-"],
                    ["주소", clientInfo.address || "-"],
                    ["견적일", formatDate(clientInfo.date)],
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <tr key={l}>
                    <td style={{ ...S.th, width: 70 }}>{l}</td>
                    <td style={S.td}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                borderLeft: "3px solid #1a1a2e",
                paddingLeft: 8,
                marginBottom: 8,
              }}
            >
              시공사 정보
            </div>
            <table style={S.table}>
              <tbody>
                {(
                  [
                    [
                      "시공사",
                      companyInfo.companyName || "인테리어코치",
                    ],
                    [
                      "대표자",
                      companyInfo.representative || "-",
                    ],
                    [
                      "연락처",
                      companyInfo.companyPhone || "-",
                    ],
                    [
                      "주소",
                      companyInfo.companyAddress || "-",
                    ],
                    [
                      "사업자번호",
                      companyInfo.businessNumber || "-",
                    ],
                  ] as [string, string][]
                ).map(([l, v]) => (
                  <tr key={l}>
                    <td style={{ ...S.th, width: 80 }}>{l}</td>
                    <td style={S.td}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary table */}
        <div style={S.section}>
          <div style={S.sectionTitle}>견적 총괄표</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>구분</th>
                <th style={{ ...S.th, textAlign: "right" }}>
                  금액 (원)
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={S.td}>직접 공사비 (소계)</td>
                <td style={S.tdRight}>{fmt(subtotal)}</td>
              </tr>
              <tr>
                <td style={S.td}>이윤 ({profitRate}%)</td>
                <td style={S.tdRight}>{fmt(profit)}</td>
              </tr>
              <tr>
                <td style={S.td}>
                  일반관리비 ({overheadRate}%)
                </td>
                <td style={S.tdRight}>{fmt(overhead)}</td>
              </tr>
              {vatOn && (
                <tr>
                  <td style={S.td}>부가세 (VAT 10%)</td>
                  <td style={S.tdRight}>{fmt(vat)}</td>
                </tr>
              )}
              <tr style={S.grandRow}>
                <td style={{ ...S.td, border: "none" }}>합계</td>
                <td style={{ ...S.tdRight, border: "none" }}>
                  {fmt(grandTotal)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Detailed breakdown */}
        <div style={S.section}>
          <div style={S.sectionTitle}>공종별 상세 내역</div>
          <table style={S.table}>
            <thead>
              <tr>
                <th
                  style={{
                    ...S.th,
                    width: 36,
                    textAlign: "center",
                  }}
                >
                  No
                </th>
                <th style={S.th}>항목</th>
                <th
                  style={{
                    ...S.th,
                    width: 50,
                    textAlign: "center",
                  }}
                >
                  수량
                </th>
                <th
                  style={{
                    ...S.th,
                    width: 40,
                    textAlign: "center",
                  }}
                >
                  단위
                </th>
                <th
                  style={{
                    ...S.th,
                    textAlign: "right",
                    width: 120,
                  }}
                >
                  금액 (원)
                </th>
                <th
                  style={{
                    ...S.th,
                    textAlign: "right",
                    width: 50,
                  }}
                >
                  비율
                </th>
              </tr>
            </thead>
            <tbody>
              {activeCats.map((cat, i) => {
                const cg = catGrades[cat.id] || grade;
                const cgD = gradeMap[cg];
                const amt = amounts[cat.id] || 0;
                const pct =
                  subtotal > 0
                    ? ((amt / subtotal) * 100).toFixed(1)
                    : "0.0";
                const customs = customSubs[cat.id] || [];
                return (
                  <React.Fragment key={cat.id}>
                    <tr style={{ background: "#f0f4ff" }}>
                      <td
                        style={{
                          ...S.td,
                          textAlign: "center",
                          fontWeight: 700,
                        }}
                      >
                        {i + 1}
                      </td>
                      <td
                        style={{
                          ...S.td,
                          fontWeight: 700,
                        }}
                      >
                        {cat.name}
                        <span
                          style={{
                            fontSize: 9,
                            marginLeft: 6,
                            padding: "1px 5px",
                            borderRadius: 3,
                            background: `${cgD.color}15`,
                            color: cgD.color,
                            fontWeight: 600,
                          }}
                        >
                          {cgD.label}
                        </span>
                      </td>
                      <td
                        style={{
                          ...S.td,
                          textAlign: "center",
                        }}
                      ></td>
                      <td
                        style={{
                          ...S.td,
                          textAlign: "center",
                        }}
                      ></td>
                      <td
                        style={{
                          ...S.tdRight,
                          fontFamily: "monospace",
                          fontWeight: 700,
                        }}
                      >
                        {fmt(amt)}
                      </td>
                      <td
                        style={{
                          ...S.tdRight,
                          fontSize: 10,
                          color: "#888",
                        }}
                      >
                        {pct}%
                      </td>
                    </tr>
                    {cat.subs.map((sub, si) => {
                      const ov =
                        subOverrides[`${cat.id}-${si}`] || {};
                      const subAmt =
                        ov.amount != null
                          ? ov.amount
                          : Math.round(calcSub(sub, area));
                      return (
                        <tr
                          key={`s${si}`}
                          style={{ background: "#fff" }}
                        >
                          <td
                            style={{
                              ...S.td,
                              textAlign: "center",
                            }}
                          ></td>
                          <td
                            style={{
                              ...S.td,
                              paddingLeft: 24,
                              color: "#555",
                              fontSize: 10,
                            }}
                          >
                            {ov.name ?? sub.name}
                          </td>
                          <td
                            style={{
                              ...S.td,
                              textAlign: "center",
                              fontSize: 10,
                              color: "#666",
                            }}
                          >
                            {ov.qty ?? 1}
                          </td>
                          <td
                            style={{
                              ...S.td,
                              textAlign: "center",
                              fontSize: 10,
                              color: "#666",
                            }}
                          >
                            {ov.unit ?? "식"}
                          </td>
                          <td
                            style={{
                              ...S.tdRight,
                              fontFamily: "monospace",
                              fontSize: 10,
                              color: "#555",
                            }}
                          >
                            {fmt(subAmt)}
                          </td>
                          <td style={S.td}></td>
                        </tr>
                      );
                    })}
                    {customs.map((cs, ci) => (
                      <tr
                        key={`c${ci}`}
                        style={{ background: "#fff" }}
                      >
                        <td
                          style={{
                            ...S.td,
                            textAlign: "center",
                          }}
                        ></td>
                        <td
                          style={{
                            ...S.td,
                            paddingLeft: 24,
                            color: "#555",
                            fontSize: 10,
                          }}
                        >
                          {cs.name}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            textAlign: "center",
                            fontSize: 10,
                            color: "#666",
                          }}
                        >
                          {cs.qty}
                        </td>
                        <td
                          style={{
                            ...S.td,
                            textAlign: "center",
                            fontSize: 10,
                            color: "#666",
                          }}
                        >
                          {cs.unit}
                        </td>
                        <td
                          style={{
                            ...S.tdRight,
                            fontFamily: "monospace",
                            fontSize: 10,
                            color: "#555",
                          }}
                        >
                          {fmt(cs.amount)}
                        </td>
                        <td style={S.td}></td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
              <tr style={S.totalRow}>
                <td style={S.td} colSpan={4}>
                  직접 공사비 소계
                </td>
                <td
                  style={{
                    ...S.tdRight,
                    fontFamily: "monospace",
                  }}
                >
                  {fmt(subtotal)}
                </td>
                <td
                  style={{
                    ...S.tdRight,
                    fontSize: 10,
                  }}
                >
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Notes */}
        {notes && (
          <div style={S.section}>
            <div style={S.sectionTitle}>비고 / 특이사항</div>
            <div
              style={{
                padding: "8px 12px",
                background: "#f9f9f9",
                borderRadius: 4,
                fontSize: 11,
                lineHeight: 1.8,
                whiteSpace: "pre-wrap",
              }}
            >
              {notes}
            </div>
          </div>
        )}

        {/* Standard terms */}
        <div style={S.section}>
          <div style={S.sectionTitle}>표준 조건</div>
          <ul
            style={{
              fontSize: 10,
              color: "#666",
              lineHeight: 1.8,
              paddingLeft: 16,
              margin: 0,
            }}
          >
            <li>
              본 견적서의 유효기간은 발행일로부터 30일입니다.
            </li>
            <li>
              현장 상황에 따라 금액이 ±10~15% 변동될 수 있습니다.
            </li>
            <li>
              자재 가격은 2026년 기준이며, 시세 변동 시 조정될 수
              있습니다.
            </li>
            <li>
              추가 공사 발생 시 별도 협의 후 진행합니다.
            </li>
            <li>
              공사 기간은 현장 여건에 따라 변경될 수 있습니다.
            </li>
          </ul>
        </div>

        {/* Signature area */}
        <div
          style={{
            marginTop: 36,
            borderTop: "2px solid #1a1a2e",
            paddingTop: 24,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 10,
                color: "#999",
                marginBottom: 8,
                fontWeight: 600,
                letterSpacing: 2,
              }}
            >
              시 공 사
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: "16px 24px",
                textAlign: "center",
                minWidth: 200,
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {companyInfo.companyName || "인테리어코치"}
              </div>
              {companyInfo.representative && (
                <div
                  style={{
                    fontSize: 11,
                    color: "#666",
                    marginTop: 4,
                  }}
                >
                  대표: {companyInfo.representative} (인)
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              fontSize: 10,
              color: "#bbb",
              alignSelf: "center",
              padding: "0 20px",
            }}
          >
            {formatDate(clientInfo.date)}
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 10,
                color: "#999",
                marginBottom: 8,
                fontWeight: 600,
                letterSpacing: 2,
              }}
            >
              고 객
            </div>
            <div
              style={{
                border: "1px solid #ddd",
                borderRadius: 6,
                padding: "16px 24px",
                textAlign: "center",
                minWidth: 200,
                minHeight: 60,
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>
                {clientInfo.name || "(서명)"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer branding */}
        <div
          style={{
            textAlign: "center",
            marginTop: 32,
            paddingTop: 16,
            borderTop: "1px solid #eee",
          }}
        >
          <span
            style={{
              fontSize: 9,
              color: "#ccc",
              letterSpacing: 1,
            }}
          >
            Powered by 인테리어코치
          </span>
        </div>
      </div>
    );
  }
);

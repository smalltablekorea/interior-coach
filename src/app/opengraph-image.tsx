import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "인테리어코치 — 인테리어 업체 현장 운영 올인원 SaaS";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #050505 0%, #0a0a0a 100%)",
          color: "#ededed",
          fontFamily: "system-ui",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "#00C471",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#050505",
              fontSize: 32,
              fontWeight: 900,
            }}
          >
            IC
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#00C471" }}>
            인테리어코치
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.1 }}>
            현장 5개, 폴더 12개,
          </div>
          <div style={{ fontSize: 80, fontWeight: 800, lineHeight: 1.1, color: "#00C471" }}>
            엑셀 20장 — 한 화면에.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 28,
            color: "#888888",
          }}
        >
          <div>공정 · 견적 · 계약 · 정산 · 세무</div>
          <div style={{ color: "#ededed", fontWeight: 600 }}>
            14일 무료 · 카드 등록 불필요
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

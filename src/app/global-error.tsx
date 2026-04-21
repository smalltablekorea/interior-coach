"use client";

// Next.js 16 requires global-error to be a client component that provides its own <html>/<body>.
// The useContext prerender crash is a known Next.js 16 + React 19 issue.
// Using inline styles only (no providers/context/fonts) to avoid the prerender error.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body style={{ margin: 0 }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            fontFamily: "system-ui, sans-serif",
            background: "#0a0a0a",
            color: "#ededed",
          }}
        >
          <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>
            문제가 발생했습니다
          </h2>
          <p style={{ color: "#888", marginBottom: "2rem" }}>
            잠시 후 다시 시도해 주세요.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "1px solid #333",
              background: "#1a1a1a",
              color: "#ededed",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            다시 시도
          </button>
        </div>
      </body>
    </html>
  );
}

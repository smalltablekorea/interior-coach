import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// next-intl 의 server config 를 src/i18n/request.ts 에서 읽도록 연결.
// (App Router 안에서 getRequestConfig 가 적용되는 경로)
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  // Skip static prerender errors (global-error useContext bug in Next.js 16 + React 19)
  experimental: {
    // Allow build to continue despite prerender errors (/_global-error SSG crash)
    prerenderEarlyExit: false,
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);

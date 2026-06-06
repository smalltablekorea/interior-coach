import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { startTrialForNewUser } from "./subscription/trial";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-change-in-production",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
    "https://www.interiorcoach.co.kr",
    "https://interiorcoach.co.kr",
    "https://interior-coach-deploy.vercel.app",
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          // 신규 가입자에게 Pro 체험 + (프로모 기간 한정) 견적코치 분석권 자동 부여.
          // 가입 흐름을 막지 않도록 실패는 로그만 남기고 swallow.
          try {
            const grant = await startTrialForNewUser(user.id);
            console.log("[Auth] Signup grant", {
              userId: user.id,
              email: user.email,
              ...grant,
            });
          } catch (e) {
            console.error("[Auth] Signup grant failed", user.id, e);
          }
        },
      },
    },
  },
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          },
        }
      : {}),
    ...(process.env.KAKAO_CLIENT_ID && process.env.KAKAO_CLIENT_SECRET
      ? {
          kakao: {
            clientId: process.env.KAKAO_CLIENT_ID,
            clientSecret: process.env.KAKAO_CLIENT_SECRET,
            // better-auth 기본 scope ["account_email","profile_image","profile_nickname"] 사용 시
            // 비즈 앱 미등록 상태에서 account_email/profile_image 권한 없어 KOE205.
            // disableDefaultScope 로 기본 비활성 + 닉네임만 명시.
            disableDefaultScope: true,
            scope: ["profile_nickname"],
            // 비즈 앱 미등록 상태에서는 카카오가 이메일을 안 줌 → user.email NOT NULL 제약 위반 →
            // 콜백이 silent fail 후 홈으로 리다이렉트. 카카오 id 기반 합성 이메일로 우회.
            // 비즈 앱 전환 후 account_email scope 활성화되면 이 매핑 제거 가능.
            mapProfileToUser: (profile) => ({
              email: `kakao_${profile.id}@kakao.interiorcoach.local`,
              emailVerified: false,
            }),
          },
        }
      : {}),
  },
});

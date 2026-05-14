import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET || "development-secret-key-change-in-production",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  trustedOrigins: [
    process.env.BETTER_AUTH_URL || "http://localhost:3000",
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
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
          },
        }
      : {}),
  },
});

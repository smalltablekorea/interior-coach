/**
 * 클라이언트 포털 토큰 검증 (Better Auth 우회).
 *
 * status='active' 이고 expires_at 미경과인 토큰만 통과.
 * 통과 시 last_used_at 업데이트.
 */

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  agencyClients,
  agencyClientPortalTokens,
  type agencyClients as _t,
} from "@/lib/db/schema";

type Client = typeof _t.$inferSelect;
type Token = typeof agencyClientPortalTokens.$inferSelect;

export type PortalTokenStatus = "valid" | "not_found" | "revoked" | "rotated" | "expired";

export type PortalTokenResult =
  | { ok: true; status: "valid"; token: Token; client: Client }
  | { ok: false; status: Exclude<PortalTokenStatus, "valid"> };

export async function verifyPortalToken(rawToken: string): Promise<PortalTokenResult> {
  if (!rawToken) return { ok: false, status: "not_found" };

  const [token] = await db
    .select()
    .from(agencyClientPortalTokens)
    .where(eq(agencyClientPortalTokens.token, rawToken))
    .limit(1);

  if (!token) return { ok: false, status: "not_found" };
  if (token.status === "revoked") return { ok: false, status: "revoked" };
  if (token.status === "rotated") return { ok: false, status: "rotated" };
  if (new Date(token.expiresAt) < new Date()) return { ok: false, status: "expired" };
  if (token.status !== "active") return { ok: false, status: "expired" };

  const [client] = await db
    .select()
    .from(agencyClients)
    .where(eq(agencyClients.id, token.clientId))
    .limit(1);

  if (!client) return { ok: false, status: "not_found" };
  if (client.status !== "active") return { ok: false, status: "revoked" };

  // 비차단 업데이트 (실패해도 검증 결과는 유지)
  void db
    .update(agencyClientPortalTokens)
    .set({ lastUsedAt: new Date() })
    .where(eq(agencyClientPortalTokens.id, token.id))
    .execute()
    .catch(() => {});

  return { ok: true, status: "valid", token, client };
}

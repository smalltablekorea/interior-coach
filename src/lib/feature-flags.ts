import { db } from "@/lib/db";
import { featureFlags } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** 피처 플래그가 특정 워크스페이스에서 활성화되어 있는지 확인 */
export async function isFeatureEnabled(key: string, workspaceId?: string): Promise<boolean> {
  try {
    const [flag] = await db
      .select()
      .from(featureFlags)
      .where(eq(featureFlags.key, key));

    if (!flag || !flag.enabled) return false;

    // 전체 허용 (allowedWorkspaces가 null)
    const allowed = flag.allowedWorkspaces as string[] | null;
    if (!allowed && flag.rolloutPercent === 100) return true;

    // 워크스페이스 허용 목록 체크
    if (allowed && workspaceId) {
      if (!allowed.includes(workspaceId)) return false;
    }

    // 롤아웃 퍼센트 체크 (워크스페이스 ID 해시 기반)
    if (flag.rolloutPercent !== null && flag.rolloutPercent < 100 && workspaceId) {
      const hash = simpleHash(workspaceId);
      if (hash % 100 >= flag.rolloutPercent) return false;
    }

    return true;
  } catch {
    return false; // 플래그 조회 실패 시 비활성
  }
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

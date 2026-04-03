import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { getValidToken } from "@/lib/marketing-oauth/token-manager";
import { ok, err, serverError } from "@/lib/api/response";

export async function POST(request: NextRequest) {
  const auth = await requireWorkspaceAuth("marketing", "write");
  if (!auth.ok) return auth.response;

  try {
    const { channel } = await request.json();
    if (!channel) {
      return err("channel required");
    }

    const token = await getValidToken(auth.userId, channel);
    if (!token) {
      return err("토큰 갱신에 실패했습니다. 계정을 다시 연결해주세요.", 401);
    }

    return ok({ success: true });
  } catch (error) {
    return serverError(error);
  }
}

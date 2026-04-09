import { NextRequest } from "next/server";
import { requireWorkspaceAuth } from "@/lib/api-auth";
import { db } from "@/lib/db";
import { siteChatRooms } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { addSSEClient, removeSSEClient } from "@/lib/site-chat/utils";

/** GET /api/site-chat/sse?roomId=xxx — SSE Realtime 구독 */
export async function GET(req: NextRequest) {
  const auth = await requireWorkspaceAuth("sites", "read");
  if (!auth.ok) return auth.response;

  const roomId = req.nextUrl.searchParams.get("roomId");
  if (!roomId) {
    return new Response(JSON.stringify({ error: "roomId는 필수입니다" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 워크스페이스 소속 방 확인
  const [room] = await db
    .select({ id: siteChatRooms.id })
    .from(siteChatRooms)
    .where(and(eq(siteChatRooms.id, roomId), eq(siteChatRooms.workspaceId, auth.workspaceId)))
    .limit(1);

  if (!room) {
    return new Response(JSON.stringify({ error: "톡방을 찾을 수 없습니다" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const client = { controller, roomId };

      // 클라이언트 등록
      addSSEClient(roomId, client);

      // 연결 확인 이벤트
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ roomId })}\n\n`),
      );

      // 30초마다 heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:heartbeat\n\n`));
        } catch {
          clearInterval(heartbeat);
          removeSSEClient(roomId, client);
        }
      }, 30_000);

      // 연결 종료 시 정리
      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        removeSSEClient(roomId, client);
        try {
          controller.close();
        } catch {
          // already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

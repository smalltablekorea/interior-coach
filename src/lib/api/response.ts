import { NextResponse } from "next/server";
import type { ApiResponse, PaginationMeta } from "@/types/api";

/**
 * 표준화된 성공 응답 — 클라이언트가 바로 사용할 수 있도록 data를 직접 반환
 */
export function ok<T>(data: T, _meta?: PaginationMeta): NextResponse {
  return NextResponse.json(data);
}

/**
 * 표준화된 에러 응답
 */
export function err(error: string, status: number = 400): NextResponse<ApiResponse> {
  return NextResponse.json({ success: false, error }, { status });
}

/**
 * 404 Not Found 응답
 */
export function notFound(message: string = "리소스를 찾을 수 없습니다"): NextResponse<ApiResponse> {
  return err(message, 404);
}

/**
 * 403 Forbidden 응답
 */
export function forbidden(message: string = "접근 권한이 없습니다"): NextResponse<ApiResponse> {
  return err(message, 403);
}

/**
 * 500 Internal Server Error
 *
 * drizzle/neon-http가 던지는 'Failed query: insert into ...' 같은 raw SQL·params
 * 메시지를 사용자에게 그대로 노출하면 보안·UX 모두 나쁨.
 * 서버 로그에는 raw 그대로 남기고, 클라이언트엔 친절한 메시지만 보낸다.
 *
 * PostgreSQL 에러 코드(SQLSTATE)를 알면 보다 구체적인 안내가 가능하므로
 * 알려진 코드는 사용자 친화 메시지로 매핑.
 */
const PG_CODE_MESSAGES: Record<string, string> = {
  "23505": "이미 같은 항목이 등록되어 있습니다. 기존 데이터를 수정해주세요.",
  "23503": "참조하는 데이터를 찾을 수 없습니다.",
  "23502": "필수 항목이 누락되었습니다.",
  "22P02": "입력 형식이 올바르지 않습니다.",
  "22001": "입력 값이 너무 깁니다.",
  "22008": "날짜/시간 형식이 올바르지 않습니다.",
};

export function serverError(error: unknown): NextResponse<ApiResponse> {
  // 1) 서버 로그에 raw 에러 (스택 포함) 그대로 기록
  // eslint-disable-next-line no-console
  console.error("[serverError]", error);

  // 2) 클라이언트엔 sanitize된 메시지
  let userMessage = "저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";
  if (error && typeof error === "object") {
    // drizzle 등이 PostgresError를 던지면 code 속성 있음
    const code = (error as { code?: string }).code;
    if (typeof code === "string" && PG_CODE_MESSAGES[code]) {
      userMessage = PG_CODE_MESSAGES[code];
    }
    // raw message에서 PG 코드 패턴 탐지 (drizzle wrapping 우회)
    const raw = (error as { message?: string }).message || "";
    for (const [code, msg] of Object.entries(PG_CODE_MESSAGES)) {
      if (raw.includes(code) || raw.includes(`SQLSTATE: ${code}`)) {
        userMessage = msg;
        break;
      }
    }
    // 흔한 키워드 매핑 (PG 에러 메시지 단어 단위)
    if (raw.includes("duplicate key") || raw.includes("unique constraint")) {
      userMessage = PG_CODE_MESSAGES["23505"];
    } else if (raw.includes("violates foreign key")) {
      userMessage = PG_CODE_MESSAGES["23503"];
    } else if (raw.includes("violates not-null")) {
      userMessage = PG_CODE_MESSAGES["23502"];
    } else if (raw.includes("invalid input syntax for type json")) {
      userMessage = "데이터 형식이 올바르지 않습니다 (JSON 구조 확인 필요).";
    } else if (raw.includes("invalid input syntax for type uuid")) {
      userMessage = "잘못된 ID 형식이 포함되어 있습니다.";
    } else if (raw.includes("invalid input syntax for type")) {
      userMessage = PG_CODE_MESSAGES["22P02"];
    }
  }
  return err(userMessage, 500);
}

import { NextResponse } from "next/server";
import type { ApiResponse, PaginationMeta } from "@/types/api";

/**
 * 표준화된 성공 응답
 */
export function ok<T>(data: T, meta?: PaginationMeta): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data, meta });
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
 */
export function serverError(error: unknown): NextResponse<ApiResponse> {
  const message = error instanceof Error ? error.message : "서버 오류가 발생했습니다";
  return err(message, 500);
}

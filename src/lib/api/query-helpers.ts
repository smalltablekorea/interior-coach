import { NextRequest } from "next/server";
import { sql, desc, asc, type AnyColumn } from "drizzle-orm";
import type { PaginationQuery, PaginationMeta } from "@/types/api";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * URL 쿼리 파라미터에서 페이지네이션 정보를 추출
 */
export function parsePagination(request: NextRequest): PaginationQuery {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || String(DEFAULT_PAGE), 10));
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10)));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * 페이지네이션 메타 정보 생성
 */
export function buildPaginationMeta(total: number, pagination: PaginationQuery): PaginationMeta {
  return {
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
}

/**
 * URL에서 검색/필터 파라미터 추출
 */
export function parseFilters(request: NextRequest, allowedFilters: string[]): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const filters: Record<string, string> = {};

  for (const key of allowedFilters) {
    const value = searchParams.get(key);
    if (value) {
      filters[key] = value;
    }
  }

  return filters;
}

/**
 * 정렬 방향 SQL 생성
 */
export function parseSort(request: NextRequest, defaultColumn: AnyColumn) {
  const { searchParams } = new URL(request.url);
  const order = searchParams.get("order");

  if (order === "asc") {
    return asc(defaultColumn);
  }
  return desc(defaultColumn);
}

/**
 * ILIKE 검색용 패턴 생성
 */
export function searchPattern(term: string): string {
  return `%${term.replace(/[%_]/g, "\\$&")}%`;
}

/**
 * 전체 레코드 수 카운트 쿼리 헬퍼
 */
export function countSql() {
  return sql<number>`cast(count(*) as integer)`;
}

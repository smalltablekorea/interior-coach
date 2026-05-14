/**
 * 마케팅 대행 모듈 운영자 식별.
 *
 * smalltablekorea@gmail.com 단일 계정에만 노출. 다른 계정에는 사이드바
 * "마케팅 대행" 그룹 및 /agency/* 라우트 자체가 비표시.
 */

const OPERATOR_EMAIL = "smalltablekorea@gmail.com";

export function isAgencyOperator(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.toLowerCase() === OPERATOR_EMAIL;
}

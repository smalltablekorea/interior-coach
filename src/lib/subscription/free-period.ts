/**
 * 전면 무료화 기간.
 *
 * 이 기간 동안 모든 사용자는 자동으로 Pro 플랜 권한을 가지며 분석권 차감도 일어나지 않는다.
 * 마감 시각 도달 즉시 자동 종료되어 정상 구독 로직으로 복귀.
 *
 * - 마감: 2026-07-31 24:00 KST (= 2026-08-01 00:00 KST = 2026-07-31 15:00 UTC)
 */
export const FREE_PERIOD_END_AT = new Date("2026-07-31T15:00:00Z");

/** 사용자 안내용 라벨 — "2026년 7월 31일" / "7/31" 등으로 표시. */
export const FREE_PERIOD_END_KO = "2026년 7월 31일";
export const FREE_PERIOD_END_SHORT = "7/31";

/** 전면 무료화 기간이 진행 중인지 여부. 마감 시각 이후엔 false. */
export function isFreePeriodActive(now: number = Date.now()): boolean {
  return now < FREE_PERIOD_END_AT.getTime();
}

/** ExpiringBlock에 넘기기 위한 ISO 문자열. */
export const FREE_PERIOD_END_ISO = "2026-08-01T00:00:00+09:00";

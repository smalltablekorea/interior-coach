"use client";

import { useSyncExternalStore, type ReactNode } from "react";

interface Props {
  /**
   * 마감 시각. ISO 8601 문자열 또는 Date 객체.
   * 타임존을 명시하지 않으면 UTC 기준으로 파싱되니, 한국 시각이면
   * `"2026-06-08T00:00:00+09:00"` 형식으로 명시할 것.
   */
  until: string | Date;
  /** 마감 시각 이전에 표시할 컨텐츠 (시한부 카피). */
  children: ReactNode;
  /** 마감 후 표시할 대체 컨텐츠. 생략하면 마감 후 아무것도 안 보임. */
  fallback?: ReactNode;
}

/**
 * 시한부 카피·배너를 마감 시각이 지나면 자동으로 숨기는 헬퍼.
 *
 * 사용 예 — 한정 프로모 배너:
 * ```tsx
 * <ExpiringBlock
 *   until="2026-06-08T00:00:00+09:00"
 *   fallback={<p>14일 무료 체험 · 카드 등록 불필요</p>}
 * >
 *   <p>🎁 Pro 3주 무료 + 견적코치 10회 (6/8 00시까지)</p>
 * </ExpiringBlock>
 * ```
 *
 * 동작:
 * - `useSyncExternalStore`로 외부 시각을 구독 (React 19 권장 패턴)
 * - SSR: false → children 렌더 (서버·클라이언트 hydration 일치)
 * - 클라이언트: 마운트 시점에 정확한 마감 여부 결정
 * - 페이지를 열어둔 사용자도 자동 전환되도록 주기 폴링:
 *   · 마감까지 1시간 이내: 매 분
 *   · 24시간 이내: 매 5분
 *   · 그 외: 매 1시간
 *
 * 주의:
 * - SEO 노출되는 컨텐츠라면 이 컴포넌트 대신 서버 컴포넌트에서 분기할 것.
 */
export function ExpiringBlock({ until, children, fallback = null }: Props) {
  const deadlineMs =
    typeof until === "string" ? new Date(until).getTime() : until.getTime();

  const expired = useSyncExternalStore(
    (onChange) => subscribeToDeadline(deadlineMs, onChange),
    () => Date.now() >= deadlineMs, // client snapshot
    () => false,                     // server snapshot — children 표시
  );

  return <>{expired ? fallback : children}</>;
}

function subscribeToDeadline(deadlineMs: number, onChange: () => void): () => void {
  const remaining = deadlineMs - Date.now();
  if (remaining <= 0) return () => {};

  // 폴링 주기: 마감 임박할수록 촘촘하게
  const intervalMs =
    remaining < 60 * 60 * 1000 ? 60_000 :
    remaining < 24 * 60 * 60 * 1000 ? 5 * 60_000 :
    60 * 60 * 1000;

  const id = setInterval(onChange, intervalMs);
  return () => clearInterval(id);
}

# Frontend Changelog

## 2026-03-23

### P0-1: 랜딩 페이지 신설 (/)
- `src/app/page.tsx` — 비로그인 사용자용 랜딩 페이지 생성
  - Hero 섹션: "인테리어 업체의 모든 업무, 하나로" + CTA 2개(무료시작, 데모보기)
  - 핵심 기능 4개 카드 (현장관리/견적코치AI/마케팅자동화/세무회계)
  - 소셜프루프: 사용 업체 수, 분석 건수, 만족도 카운터 (IntersectionObserver 애니메이션)
  - 견적코치 미니 데모 (평수슬라이더 + 등급선택 + 공종별 분석 차트)
  - 비용 절감 비교 섹션 (현재 지출 vs 인테리어코치 Pro)
  - 3단계 시작 가이드 섹션
  - CTA 반복 + Footer
- `src/app/(dashboard)/dashboard/page.tsx` — 대시보드를 `/dashboard` 경로로 이동
- `src/app/(dashboard)/page.tsx` — 삭제 (루트 경로 충돌 해소)
- `src/middleware.ts` — `/`, `/pricing` 공개 접근 허용
- `src/components/layout/Sidebar.tsx` — 대시보드 링크 `/` → `/dashboard` 변경

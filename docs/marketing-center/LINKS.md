# 마케팅 센터 통합 링크

> 기준: 2026-03-21

---

## 프론트엔드 페이지 (8개)

| 페이지 | 경로 | 파일 |
|--------|------|------|
| 개요 | `/admin/marketing` | `src/app/(dashboard)/admin/marketing/page.tsx` |
| 퍼널 | `/admin/marketing/funnel` | `src/app/(dashboard)/admin/marketing/funnel/page.tsx` |
| 리드 | `/admin/marketing/leads` | `src/app/(dashboard)/admin/marketing/leads/page.tsx` |
| 세그먼트 | `/admin/marketing/segments` | `src/app/(dashboard)/admin/marketing/segments/page.tsx` |
| 자동화 | `/admin/marketing/automations` | `src/app/(dashboard)/admin/marketing/automations/page.tsx` |
| 캠페인 | `/admin/marketing/campaigns` | `src/app/(dashboard)/admin/marketing/campaigns/page.tsx` |
| 실험 | `/admin/marketing/experiments` | `src/app/(dashboard)/admin/marketing/experiments/page.tsx` |
| 설정 | `/admin/marketing/settings` | `src/app/(dashboard)/admin/marketing/settings/page.tsx` |

레이아웃: `src/app/(dashboard)/admin/marketing/layout.tsx`

---

## 백엔드 API (10개)

| API | 메서드 | 파일 |
|-----|--------|------|
| `/api/admin/marketing/overview` | GET | `src/app/api/admin/marketing/overview/route.ts` |
| `/api/admin/marketing/funnel` | GET | `src/app/api/admin/marketing/funnel/route.ts` |
| `/api/admin/marketing/leads` | GET | `src/app/api/admin/marketing/leads/route.ts` |
| `/api/admin/marketing/leads/[id]` | GET | `src/app/api/admin/marketing/leads/[id]/route.ts` |
| `/api/admin/marketing/segments` | GET/POST/PUT | `src/app/api/admin/marketing/segments/route.ts` |
| `/api/admin/marketing/automations` | GET/POST/PUT | `src/app/api/admin/marketing/automations/route.ts` |
| `/api/admin/marketing/campaigns` | GET/POST/PUT | `src/app/api/admin/marketing/campaigns/route.ts` |
| `/api/admin/marketing/experiments` | GET/POST/PUT | `src/app/api/admin/marketing/experiments/route.ts` |
| `/api/admin/marketing/events` | POST | `src/app/api/admin/marketing/events/route.ts` |
| `/api/admin/marketing/settings` | GET | `src/app/api/admin/marketing/settings/route.ts` |

---

## 공통 파일

| 역할 | 파일 |
|------|------|
| 타입 정의 | `src/lib/types/marketing.ts` |
| DB 스키마 | `src/lib/db/schema.ts` (mkt_* 테이블) |
| 사이드바 | `src/components/layout/Sidebar.tsx` |
| 상수/색상 | `src/lib/constants.ts` |

---

## 기획 문서

| 문서 | 파일 |
|------|------|
| 전략 개요 | `docs/marketing-center/00-strategy-overview.md` |
| KPI 정의 | `docs/marketing-center/01-kpi-definitions.md` |
| 세그먼트 정의 | `docs/marketing-center/02-segment-definitions.md` |
| 자동화 플레이북 | `docs/marketing-center/03-automation-playbook.md` |
| 캠페인 템플릿 | `docs/marketing-center/04-campaign-templates.md` |
| 브랜드 톤 가이드 | `docs/marketing-center/05-brand-tone-guide.md` |
| 운영자 알림 | `docs/marketing-center/06-operator-alerts.md` |
| 구현 메모 | `docs/marketing-center/07-implementation-memo.md` |

---

## 로컬 접속 URL

```
http://localhost:3000/admin/marketing
http://localhost:3000/admin/marketing/funnel
http://localhost:3000/admin/marketing/leads
http://localhost:3000/admin/marketing/segments
http://localhost:3000/admin/marketing/automations
http://localhost:3000/admin/marketing/campaigns
http://localhost:3000/admin/marketing/experiments
http://localhost:3000/admin/marketing/settings
```

---

## 미구현 (TODO)

- [ ] 콘텐츠 스튜디오 (`/admin/marketing/content`)
- [ ] Mock/시드 데이터 삽입
- [ ] 이벤트 수집 클라이언트 SDK
- [ ] 일별 메트릭 배치 작업

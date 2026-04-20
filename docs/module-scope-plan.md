# 인테리어코치 모듈 스코프 계획

작성일: 2026-04-21
브랜치: `refactor/v2-landing-and-modules`
관련 문서:
- 현황: [docs/audit-frontend-2026-04-20.md](audit-frontend-2026-04-20.md)
- 진행 로그: [CHANGELOG.md](../CHANGELOG.md)
- 이전 작업 계획 원본: 대화 기록 (Part 0~O)

---

## 핵심 테이블

| # | 모듈 | 전략 | 완료 기준 요약 | Part |
|---|------|------|--------------|------|
| 1 | 공정매니저 | **기존 유지 + 간트차트 뷰 추가** | `/schedule`에 [캘린더][테이블][간트] 뷰 모드 전환 추가 | Part L |
| 2 | 자재·발주 관리 | **기존 유지** (OCR 완성도 점검만) | 카메라 capture, 다중 업로드, 클라이언트 리사이즈, 결과 확인 모달 개선 | Part O |
| 3 | 현장 손익 관리 | **기존 강화** (다현장 비교 뷰) | `/settlement` 상단에 전현장 마진율 차트 + 예산 초과 경고 리스트 | Part M |
| 4 | 견적서 + 견적코치 AI | **기존 유지** (PDF 출력 추가) | 현재 CSV만 지원 → PDF 내보내기 추가 (`pdf-lib`/`@react-pdf/renderer`) | Part — |
| 5 | 수금관리 | **기존 유지** | 추가 작업 없음 | — |
| 6 | 세금계산서 관리 | **스텁 → 본격 구현 + 알림** | `/tax/invoices` 페이지 재작성 + 미발행 배너 + 알림 설정 토글 | Part H |
| 7 | 하자관리 | **프론트 신규 (백엔드 완비)** | `/defects`, `/defects/[id]`, `/defects/new` + 칸반 + AI 분류 버튼 | Part D |
| 8 | 업무일지 | **프론트 신규 (백엔드 완비)** | `/daily-logs` 목록·상세·작성 + sites/[id] 연동 + PDF 출력 | Part E |
| 9 | 근태급여 | **근태 프론트 신규 + 급여 연동** | `/attendance` 오늘 현황 + 월 달력 + tax/payroll 자동 생성 버튼 | Part F |
| 10 | 반장·기사 인력풀 | **기존 확장** (평점·이력·추천) | workers/[id]에 투입 이력·평점·재고용률 + 공정 배정 drawer | Part G |
| 11 | 월간 리포트 | **완전 신규** | `/reports/monthly/[yearMonth]` + 자동 생성 CRON + PDF/Excel 출력 | Part I |
| 12 | 공사 유형 템플릿 | **기존 확장** (공정+자재 통합) | `/templates` 갤러리 + 신규 현장 플로우에서 선택 | Part J |
| +1 | 추천 보상 시스템 | **완전 신규** (보조 기능) | `/referrals` + 대시보드 배너 + 가입 시 코드 입력 | Part K |
| +2 | 데이터 내보내기 | **기존 확장** (다엔티티 Excel) | `/settings/export` 센터 + `exceljs` + 프로젝트 zip 내보내기 | Part N |

---

## 스코프 판별 기준

| 상태 | 의미 |
|------|------|
| **기존 유지** | 추가 개발 없음. 필요 시 소규모 폴리시만 |
| **기존 강화** | 기존 페이지 위에 신규 섹션/뷰 모드 추가. 페이지는 1개 유지 |
| **기존 확장** | 기존 엔티티에 신규 필드/관계 + 기존 페이지 상세 보강 + 소폭 신규 컴포넌트 |
| **스텁 → 본격** | 플레이스홀더 페이지 전면 재작성 |
| **프론트 신규 (백엔드 완비)** | 백엔드 API/스키마 완성. 페이지·컴포넌트·플로우만 신규 |
| **완전 신규** | 스키마·API·페이지·컴포넌트 모두 신규 |

---

## 의존성·진행 순서 권장

```
기반 (완료)
├ Part 0: 브랜치 분리 ✅
├ Part A: 톡방/포털/서명 철거 ✅
├ Part B: 가격 3티어 ✅
└ Part C: 랜딩 Features 12블록 ✅

백엔드 완비 — 프론트만 붙이면 즉시 작동
├ Part D: 하자관리 (7)
├ Part E: 업무일지 (8)
└ Part O: 자재 OCR UI 점검 (2)

기존 확장 — 스키마 소폭 추가
├ Part F: 근태 + 급여 연동 (9)
├ Part G: 반장·기사 인력풀 (10)
├ Part M: 현장 손익 강화 (3)
└ Part H: 세금계산서 본격 구현 (6)

완전 신규 — 스키마·API·UI 모두
├ Part I: 월간 리포트 (11)
├ Part J: 공사 유형 템플릿 (12)
├ Part K: 추천 보상 (+1)
└ Part N: 데이터 내보내기 (+2)

신규 라이브러리·뷰
├ Part L: 간트차트 (1) — frappe-gantt 등
└ PDF: 견적서 PDF 출력 (4) — pdf-lib 등
```

---

## 세션당 현실적 범위

- **1 세션 ≈ Part 1~2개** (페이지 3~5 + 컴포넌트 5~10 + API 1~2)
- 전체 완료까지 **8~10 세션** 예상
- 각 Part 완료 시 `CHANGELOG.md`에 변경사항 기록 + preview 배포

---

## 완료 기준 (전체)

- TypeScript 에러 0, `npm run build` 성공
- Lighthouse 90+ (랜딩/대시보드)
- 모바일 375px에서 깨짐 없음
- 모든 신규 메뉴에 `checkPermission(myRole, category, "read"/"write")` 적용
- `pathToCategory` 맵에 신규 경로 등록
- 잠실르엘(실제 현장) 데이터로 end-to-end 테스트
- 기존 DB 무손실 (drizzle 0006 미적용 유지)

---

## 라이브러리 도입 예정

| 용도 | 후보 | Part |
|------|------|------|
| 간트차트 | `frappe-gantt` 또는 자체 구현 | Part L |
| PDF 생성 | `pdf-lib` 또는 `@react-pdf/renderer` | Part 4, I |
| Excel 생성 | `exceljs` | Part N |
| 이미지 리사이즈 | `browser-image-compression` | Part O |
| Toast | `sonner` (검토) | 전역 |

번들 사이즈 증가 우려 — `next/dynamic` 으로 code-split 기본.

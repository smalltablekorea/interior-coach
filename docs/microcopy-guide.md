# 인테리어코치 대시보드 마이크로카피 가이드 / Dashboard Microcopy Guide

> **브랜드 보이스**: 전문적이면서 친근한 동료의 톤 (해요체)
> **Brand Voice**: Professional yet friendly colleague tone
> **슬로건**: "인테리어 업체의 모든 업무, 하나로."

---

## 1. 대시보드 메인 / Dashboard Main

### 1-1. 인사말 패턴 / Greeting Patterns

| 시간대 | KO | EN Key |
|---|---|---|
| 06:00–11:59 | 좋은 아침이에요, {name} 대표님! | `greeting.morning` |
| 12:00–17:59 | 오후도 힘내세요, {name} 대표님! | `greeting.afternoon` |
| 18:00–21:59 | 오늘 하루 수고했어요, {name} 대표님! | `greeting.evening` |
| 22:00–05:59 | 늦은 시간까지 고생 많으세요, {name} 대표님! | `greeting.night` |

**서브 인사말 (인사말 아래 한 줄)**

| 조건 | KO | EN Key |
|---|---|---|
| 진행 중 현장 있음 | 현재 진행 중인 현장이 {count}건이에요. | `greeting.sub.activeSites` |
| 오늘 일정 있음 | 오늘 예정된 일정이 {count}건 있어요. | `greeting.sub.todaySchedule` |
| 미수금 있음 | 확인이 필요한 미수금이 있어요. | `greeting.sub.unpaidAlert` |
| 조건 없음 (기본) | 오늘도 좋은 하루 되세요! | `greeting.sub.default` |

### 1-2. 빈 대시보드 (첫 사용자) / Empty Dashboard (First-time User)

| 항목 | KO | EN Key |
|---|---|---|
| 메인 타이틀 | 인테리어코치에 오신 걸 환영해요! | `empty.dashboard.title` |
| 서브 텍스트 | 첫 현장을 등록하면 대시보드가 채워져요. 시작해볼까요? | `empty.dashboard.subtitle` |
| CTA 버튼 | 첫 현장 등록하기 | `empty.dashboard.cta` |
| 보조 안내 | 현장을 등록하면 매출, 공정, 수금 현황을 한눈에 볼 수 있어요. | `empty.dashboard.guide` |
| 데모 제안 | 샘플 데이터로 먼저 둘러보기 | `empty.dashboard.demo` |

### 1-3. 로딩 상태 / Loading States

| 항목 | KO | EN Key |
|---|---|---|
| 대시보드 로딩 | 대시보드를 준비하고 있어요... | `loading.dashboard` |
| KPI 로딩 | 최신 데이터를 불러오고 있어요... | `loading.kpi` |
| 차트 로딩 | 차트를 그리고 있어요... | `loading.chart` |
| 부분 갱신 | 데이터를 업데이트하고 있어요... | `loading.refresh` |
| 긴 로딩 (3초+) | 조금만 기다려주세요, 거의 다 됐어요! | `loading.long` |

---

## 2. KPI 카드 섹션 / KPI Card Section

### 2-1. KPI 카드 타이틀 및 부가 텍스트

| KPI | KO 타이틀 | KO 부가 텍스트 | EN Key |
|---|---|---|---|
| 이번 달 매출 | 이번 달 매출 | 계약금 + 중도금 + 잔금 기준 | `kpi.revenue.title` / `kpi.revenue.desc` |
| 진행 중 현장 | 진행 중 현장 | 착공~준공 사이 현장 | `kpi.activeSites.title` / `kpi.activeSites.desc` |
| 미수금 | 미수금 잔액 | 수금 예정일이 지난 금액 포함 | `kpi.unpaid.title` / `kpi.unpaid.desc` |
| 순이익률 | 순이익률 | (매출 - 실행가) ÷ 매출 | `kpi.profitRate.title` / `kpi.profitRate.desc` |
| 하자 접수 | 미처리 하자 | A/S 접수 후 미완료 건 | `kpi.defects.title` / `kpi.defects.desc` |
| 계약 전환율 | 계약 전환율 | 상담 대비 계약 체결 비율 | `kpi.conversionRate.title` / `kpi.conversionRate.desc` |
| 공정 진행률 | 평균 공정 진행률 | 전체 현장 공정률 평균 | `kpi.progress.title` / `kpi.progress.desc` |
| 이번 달 지출 | 이번 달 지출 | 자재비 + 인건비 + 외주비 | `kpi.expense.title` / `kpi.expense.desc` |

### 2-2. 수치 표현 방식 / Number Formatting

| 유형 | KO 형식 | 예시 | EN Key |
|---|---|---|---|
| 금액 (1억 이상) | {n}억 {m}만원 | 1억 2,300만원 | `format.currency.billion` |
| 금액 (1만원 이상) | {n}만원 | 4,500만원 | `format.currency.tenThousand` |
| 금액 (1만원 미만) | {n}원 | 8,500원 | `format.currency.won` |
| 건수 | {n}건 | 12건 | `format.count` |
| 비율 | {n}% | 78.5% | `format.percent` |
| 현장 수 | {n}개 현장 | 5개 현장 | `format.sites` |
| 일수 | {n}일 | 14일 | `format.days` |
| 금액 없음 | - 원 | - 원 | `format.currency.empty` |

### 2-3. 트렌드 라벨 / Trend Labels

| 조건 | KO | EN Key |
|---|---|---|
| 전월 대비 증가 | 전월 대비 {n}% 증가 ▲ | `trend.monthly.increase` |
| 전월 대비 감소 | 전월 대비 {n}% 감소 ▼ | `trend.monthly.decrease` |
| 전월 대비 동일 | 전월과 동일해요 | `trend.monthly.same` |
| 전주 대비 증가 | 지난주보다 {n}% 올랐어요 | `trend.weekly.increase` |
| 전주 대비 감소 | 지난주보다 {n}% 줄었어요 | `trend.weekly.decrease` |
| 데이터 부족 | 비교할 지난달 데이터가 아직 없어요 | `trend.noData` |
| 긍정 트렌드 부가 | 좋은 흐름이에요! | `trend.positive` |
| 부정 트렌드 부가 | 확인이 필요해요 | `trend.negative` |

---

## 3. 액션 아이템 섹션 / Action Items Section

### 3-1. 섹션 헤더

| 항목 | KO | EN Key |
|---|---|---|
| 섹션 타이틀 | 확인이 필요한 항목 | `actionItems.title` |
| 서브 텍스트 | 우선 처리가 필요한 항목을 모았어요 | `actionItems.subtitle` |
| 배지 | {n}건 | `actionItems.badge` |

### 3-2. 미수금 알림 마이크로카피

| 조건 | KO | EN Key |
|---|---|---|
| 수금 예정일 D-7 | {siteName} 수금 예정일이 7일 남았어요 | `action.unpaid.dueIn7` |
| 수금 예정일 D-3 | {siteName} 수금일이 3일 남았어요. 미리 안내해보세요 | `action.unpaid.dueIn3` |
| 수금 예정일 D-Day | {siteName} 오늘이 수금 예정일이에요 | `action.unpaid.dueToday` |
| 수금 연체 D+1~7 | {siteName} 수금이 {n}일 지났어요. 확인해보세요 | `action.unpaid.overdue` |
| 수금 연체 D+8~30 | {siteName} 미수금 {amount}이 {n}일째 미수금이에요 | `action.unpaid.overdueWarning` |
| 수금 연체 D+30 이상 | {siteName} 장기 미수금이에요. 조치가 필요해요 | `action.unpaid.overdueCritical` |
| CTA | 수금 현황 보기 | `action.unpaid.cta` |

### 3-3. 공정 지연 알림

| 조건 | KO | EN Key |
|---|---|---|
| 공정 지연 1~3일 | {siteName} {tradeName} 공정이 {n}일 지연되고 있어요 | `action.delay.mild` |
| 공정 지연 4~7일 | {siteName} {tradeName} 공정이 {n}일 지연 중이에요. 일정 조정이 필요해요 | `action.delay.moderate` |
| 공정 지연 7일 이상 | {siteName} {tradeName} 공정이 {n}일 이상 지연되고 있어요. 즉시 확인해주세요 | `action.delay.severe` |
| CTA | 공정표 확인하기 | `action.delay.cta` |

### 3-4. 하자 접수 알림

| 조건 | KO | EN Key |
|---|---|---|
| 신규 하자 접수 | {siteName}에서 하자가 접수됐어요 ({defectType}) | `action.defect.new` |
| 하자 미처리 3일+ | {siteName} 하자 처리가 {n}일째 지연되고 있어요 | `action.defect.pending` |
| 하자 처리 완료 확인 요청 | {siteName} 하자 처리가 완료됐어요. 확인해주세요 | `action.defect.review` |
| CTA | 하자 현황 보기 | `action.defect.cta` |

### 3-5. 빈 상태

| 항목 | KO | EN Key |
|---|---|---|
| 빈 상태 메인 | 처리할 항목이 없어요 | `actionItems.empty.title` |
| 빈 상태 서브 | 잘하고 계세요! 모든 항목이 정리됐어요. | `actionItems.empty.subtitle` |
| 이모티콘 대체 텍스트 | (체크 아이콘) | `actionItems.empty.icon` |

---

## 4. 캐시플로우 / Cash Flow

### 4-1. 순이익 표시

| 조건 | KO | EN Key |
|---|---|---|
| 흑자 | 이번 달 순이익 +{amount} | `cashflow.profit.positive` |
| 적자 | 이번 달 순손실 -{amount} | `cashflow.profit.negative` |
| 손익분기 | 이번 달 손익이 거의 0이에요 | `cashflow.profit.breakeven` |
| 흑자 부가 | 좋은 흐름을 유지하고 있어요! | `cashflow.profit.positiveNote` |
| 적자 부가 | 지출 항목을 한번 점검해보세요 | `cashflow.profit.negativeNote` |

### 4-2. 미수금 경고

| 조건 | KO | EN Key |
|---|---|---|
| 미수금 정상 범위 | 미수금이 정상 범위예요 | `cashflow.unpaid.normal` |
| 미수금 주의 (매출 대비 30%+) | 미수금 비율이 높아지고 있어요. 수금 계획을 확인해보세요 | `cashflow.unpaid.caution` |
| 미수금 경고 (매출 대비 50%+) | 미수금이 매출의 절반을 넘었어요. 즉시 확인이 필요해요 | `cashflow.unpaid.warning` |
| 미수금 총액 | 총 미수금 {amount} ({count}건) | `cashflow.unpaid.total` |

### 4-3. 수금/지출 비교

| 항목 | KO | EN Key |
|---|---|---|
| 수금 라벨 | 수금 (입금 완료) | `cashflow.collection.label` |
| 지출 라벨 | 지출 (집행 완료) | `cashflow.expense.label` |
| 수금 > 지출 | 수금이 지출보다 {amount} 많아요 | `cashflow.comparison.surplus` |
| 지출 > 수금 | 지출이 수금보다 {amount} 많아요. 자금 흐름을 확인해보세요 | `cashflow.comparison.deficit` |
| 예정 수금 | 이번 달 수금 예정 {amount} | `cashflow.collection.expected` |
| 예정 지출 | 이번 달 지출 예정 {amount} | `cashflow.expense.expected` |

---

## 5. 헬스스코어 / Health Score

### 5-1. 점수별 메시지

| 점수 범위 | KO 메인 메시지 | KO 서브 메시지 | EN Key |
|---|---|---|---|
| 90~100 | 아주 잘 관리하고 계세요! | 현재 상태를 유지하면 돼요 | `health.score.excellent` |
| 70~89 | 전반적으로 양호해요 | 몇 가지만 개선하면 더 좋아져요 | `health.score.good` |
| 50~69 | 개선이 필요한 부분이 있어요 | 아래 항목을 우선 확인해보세요 | `health.score.fair` |
| 0~49 | 즉시 확인이 필요해요 | 중요한 항목부터 하나씩 해결해봐요 | `health.score.poor` |

### 5-2. 각 지표 라벨 및 설명

| 지표 | KO 라벨 | KO 설명 | EN Key |
|---|---|---|---|
| 수금률 | 수금률 | 청구 대비 실제 수금된 비율이에요 | `health.metric.collectionRate` |
| 공정 준수율 | 공정 준수율 | 계획 대비 실제 공정 진행률이에요 | `health.metric.scheduleAdherence` |
| 하자 해결률 | 하자 해결률 | 접수된 하자 중 처리 완료된 비율이에요 | `health.metric.defectResolution` |
| 수익률 | 수익률 | 계약 대비 실제 수익 비율이에요 | `health.metric.profitability` |
| 고객 만족도 | 고객 만족도 | 완공 후 고객 평가 평균이에요 | `health.metric.satisfaction` |

### 5-3. 지표 상태 표현

| 상태 | KO | EN Key |
|---|---|---|
| 양호 | 양호 | `health.status.good` |
| 주의 | 주의 | `health.status.caution` |
| 경고 | 경고 | `health.status.warning` |
| 위험 | 위험 | `health.status.danger` |

---

## 6. 수익/정산 / Revenue & Settlement

### 6-1. 프로젝트별 수익률 표현

| 조건 | KO | EN Key |
|---|---|---|
| 수익률 양호 (15%+) | 수익률 {n}% — 목표 이상이에요 | `revenue.profitRate.good` |
| 수익률 보통 (5~14%) | 수익률 {n}% — 평균 수준이에요 | `revenue.profitRate.normal` |
| 수익률 저조 (0~4%) | 수익률 {n}% — 실행가를 점검해보세요 | `revenue.profitRate.low` |
| 수익률 마이너스 | 수익률 {n}% — 적자 현장이에요. 원인 분석이 필요해요 | `revenue.profitRate.negative` |

### 6-2. 계약/실행 비교

| 항목 | KO | EN Key |
|---|---|---|
| 계약가 라벨 | 계약가 | `revenue.contract.label` |
| 실행가 라벨 | 실행가 (실제 투입 비용) | `revenue.actual.label` |
| 차액 (이익) | 계약가 대비 {amount} 이익 | `revenue.diff.profit` |
| 차액 (손실) | 계약가 대비 {amount} 초과 지출 | `revenue.diff.loss` |
| 실행률 | 실행률 {n}% (계약가 대비 실제 비용) | `revenue.executionRate` |
| 실행률 주의 (90%+) | 실행률이 높아요. 추가 지출에 주의하세요 | `revenue.executionRate.caution` |

---

## 7. 드릴다운 모달 / Drill-down Modal

### 7-1. 상세 보기 진입 텍스트

| 항목 | KO | EN Key |
|---|---|---|
| KPI 카드 클릭 유도 | 자세히 보기 | `drilldown.viewDetail` |
| 카드 hover 힌트 | 클릭하면 상세 내역을 볼 수 있어요 | `drilldown.hoverHint` |
| 모달 타이틀 패턴 | {cardTitle} 상세 | `drilldown.modal.title` |
| 모달 서브 텍스트 | {period} 기준 데이터예요 | `drilldown.modal.subtitle` |

### 7-2. "전체 보기" 링크 텍스트

| 항목 | KO | EN Key |
|---|---|---|
| 전체 보기 (일반) | 전체 보기 → | `drilldown.viewAll` |
| 전체 보기 (현장) | 전체 현장 보기 → | `drilldown.viewAllSites` |
| 전체 보기 (거래) | 전체 거래 내역 보기 → | `drilldown.viewAllTransactions` |
| 전체 보기 (하자) | 전체 하자 내역 보기 → | `drilldown.viewAllDefects` |
| 모달 닫기 | 닫기 | `drilldown.close` |

---

## 8. 정산 페이지 연계 / Settlement & Billing

### 8-1. 수금 독촉 관련 마이크로카피

| 항목 | KO | EN Key |
|---|---|---|
| 독촉 안내 문구 | 수금 안내 메시지를 보낼 수 있어요 | `settlement.reminder.guide` |
| 독촉 발송 CTA | 수금 안내 보내기 | `settlement.reminder.cta` |
| 독촉 발송 완료 | 수금 안내를 보냈어요 | `settlement.reminder.sent` |
| 독촉 문자 기본 템플릿 | {clientName}님, {siteName} 공사 관련 {amount} 수금 안내드려요. 확인 부탁드립니다. | `settlement.reminder.smsTemplate` |
| 재발송 확인 | 이미 안내를 보냈어요. 다시 보낼까요? | `settlement.reminder.resendConfirm` |
| 수금 완료 처리 | 수금 완료로 변경할까요? | `settlement.collection.confirmComplete` |
| 수금 완료 후 | 수금 처리됐어요! | `settlement.collection.completed` |

### 8-2. 세금계산서 발행 안내

| 항목 | KO | EN Key |
|---|---|---|
| 발행 안내 | 세금계산서를 발행해야 하는 건이 {count}건 있어요 | `settlement.tax.pendingGuide` |
| 발행 CTA | 세금계산서 발행하기 | `settlement.tax.issueCta` |
| 발행 완료 | 세금계산서가 발행됐어요 | `settlement.tax.issued` |
| 발행 실패 | 세금계산서 발행에 실패했어요. 사업자 정보를 확인해주세요 | `settlement.tax.issueFailed` |
| 기한 안내 | {month}월 세금계산서 발행 기한은 {deadline}까지예요 | `settlement.tax.deadline` |
| 발행 불필요 | 이번 달 발행할 세금계산서가 없어요 | `settlement.tax.noPending` |

---

## 9. 하자/시공 관련 / Defects & Construction

### 9-1. 하자 등록 안내

| 항목 | KO | EN Key |
|---|---|---|
| 등록 안내 | 하자 내용과 사진을 등록해주세요 | `defect.register.guide` |
| 사진 첨부 안내 | 하자 부위 사진을 첨부하면 처리가 빨라져요 | `defect.register.photoHint` |
| 등록 완료 | 하자가 접수됐어요. 담당자에게 알림이 전달돼요 | `defect.register.completed` |
| 필수 항목 안내 | 현장, 하자 유형, 위치는 필수 입력이에요 | `defect.register.required` |

### 9-2. 하자 상태 라벨

| 상태 | KO | EN Key | 색상 권장 |
|---|---|---|---|
| 접수 | 접수 | `defect.status.received` | Gray/Blue |
| 처리중 | 처리중 | `defect.status.inProgress` | Yellow/Orange |
| 완료 | 완료 | `defect.status.resolved` | Green |
| 반려 | 반려 | `defect.status.rejected` | Red |

**상태 변경 시 안내 메시지**

| 변경 | KO | EN Key |
|---|---|---|
| 접수 → 처리중 | 하자 처리가 시작됐어요 | `defect.statusChange.toInProgress` |
| 처리중 → 완료 | 하자 처리가 완료됐어요. 확인해주세요 | `defect.statusChange.toResolved` |
| 접수/처리중 → 반려 | 하자 접수가 반려됐어요. 사유를 확인해주세요 | `defect.statusChange.toRejected` |

### 9-3. 하자 심각도 표현

| 심각도 | KO 라벨 | KO 설명 | EN Key | 색상 권장 |
|---|---|---|---|---|
| 경미 | 경미 | 사용에 지장 없는 외관 하자 | `defect.severity.minor` | Green |
| 보통 | 보통 | 기능에 일부 영향이 있는 하자 | `defect.severity.moderate` | Yellow |
| 심각 | 심각 | 사용에 지장이 있는 구조/기능 하자 | `defect.severity.major` | Orange |
| 긴급 | 긴급 | 안전 문제로 즉시 조치가 필요해요 | `defect.severity.critical` | Red |

---

## 10. 공통 패턴 / Common Patterns

### 10-1. 에러 메시지 (친근한 톤)

| 유형 | KO | EN Key |
|---|---|---|
| 일반 에러 | 앗, 문제가 생겼어요. 잠시 후 다시 시도해주세요 | `error.general` |
| 네트워크 에러 | 인터넷 연결을 확인해주세요 | `error.network` |
| 서버 에러 | 서버에 문제가 생겼어요. 잠시 후 다시 시도해주세요 | `error.server` |
| 권한 없음 | 이 페이지에 접근 권한이 없어요 | `error.forbidden` |
| 페이지 없음 (404) | 찾으시는 페이지가 없어요. 주소를 다시 확인해주세요 | `error.notFound` |
| 세션 만료 | 로그인이 만료됐어요. 다시 로그인해주세요 | `error.sessionExpired` |
| 입력값 오류 | 입력 내용을 다시 확인해주세요 | `error.validation` |
| 파일 업로드 실패 | 파일 업로드에 실패했어요. 파일 크기와 형식을 확인해주세요 | `error.uploadFailed` |
| 중복 데이터 | 이미 등록된 데이터예요 | `error.duplicate` |
| 시간 초과 | 요청 시간이 초과됐어요. 다시 시도해주세요 | `error.timeout` |
| 재시도 CTA | 다시 시도하기 | `error.retryCta` |

### 10-2. 성공 메시지

| 유형 | KO | EN Key |
|---|---|---|
| 저장 완료 | 저장됐어요! | `success.saved` |
| 등록 완료 | 등록됐어요! | `success.created` |
| 수정 완료 | 수정됐어요! | `success.updated` |
| 삭제 완료 | 삭제됐어요 | `success.deleted` |
| 발송 완료 | 발송됐어요! | `success.sent` |
| 복사 완료 | 클립보드에 복사됐어요 | `success.copied` |
| 내보내기 완료 | 내보내기가 완료됐어요 | `success.exported` |

### 10-3. 확인 다이얼로그

| 유형 | KO 타이틀 | KO 본문 | KO 확인 | KO 취소 | EN Key |
|---|---|---|---|---|---|
| 삭제 확인 | 정말 삭제할까요? | 삭제하면 되돌릴 수 없어요 | 삭제하기 | 취소 | `confirm.delete` |
| 나가기 확인 | 변경사항이 있어요 | 저장하지 않고 나가면 변경사항이 사라져요 | 나가기 | 계속 작성 | `confirm.leave` |
| 상태 변경 | 상태를 변경할까요? | {from}에서 {to}(으)로 변경해요 | 변경하기 | 취소 | `confirm.statusChange` |
| 발송 확인 | 메시지를 보낼까요? | {recipient}에게 발송해요 | 보내기 | 취소 | `confirm.send` |
| 일괄 처리 | {count}건을 일괄 처리할까요? | 선택한 항목에 모두 적용돼요 | 처리하기 | 취소 | `confirm.bulk` |

### 10-4. 빈 상태 메시지

| 항목 | KO | EN Key |
|---|---|---|
| 현장 없음 | 아직 등록된 현장이 없어요 | `empty.sites` |
| 견적 없음 | 아직 작성된 견적이 없어요 | `empty.estimates` |
| 거래 내역 없음 | 아직 거래 내역이 없어요 | `empty.transactions` |
| 알림 없음 | 새로운 알림이 없어요 | `empty.notifications` |
| 검색 결과 없음 | 검색 결과가 없어요. 다른 조건으로 검색해보세요 | `empty.searchResults` |
| 필터 결과 없음 | 조건에 맞는 항목이 없어요. 필터를 조정해보세요 | `empty.filterResults` |
| 하자 없음 | 접수된 하자가 없어요 | `empty.defects` |
| 일정 없음 | 오늘 예정된 일정이 없어요 | `empty.schedule` |

### 10-5. 로딩 텍스트

| 항목 | KO | EN Key |
|---|---|---|
| 목록 로딩 | 목록을 불러오고 있어요... | `loading.list` |
| 저장 중 | 저장하고 있어요... | `loading.saving` |
| 삭제 중 | 삭제하고 있어요... | `loading.deleting` |
| 업로드 중 | 업로드 중이에요... ({n}%) | `loading.uploading` |
| 내보내기 중 | 파일을 만들고 있어요... | `loading.exporting` |
| 발송 중 | 발송하고 있어요... | `loading.sending` |
| 계산 중 | 계산하고 있어요... | `loading.calculating` |

### 10-6. 툴팁 텍스트

| 항목 | KO | EN Key |
|---|---|---|
| KPI 도움말 패턴 | {metric}: {description} | `tooltip.kpi` |
| 차트 도움말 | 기간을 변경하려면 위 탭을 눌러주세요 | `tooltip.chart.period` |
| 수치 계산 방식 | 이 수치는 {formula}으로 계산돼요 | `tooltip.formula` |
| 마지막 업데이트 | 마지막 업데이트: {datetime} | `tooltip.lastUpdated` |
| 기능 안내 | 이 기능은 {featureDesc} | `tooltip.featureGuide` |

---

## 11. 용어 표준화 / Terminology Standardization

### 11-1. 한글/영문 용어 대응표

| KO (화면 표시) | EN (코드/키) | 설명 |
|---|---|---|
| 현장 | Site | 시공이 이루어지는 장소/프로젝트 단위 |
| 공종 | Trade | 시공의 세부 분류 (목공, 전기, 타일 등) |
| 공정 | Process / Phase | 시공의 순서/단계 |
| 공정표 | Schedule | 공정 일정 계획표 |
| 계약가 | Contract Price | 고객과 계약한 공사 금액 |
| 실행가 | Actual Cost | 실제 투입된 비용 (자재+인건비+외주) |
| 실행률 | Execution Rate | 계약가 대비 실행가 비율 |
| 견적 | Estimate | 공사 전 비용 산출서 |
| 견적서 | Quotation | 고객에게 전달하는 공식 견적 문서 |
| 수금 | Collection | 고객으로부터 받는 대금 |
| 미수금 | Unpaid / Receivable | 아직 수금되지 않은 금액 |
| 계약금 | Down Payment | 계약 시 받는 선금 |
| 중도금 | Progress Payment | 공사 중간에 받는 금액 |
| 잔금 | Final Payment | 공사 완료 후 받는 금액 |
| 순이익 | Net Profit | 매출 - 전체 비용 |
| 순이익률 | Net Profit Rate | 순이익 / 매출 |
| 하자 | Defect | 시공 완료 후 발생한 품질 문제 |
| 하자 보수 | Defect Repair | 하자 처리/수리 작업 |
| A/S | After Service | 시공 후 하자 보수 서비스 |
| 착공 | Start / Commencement | 공사 시작 |
| 준공 | Completion | 공사 완료 |
| 자재비 | Material Cost | 자재 구매 비용 |
| 인건비 | Labor Cost | 인력 투입 비용 |
| 외주비 | Subcontract Cost | 외주 업체 비용 |
| 세금계산서 | Tax Invoice | 부가가치세 신고용 세금 문서 |
| 거래명세서 | Transaction Statement | 거래 내역 명세 문서 |
| 매출 | Revenue | 총 수입 금액 |
| 지출 | Expense | 총 지출 금액 |
| 캐시플로우 | Cash Flow | 자금의 유입/유출 흐름 |
| 헬스스코어 | Health Score | 업체 경영 건전성 종합 점수 |
| 드릴다운 | Drill-down | 요약에서 상세로 들어가는 탐색 |
| 대시보드 | Dashboard | 주요 지표 요약 화면 |
| 고객 | Client | 인테리어 공사 의뢰인 |
| 업체 | Company / Firm | 인테리어 시공 업체 |
| 협력업체 | Subcontractor | 하도급 시공 업체 |
| 마감 | Finishing | 내부 마감 공사 (도배, 페인트 등) |
| 철거 | Demolition | 기존 구조물/마감 해체 |
| 설비 | MEP (Mechanical, Electrical, Plumbing) | 기계/전기/배관 설비 |

### 11-2. 금지 용어 및 대체어

| 금지 | 사유 | 대체어 |
|---|---|---|
| 에러가 발생했습니다 | 딱딱한 어투, 기술 용어 | 문제가 생겼어요 |
| 실패했습니다 | 부정적이고 딱딱함 | ~하지 못했어요 / ~에 실패했어요 |
| 경고! / 주의! | 과도한 경고 톤 | 확인이 필요해요 |
| 오류 | 기술 용어 | 문제 |
| 필수입니다 | 딱딱함 | 필수 입력이에요 |
| ~하십시오 | 격식 과다 | ~해주세요 / ~해보세요 |
| ~합니다 / ~됩니다 | 브랜드 보이스 불일치 | ~해요 / ~돼요 |
| 유효하지 않은 값 | 기술 용어 | 입력 내용을 확인해주세요 |
| NULL / undefined | 기술 용어 (화면 노출 금지) | 정보 없음 / (표시하지 않음) |
| 로딩중... | 영어 혼용 | 불러오고 있어요... |
| 프로세스 | 영어 남용 | 절차 / 과정 / 공정 |
| 밸리데이션 | 영어 남용 | 입력 확인 |
| 리다이렉트 | 영어 남용 | 페이지 이동 |
| 인증 토큰 만료 | 기술 용어 | 로그인이 만료됐어요 |
| 서버 500 에러 | 기술 용어 | 서버에 문제가 생겼어요 |
| 딜리트 | 영어 남용 | 삭제 |
| 셀렉트 | 영어 남용 | 선택 |
| 인풋 | 영어 남용 | 입력 |

---

## 부록: 마이크로카피 작성 원칙 / Writing Principles

### A. 톤 & 보이스 원칙

1. **해요체 통일**: 모든 UI 텍스트는 해요체로 작성해요. (~합니다, ~하십시오 금지)
2. **친근한 동료 톤**: 전문 용어를 쓰되 설명을 곁들여요. "실행률이 90%를 넘었어요"처럼.
3. **긍정 우선**: 부정문보다 긍정문을 먼저 제시해요. "~할 수 없어요" 대신 "~하면 ~할 수 있어요".
4. **행동 유도**: 문제 제시 후 반드시 다음 행동(CTA)을 안내해요.
5. **간결함**: 한 문장은 최대 30자 내외로, 핵심만 전달해요.

### B. 숫자/단위 원칙

1. 금액: 만원 단위로 끊어 표시 (4,500만원), 1억 이상은 억+만원 혼용 (1억 2,300만원)
2. 비율: 소수점 첫째 자리까지 (78.5%), 정수인 경우 소수점 생략 (80%)
3. 건수: 아라비아 숫자 + "건" (12건)
4. 날짜: YYYY.MM.DD 또는 "M월 D일" (4월 1일)
5. 기간: "N일", "N개월" (14일, 3개월)

### C. 아이콘 사용 원칙

| 용도 | 권장 아이콘 유형 | 비고 |
|---|---|---|
| 증가/긍정 | 위 화살표 (▲) / 초록색 | 매출 증가, 수금률 증가 |
| 감소/부정 | 아래 화살표 (▼) / 빨간색 | 매출 감소, 미수금 증가 |
| 경고/주의 | 경고 삼각형 / 노란색 | 공정 지연, 미수금 주의 |
| 정보/안내 | 정보 원형 (i) / 파란색 | 툴팁, 부가 설명 |
| 성공/완료 | 체크마크 / 초록색 | 저장 완료, 수금 완료 |
| 에러/실패 | X 원형 / 빨간색 | 에러 메시지, 발행 실패 |

---

이 가이드는 인테리어코치 SaaS 전체 대시보드에 일관된 마이크로카피를 적용하기 위한 기준 문서입니다. 모든 UI 텍스트는 이 가이드의 톤, 용어, 패턴을 따라야 하며, 새로운 기능 추가 시 이 가이드를 우선 참조하여 일관성을 유지해야 합니다.

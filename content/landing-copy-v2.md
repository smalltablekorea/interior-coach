# 랜딩 카피 v2 — 인테리어코치

> 작성일: 2026-04-21
> 교체 대상: `src/content/landing.ts` (`landingCopy` export의 값만 교체; 구조 동일)
> 금지 언급: **현장 톡방 / 고객 포털 / 전자서명** (철거된 기능이므로 카피에서 절대 언급 금지)
> 3대 차별 축: ①OCR·AI 타이핑 최소화 ②자재 DB 868건 + 견적~정산 한 라인 ③현직 인테리어 대표 설계
> 3티어 구조: **무료 / 월간 결제 / 연간 결제**

---

## 1) Nav

| key | 한국어 | 비고 |
|---|---|---|
| `nav.logo` | 인테리어코치 | 텍스트 로고 |
| `nav.links[0].label` | 기능 | `#features` |
| `nav.links[1].label` | 케이스 | `#case` |
| `nav.links[2].label` | 요금제 | `#pricing` |
| `nav.links[3].label` | FAQ | `#faq` |
| `nav.ctaLogin.label` | 로그인 | `/auth/login` |
| `nav.ctaSignup.label` | **무료로 시작** | `/auth/signup` |

---

## 2) Hero

### Eyebrow 3안 (각 25자 이내)

| key | 카피 | 글자수 |
|---|---|---|
| `hero.eyebrow_a` ⭐ | 인테리어 업체 대표를 위한 현장 운영 올인원 | 22 |
| `hero.eyebrow_b` | 사진·영수증을 사장님 대신 읽는 AI SaaS | 22 |
| `hero.eyebrow_c` | 자재 단가 868건 내장 · 견적부터 정산까지 | 23 |

**채택 추천안**: `hero.eyebrow_a` — 타겟과 제품 정체성을 가장 깔끔하게 고정.

### Title 3안 (2줄, 줄당 20자 이내)

| key | 1줄 | 2줄 | 비고 |
|---|---|---|---|
| `hero.title_a` ⭐ | 사진 찍고 지나가면 | **AI가 장부를 씁니다** | 감정형 + AI 자동 |
| `hero.title_b` | 현장 3개를, 엑셀 없이 | **한 화면에서 돌립니다** | 숫자 + 명확 |
| `hero.title_c` | 타이핑 대신 셔터 한 번 | **견적과 정산이 끝납니다** | 동작형 + 결과 |

**채택 추천안**: `hero.title_a` — "사진 찍고 지나가면"이 사장님 동작을, "AI가 장부를 씁니다"가 자동화 약속을 직관적으로 전달.

### Subtitle 3안 (2줄, 줄당 40자 이내)

| key | 1줄 | 2줄 | 키워드 |
|---|---|---|---|
| `hero.subtitle_a` ⭐ | 영수증·하자 사진·업무일지까지, OCR과 AI가 먼저 읽습니다. | 868건 자재 DB로 견적·수금·세금계산서가 한 숫자로 이어집니다. | OCR+AI+868 |
| `hero.subtitle_b` | 현장 3개를 동시에 돌려도 손익이 실시간으로 보입니다. | 다현장 대시보드 · 월간 리포트 · 자동 이메일까지. | 숫자 + 기능 |
| `hero.subtitle_c` | 7년차 현역 인테리어 대표가 매일 자기 현장에서 씁니다. | 기획자가 상상한 기능이 아니라, 사장님이 필요한 기능만. | 감정 + 신뢰 |

**채택 추천안**: `hero.subtitle_a` — 3대 차별 축 중 ①OCR·AI와 ②자재 DB·한 라인을 동시에 소화.

### Primary / Secondary CTA

| key | 카피 |
|---|---|
| `hero.primaryCta.label` | **무료로 시작하기** (14일 유료 체험 포함) |
| `hero.primaryCta.href` | `/auth/signup` |
| `hero.secondaryCta.label` | 3분 데모 영상 |
| `hero.secondaryCta.href` | `/demo-request` |

### Meta line (60자 이내)

| key | 카피 |
|---|---|
| `hero.meta` | 카드 등록 불필요 · 2분 만에 첫 현장 등록 · 언제든 해지 |

---

## 3) Pain Points

### Eyebrow / Title

| key | 카피 |
|---|---|
| `painPoints.eyebrow` | 이런 하루, 익숙하시죠 |
| `painPoints.title` | 현장이 늘어날수록 / 사장님 시간만 녹는 구조 |

### 4 카드 (제목 20자 / 본문 60자 이내)

| key | 제목 | 본문 |
|---|---|---|
| `painPoints.cards[0].title` | 영수증이 가방 속에 쌓입니다 | `painPoints.cards[0].body` — 한 달에 200장. 월말에 한꺼번에 엑셀로 옮기다 보면 저녁이 사라집니다. |
| `painPoints.cards[1].title` | 공정표는 늘 구버전입니다 | `painPoints.cards[1].body` — 엑셀 한 번 고치면 카톡으로 다시 뿌려야 합니다. 누가 뭘 봤는지 모릅니다. |
| `painPoints.cards[2].title` | 돈 흐름이 안 잡힙니다 | `painPoints.cards[2].body` — 받을 돈·쓸 돈·남는 돈. 월말 통장을 열어야 겨우 계산이 됩니다. |
| `painPoints.cards[3].title` | 세금계산서 놓치면 한 달 밀립니다 | `painPoints.cards[3].body` — 발행일 하루만 놓쳐도 부가세 신고와 수금 계획이 같이 꼬입니다. |

> ⚠️ v1 "카톡방 폭발" 카드는 삭제 — 현장 톡방 기능이 철거되었기 때문.

---

## 4) Features — 12 블록

> 구조: 기능명(h3) / 한 줄 요약(20자 이내) / 본문(80~120자) / 체크 불릿 3개(각 15자 이내) / 스크린샷 캡션(20자 이내)
> 배치 순서: 대시보드 성격 기능부터 → 돈 관련 → 사람 관련 → 템플릿 순.

### 4-1. 공정 매니저

| key | 값 |
|---|---|
| `features.blocks[0].name` | 공정 매니저 |
| `features.blocks[0].summary` | 간트표가 스스로 갱신됩니다 |
| `features.blocks[0].body` | 평수와 공종을 고르면 공정표가 자동 생성됩니다. 일정은 드래그로 끌어 옮기고, 자재 발주 타이밍과 지연 위험은 시스템이 먼저 알립니다. |
| `features.blocks[0].bullets[0]` | 간트 뷰 자동 생성 |
| `features.blocks[0].bullets[1]` | 드래그로 일정 조정 |
| `features.blocks[0].bullets[2]` | 지연 위험 자동 알림 |
| `features.blocks[0].caption` | 32평 공정 자동 생성 |
| `features.blocks[0].mockup` | `schedule` |

### 4-2. 자재·발주 관리 (OCR 중심)

| key | 값 |
|---|---|
| `features.blocks[1].name` | 자재·발주 관리 |
| `features.blocks[1].summary` | 영수증 찍으면 끝납니다 |
| `features.blocks[1].body` | 영수증 사진 한 장이면 자재명·수량·단가·공종이 자동으로 분류됩니다. 868건 자재 DB와 맞춰 발주서 초안까지 1분 안에 만들어 줍니다. |
| `features.blocks[1].bullets[0]` | 영수증 OCR 자동 입력 |
| `features.blocks[1].bullets[1]` | 868건 단가 DB 대조 |
| `features.blocks[1].bullets[2]` | 발주서 1분 완성 |
| `features.blocks[1].caption` | 영수증 OCR 자동 분류 화면 |
| `features.blocks[1].mockup` | `materials` |

### 4-3. 현장 손익 관리

| key | 값 |
|---|---|
| `features.blocks[2].name` | 현장 손익 관리 |
| `features.blocks[2].summary` | 현장 3개를 나란히 비교 |
| `features.blocks[2].body` | 모든 현장의 예산·실행·남은 금액이 실시간으로 한 화면에 나란히 있습니다. 손해 나는 현장이 어디인지, 언제 틀어졌는지 바로 보입니다. |
| `features.blocks[2].bullets[0]` | 다현장 실시간 비교 |
| `features.blocks[2].bullets[1]` | 예산 vs 실행 차이 |
| `features.blocks[2].bullets[2]` | 손익 분기 자동 표시 |
| `features.blocks[2].caption` | 다현장 손익 비교 뷰 |
| `features.blocks[2].mockup` | `pnl` |

### 4-4. 견적코치 AI

| key | 값 |
|---|---|
| `features.blocks[3].name` | 견적코치 AI |
| `features.blocks[3].summary` | 868건 단가로 3분 견적 |
| `features.blocks[3].body` | 868건 자재 단가 DB와 3-Layer 가격 구조를 기반으로, 평수·등급·공종만 고르면 견적이 3분 안에 나옵니다. 고객용 PDF까지 자동으로 붙습니다. |
| `features.blocks[3].bullets[0]` | 자재 DB 868건 내장 |
| `features.blocks[3].bullets[1]` | 3-Layer 가격 구조 |
| `features.blocks[3].bullets[2]` | 견적 PDF 자동 생성 |
| `features.blocks[3].caption` | 견적코치 AI 시뮬레이션 |
| `features.blocks[3].mockup` | `estimate` |

### 4-5. 수금관리

| key | 값 |
|---|---|
| `features.blocks[4].name` | 수금관리 |
| `features.blocks[4].summary` | 기성 청구를 잊지 않게 |
| `features.blocks[4].body` | 계약 시점에 기성 스케줄을 한 번만 넣으면, 청구일 3일 전·당일·연체일에 알림이 자동으로 나갑니다. 받은 돈·받을 돈·미수금이 한 줄로 보입니다. |
| `features.blocks[4].bullets[0]` | 기성 스케줄 자동 알림 |
| `features.blocks[4].bullets[1]` | 미수금 한눈 정리 |
| `features.blocks[4].bullets[2]` | 연체일 자동 푸시 |
| `features.blocks[4].caption` | 수금 스케줄 대시보드 |
| `features.blocks[4].mockup` | `billing` |

### 4-6. 세금계산서 관리

| key | 값 |
|---|---|
| `features.blocks[5].name` | 세금계산서 관리 |
| `features.blocks[5].summary` | 발행 타이밍을 놓치지 않게 |
| `features.blocks[5].body` | 매입·매출 세금계산서를 발행일 기준으로 자동 정리하고, 발행 3일 전 알림을 보내줍니다. 부가세 신고 직전에 한꺼번에 몰리지 않습니다. |
| `features.blocks[5].bullets[0]` | 매입·매출 자동 정리 |
| `features.blocks[5].bullets[1]` | 발행 3일 전 알림 |
| `features.blocks[5].bullets[2]` | 부가세 자료 한 장 |
| `features.blocks[5].caption` | 세금계산서 월간 뷰 |
| `features.blocks[5].mockup` | `tax_invoices` |

### 4-7. 하자관리

| key | 값 |
|---|---|
| `features.blocks[6].name` | 하자관리 |
| `features.blocks[6].summary` | 사진 한 장으로 접수 |
| `features.blocks[6].body` | 사진을 올리면 AI가 공종과 유형(누수·들뜸·깨짐 등)을 먼저 추정합니다. 담당자 배정과 처리 상태가 한 화면에 남고, 완료 사진까지 티켓에 자동 첨부됩니다. |
| `features.blocks[6].bullets[0]` | AI 공종·유형 추정 |
| `features.blocks[6].bullets[1]` | 도면 위 위치 마킹 |
| `features.blocks[6].bullets[2]` | 완료 증빙 자동 저장 |
| `features.blocks[6].caption` | 하자 티켓 상세 화면 |
| `features.blocks[6].mockup` | `defect` |

### 4-8. 업무일지

| key | 값 |
|---|---|
| `features.blocks[7].name` | 업무일지 |
| `features.blocks[7].summary` | 사진 + 한 줄이면 끝 |
| `features.blocks[7].body` | 현장에서 사진을 찍고 한 줄만 쓰면 그날의 일지가 완성됩니다. AI가 공종과 인원 수를 먼저 추정해 채워 넣고, 나중엔 검색해서 증빙으로 꺼내 씁니다. |
| `features.blocks[7].bullets[0]` | 사진 자동 분류 |
| `features.blocks[7].bullets[1]` | 공종·인원 자동 채움 |
| `features.blocks[7].bullets[2]` | 분쟁 증빙으로 즉시 |
| `features.blocks[7].caption` | 일지 자동 작성 화면 |
| `features.blocks[7].mockup` | `daily_log` |

### 4-9. 근태급여

| key | 값 |
|---|---|
| `features.blocks[8].name` | 근태급여 |
| `features.blocks[8].summary` | 근태가 바로 급여로 |
| `features.blocks[8].body` | 반장·기사가 현장에서 QR로 출퇴근을 찍으면 근태가 기록됩니다. 직종별 단가와 자동으로 연결돼 급여 대장이 월말에 이미 준비돼 있습니다. |
| `features.blocks[8].bullets[0]` | QR 출퇴근 기록 |
| `features.blocks[8].bullets[1]` | 직종별 단가 자동 |
| `features.blocks[8].bullets[2]` | 급여 대장 자동 생성 |
| `features.blocks[8].caption` | 근태→급여 자동 연동 |
| `features.blocks[8].mockup` | `payroll` |

### 4-10. 반장·기사 인력풀

| key | 값 |
|---|---|
| `features.blocks[9].name` | 반장·기사 인력풀 |
| `features.blocks[9].summary` | 평점·이력·추천 한 장 |
| `features.blocks[9].body` | 같이 일해본 반장·기사의 평점·이력·현장 참여 기록이 한 프로필에 쌓입니다. 다음 현장에 누가 맞는지 검색하고, 동료 업체에 추천할 수 있습니다. |
| `features.blocks[9].bullets[0]` | 함께 일한 평점 기록 |
| `features.blocks[9].bullets[1]` | 현장 이력 자동 누적 |
| `features.blocks[9].bullets[2]` | 동료 업체 추천 기능 |
| `features.blocks[9].caption` | 반장 프로필 카드 |
| `features.blocks[9].mockup` | `workers` |

### 4-11. 월간 리포트

| key | 값 |
|---|---|
| `features.blocks[10].name` | 월간 리포트 |
| `features.blocks[10].summary` | 매월 1일, 메일에 도착 |
| `features.blocks[10].body` | 지난 달 매출·원가·수금·현장별 손익을 한 장 리포트로 자동 생성해서 이메일로 보내드립니다. 회의자료·세무사 제출용으로 그대로 씁니다. |
| `features.blocks[10].bullets[0]` | 매월 1일 자동 발송 |
| `features.blocks[10].bullets[1]` | 현장별 손익 요약 |
| `features.blocks[10].bullets[2]` | 세무사 제출용 한 장 |
| `features.blocks[10].caption` | 월간 리포트 샘플 |
| `features.blocks[10].mockup` | `monthly_report` |

### 4-12. 공사 유형 템플릿

| key | 값 |
|---|---|
| `features.blocks[11].name` | 공사 유형 템플릿 |
| `features.blocks[11].summary` | 3분 내 신규 현장 세팅 |
| `features.blocks[11].body` | 전체·부분·욕실·주방·상가 등 기본 5종 템플릿이 내장되어 있고, 내 업체만의 템플릿도 저장해 둘 수 있습니다. 신규 현장이 3분 안에 세팅됩니다. |
| `features.blocks[11].bullets[0]` | 기본 5종 템플릿 |
| `features.blocks[11].bullets[1]` | 내 템플릿 저장 |
| `features.blocks[11].bullets[2]` | 3분 내 현장 세팅 |
| `features.blocks[11].caption` | 공사 유형 선택 화면 |
| `features.blocks[11].mockup` | `template` |

### Features 섹션 Eyebrow / Title

| key | 카피 |
|---|---|
| `features.eyebrow` | 12가지 모듈, 한 구독 |
| `features.title` | 견적부터 정산까지 / 한 라인으로 끝납니다 |

---

## 5) Case Study — 잠실르엘 32평

> 익명화 원칙에 따라 고객 특정 정보(가구 구성)는 "서울 송파 32평 가정" 수준으로 일반화.

| key | 값 |
|---|---|
| `caseStudy.eyebrow` | 실제 현장 사례 |
| `caseStudy.title` | 잠실르엘 32평 리모델링 |
| `caseStudy.subtitle` | 서울 송파 · 32평 · 공정 6주 · 4/16~5/1 진행 중 |
| `caseStudy.summary` | 스몰테이블은 잠실르엘 32평 전체 리모델링을 인테리어코치 한 화면으로 돌리고 있습니다. 영수증은 OCR로 자동 분류되고, 견적은 868건 단가 DB로 3분 만에 확정되었습니다. 공정표는 AI가 먼저 그려주고, 수금 알림은 잔금일 3일 전에 자동으로 나갑니다. 세금계산서 발행과 월간 리포트까지 같은 화면에서 이어집니다. (약 200자) |

### Stats 3개

| key | 라벨 | 값 |
|---|---|---|
| `caseStudy.stats[0]` | 계약 규모 | 4,800만원 |
| `caseStudy.stats[1]` | 공사 기간 | 6주 (계획 6주 / 착공 4월 16일) |
| `caseStudy.stats[2]` | 공종 수 | 12공종 · 자재 입고 5회 |

### Timeline (6주)

| 주차 | 라벨 |
|---|---|
| 1주차 | 철거·목공 시작 |
| 2주차 | 전기·배관 마감 |
| 3주차 | 타일·도장 |
| 4주차 | 가구·조명 설치 |
| 5주차 | 필름·마감재 |
| 6주차 | 청소·입주 검수 |

---

## 6) Why Us — 3 차별점

| key | 헤드라인 | 설명 1줄 | 설명 2줄 |
|---|---|---|---|
| `whyUs.cards[0].headline` | OCR·AI로 타이핑 제로 | `whyUs.cards[0].desc1` — 영수증·하자 사진·일지 모두 AI가 먼저 읽습니다. | `whyUs.cards[0].desc2` — 사장님이 타이핑할 일이 하루 1회 미만입니다. |
| `whyUs.cards[1].headline` | 자재 DB 868건, 한 라인으로 연결 | `whyUs.cards[1].desc1` — 견적·발주·손익·세금계산서가 같은 단가를 씁니다. | `whyUs.cards[1].desc2` — 번호를 다시 칠 일이 없습니다. |
| `whyUs.cards[2].headline` | 현직 대표가 직접 설계 | `whyUs.cards[2].desc1` — 스몰테이블디자인그룹 대표가 매일 자기 현장에서 씁니다. | `whyUs.cards[2].desc2` — 기획자 상상이 아니라 사장님 일기장입니다. |

### Why Us 섹션 Eyebrow / Title

| key | 카피 |
|---|---|
| `whyUs.eyebrow` | 왜 인테리어코치인가 |
| `whyUs.title` | 현장을 아는 사람이 / 매일 쓰려고 만든 도구 |

---

## 7) Pricing — 3 티어

### 섹션 타이틀

| key | 카피 |
|---|---|
| `pricing.eyebrow` | 요금제 |
| `pricing.title` | 현장 규모·결제 주기에 맞게 |
| `pricing.subtitle` | 무료 플랜 상시 · 유료 14일 무료 체험 · 카드 등록 불필요 |

### 월/연 토글 레이블

| key | 카피 |
|---|---|
| `pricing.billingToggle.monthlyLabel` | 월간 결제 |
| `pricing.billingToggle.annualLabel` | 연간 결제 (17% 할인) |

### 3 플랜

#### 플랜 1 — 체험하기

| key | 값 |
|---|---|
| `pricing.plans[0].name` | **체험하기** |
| `pricing.plans[0].monthly` | 0 |
| `pricing.plans[0].yearly` | 0 |
| `pricing.plans[0].tagline` | 신규 현장 1개까지 무료 |
| `pricing.plans[0].features[0]` | 현장 1개 |
| `pricing.plans[0].features[1]` | 견적코치 AI 월 5건 |
| `pricing.plans[0].features[2]` | 영수증 OCR 월 20건 |
| `pricing.plans[0].features[3]` | 공정 매니저 기본 |
| `pricing.plans[0].features[4]` | 커뮤니티 지원 |
| `pricing.plans[0].ctaLabel` | 무료로 시작 |
| `pricing.plans[0].ctaHref` | `/auth/signup` |
| `pricing.plans[0].highlight` | false |

#### 플랜 2 — 현장 올인원 (월간)

| key | 값 |
|---|---|
| `pricing.plans[1].name` | **현장 올인원** |
| `pricing.plans[1].monthly` | **79000** |
| `pricing.plans[1].billingLabel` | 월간 결제 |
| `pricing.plans[1].tagline` | 현장 3~10개, 대표+팀원 3명 |
| `pricing.plans[1].features[0]` | 12개 모듈 전체 |
| `pricing.plans[1].features[1]` | 영수증 OCR 무제한 |
| `pricing.plans[1].features[2]` | 견적코치 AI 무제한 |
| `pricing.plans[1].features[3]` | 월간 리포트 자동 발송 |
| `pricing.plans[1].features[4]` | 14일 무료 체험 |
| `pricing.plans[1].features[5]` | 팀원 3명 |
| `pricing.plans[1].features[6]` | 이메일 우선 지원 |
| `pricing.plans[1].ctaLabel` | 14일 무료로 시작 |
| `pricing.plans[1].ctaHref` | `/auth/signup?plan=monthly` |
| `pricing.plans[1].highlight` | false |

#### 플랜 3 — 연간 올인원 (연간 결제) ⭐ 가장 많이 선택

| key | 값 |
|---|---|
| `pricing.plans[2].name` | **연간 올인원** |
| `pricing.plans[2].yearly` | **790000** |
| `pricing.plans[2].monthlyEquivalent` | 65833 |
| `pricing.plans[2].billingLabel` | 연간 결제 (약 2개월 무료) |
| `pricing.plans[2].tagline` | 1년을 확실히 쓰는 대표 |
| `pricing.plans[2].features[0]` | 현장 올인원 전 기능 포함 |
| `pricing.plans[2].features[1]` | **17% 할인** (연 ₩158,000 절약) |
| `pricing.plans[2].features[2]` | 팀원 5명 |
| `pricing.plans[2].features[3]` | 추천 보상 1인당 ₩50,000 환급 |
| `pricing.plans[2].features[4]` | 데이터 내보내기 월 2회 |
| `pricing.plans[2].features[5]` | 전담 도입 지원 1회 |
| `pricing.plans[2].ctaLabel` | 연간 결제로 시작 |
| `pricing.plans[2].ctaHref` | `/auth/signup?plan=annual` |
| `pricing.plans[2].highlight` | **true** |
| `pricing.plans[2].badge` | **가장 많이 선택** |

### "가장 많이 선택" 배지 이유

- 유료 선택 시 연간 결제 비중이 30~40% 수준으로 상승(업계 평균).
- 인테리어 업체는 현장 주기(3~6개월)가 길어 "1년 단위 운영"이 자연스러움.
- 17% 할인 + 추천 보상까지 묶여 "돈을 더 아끼는 선택"으로 설계.

### 하단 안내

| key | 카피 |
|---|---|
| `pricing.footnote` | 모든 금액은 부가세 별도. 유료 플랜 14일 무료 체험 · 카드 등록 불필요 · 언제든 해지. |

---

## 8) FAQ — 5문항

| key | 질문 | 답변(120자 이내) |
|---|---|---|
| `faq.items[0].q` | OCR 정확도는 어느 정도인가요? | `faq.items[0].a` — 한국 인테리어 영수증 기준 금액·자재명 92~96% 자동 인식. 어긋나는 항목은 한 탭으로 수정되며 그 내역이 AI를 더 똑똑하게 만듭니다. |
| `faq.items[1].q` | 엑셀로 충분한데 굳이 바꿔야 하나요? | `faq.items[1].a` — 엑셀은 "기록"만 하지만 인테리어코치는 기록이 그대로 견적·수금·세금계산서로 이어집니다. 같은 숫자를 두 번 치지 않게 됩니다. |
| `faq.items[2].q` | 기존에 쓰던 엑셀·카톡 데이터를 옮길 수 있나요? | `faq.items[2].a` — CSV 일괄 업로드가 기본으로 제공되고, 연간 플랜에서는 전담 도입 지원으로 마이그레이션을 도와드립니다. |
| `faq.items[3].q` | 해지하면 내 데이터는 어떻게 되나요? | `faq.items[3].a` — 해지 후 30일 동안 전체 데이터를 엑셀·PDF로 내려받을 수 있습니다. 그 뒤에는 자동 파기되며 사장님 동의 없이 공유되지 않습니다. |
| `faq.items[4].q` | 보안은 어떻게 관리되나요? | `faq.items[4].a` — 국내 데이터센터에 저장·전송 암호화 적용, 워크스페이스 단위 격리, 권한은 역할별 차등. 결제는 토스페이먼츠 표준 절차를 따릅니다. |

### FAQ 섹션 Eyebrow / Title

| key | 카피 |
|---|---|
| `faq.eyebrow` | 자주 묻는 질문 |
| `faq.title` | 도입 전에 꼭 확인하는 것들 |

---

## 9) Final CTA — 배너 2안

### 안 A — 손실 회피 프레임 ⭐

| key | 카피 |
|---|---|
| `finalCta.a.title` | 이번 달 영수증이 또 가방에 쌓이기 전에 |
| `finalCta.a.subtitle` | 14일 동안 사진만 찍어 보세요. 장부는 인테리어코치가 씁니다. |
| `finalCta.a.primary.label` | 무료로 시작하기 |
| `finalCta.a.primary.href` | `/auth/signup` |
| `finalCta.a.secondary.label` | 3분 데모 영상 |
| `finalCta.a.secondary.href` | `/demo-request` |

### 안 B — 기회 획득 프레임

| key | 카피 |
|---|---|
| `finalCta.b.title` | 오늘 가입, 내일 첫 현장부터 써보세요 |
| `finalCta.b.subtitle` | 영수증·견적·수금·세금계산서 한 줄로 연결. 14일 무료. |
| `finalCta.b.primary.label` | 지금 무료로 시작 |
| `finalCta.b.primary.href` | `/auth/signup` |
| `finalCta.b.secondary.label` | 도입 상담 요청 |
| `finalCta.b.secondary.href` | `/demo-request` |

**채택 추천안**: `finalCta.a` — "영수증이 또 쌓인다"는 현실 묘사가 OCR 차별 축과 직접 연결됨.

---

## 10) TypeScript 상수 가이드 (이식용 스켈레톤)

```ts
// src/content/landing.ts (값만 교체. 기존 export/type 구조 그대로 유지.)

export const landingCopy = {
  nav: {
    logo: "인테리어코치",
    links: [
      { label: "기능", href: "#features" },
      { label: "케이스", href: "#case" },
      { label: "요금제", href: "#pricing" },
      { label: "FAQ", href: "#faq" },
    ],
    ctaLogin: { label: "로그인", href: "/auth/login" },
    ctaSignup: { label: "무료로 시작", href: "/auth/signup" },
  },

  hero: {
    eyebrow: "인테리어 업체 대표를 위한 현장 운영 올인원",
    titleLines: ["사진 찍고 지나가면", "AI가 장부를 씁니다"],
    subtitle:
      "영수증·하자 사진·업무일지까지, OCR과 AI가 먼저 읽습니다.\n868건 자재 DB로 견적·수금·세금계산서가 한 숫자로 이어집니다.",
    primaryCta: { label: "무료로 시작하기", href: "/auth/signup" },
    secondaryCta: { label: "3분 데모 영상", href: "/demo-request" },
    meta: "카드 등록 불필요 · 2분 만에 첫 현장 등록 · 언제든 해지",
  },

  painPoints: {
    eyebrow: "이런 하루, 익숙하시죠",
    title: "현장이 늘어날수록\n사장님 시간만 녹는 구조",
    cards: [
      { icon: "Receipt",      title: "영수증이 가방 속에 쌓입니다",  body: "한 달에 200장. 월말에 한꺼번에 엑셀로 옮기다 보면 저녁이 사라집니다." },
      { icon: "Calendar",     title: "공정표는 늘 구버전입니다",     body: "엑셀 한 번 고치면 카톡으로 다시 뿌려야 합니다. 누가 뭘 봤는지 모릅니다." },
      { icon: "Wallet",       title: "돈 흐름이 안 잡힙니다",        body: "받을 돈·쓸 돈·남는 돈. 월말 통장을 열어야 겨우 계산이 됩니다." },
      { icon: "FileWarning",  title: "세금계산서 놓치면 한 달 밀립니다", body: "발행일 하루만 놓쳐도 부가세 신고와 수금 계획이 같이 꼬입니다." },
    ],
  },

  features: {
    eyebrow: "12가지 모듈, 한 구독",
    title: "견적부터 정산까지\n한 라인으로 끝납니다",
    blocks: [
      // 위 §4 의 12 블록을 그대로 배열에 넣으면 됨. 각 블록 필드:
      // { name, summary, body, bullets: [3], caption, mockup }
    ],
  },

  caseStudy: {
    eyebrow: "실제 현장 사례",
    title: "잠실르엘 32평 리모델링",
    subtitle: "서울 송파 · 32평 · 공정 6주 · 4/16~5/1 진행 중",
    summary: "...§5 Case Study summary 참조...",
    stats: [
      { label: "계약 규모", value: "4,800만원" },
      { label: "공사 기간", value: "6주" },
      { label: "공종 수",   value: "12공종 · 자재 입고 5회" },
    ],
    timeline: [
      { week: "1주차", label: "철거·목공 시작" },
      { week: "2주차", label: "전기·배관 마감" },
      { week: "3주차", label: "타일·도장" },
      { week: "4주차", label: "가구·조명 설치" },
      { week: "5주차", label: "필름·마감재" },
      { week: "6주차", label: "청소·입주 검수" },
    ],
  },

  whyUs: {
    eyebrow: "왜 인테리어코치인가",
    title: "현장을 아는 사람이\n매일 쓰려고 만든 도구",
    cards: [
      { headline: "OCR·AI로 타이핑 제로",           desc1: "영수증·하자 사진·일지 모두 AI가 먼저 읽습니다.", desc2: "사장님이 타이핑할 일이 하루 1회 미만입니다." },
      { headline: "자재 DB 868건, 한 라인으로 연결", desc1: "견적·발주·손익·세금계산서가 같은 단가를 씁니다.", desc2: "번호를 다시 칠 일이 없습니다." },
      { headline: "현직 대표가 직접 설계",           desc1: "스몰테이블디자인그룹 대표가 매일 자기 현장에서 씁니다.", desc2: "기획자 상상이 아니라 사장님 일기장입니다." },
    ],
  },

  pricing: {
    eyebrow: "요금제",
    title: "현장 규모·결제 주기에 맞게",
    subtitle: "무료 플랜 상시 · 유료 14일 무료 체험 · 카드 등록 불필요",
    billingToggle: { monthlyLabel: "월간 결제", annualLabel: "연간 결제 (17% 할인)" },
    plans: [
      { name: "체험하기",       monthly: 0,     yearly: 0,      tagline: "신규 현장 1개까지 무료",        features: ["현장 1개", "견적코치 AI 월 5건", "영수증 OCR 월 20건", "공정 매니저 기본", "커뮤니티 지원"], ctaLabel: "무료로 시작",        ctaHref: "/auth/signup",                     highlight: false },
      { name: "현장 올인원",    monthly: 79000, yearly: null,   tagline: "현장 3~10개, 대표+팀원 3명",      features: ["12개 모듈 전체", "영수증 OCR 무제한", "견적코치 AI 무제한", "월간 리포트 자동 발송", "14일 무료 체험", "팀원 3명", "이메일 우선 지원"], ctaLabel: "14일 무료로 시작", ctaHref: "/auth/signup?plan=monthly", highlight: false },
      { name: "연간 올인원",    monthly: null,  yearly: 790000, tagline: "1년을 확실히 쓰는 대표",          features: ["현장 올인원 전 기능", "17% 할인 (연 ₩158,000 절약)", "팀원 5명", "추천 보상 1인당 ₩50,000", "데이터 내보내기 월 2회", "전담 도입 지원 1회"], ctaLabel: "연간 결제로 시작", ctaHref: "/auth/signup?plan=annual", highlight: true, badge: "가장 많이 선택" },
    ],
    footnote: "모든 금액은 부가세 별도. 유료 플랜 14일 무료 체험 · 카드 등록 불필요 · 언제든 해지.",
  },

  faq: {
    eyebrow: "자주 묻는 질문",
    title: "도입 전에 꼭 확인하는 것들",
    items: [
      { q: "OCR 정확도는 어느 정도인가요?",                     a: "한국 인테리어 영수증 기준 금액·자재명 92~96% 자동 인식. 어긋나는 항목은 한 탭으로 수정되며 그 내역이 AI를 더 똑똑하게 만듭니다." },
      { q: "엑셀로 충분한데 굳이 바꿔야 하나요?",               a: "엑셀은 기록만 하지만 인테리어코치는 기록이 그대로 견적·수금·세금계산서로 이어집니다. 같은 숫자를 두 번 치지 않게 됩니다." },
      { q: "기존에 쓰던 엑셀·카톡 데이터를 옮길 수 있나요?",     a: "CSV 일괄 업로드가 기본으로 제공되고, 연간 플랜에서는 전담 도입 지원으로 마이그레이션을 도와드립니다." },
      { q: "해지하면 내 데이터는 어떻게 되나요?",               a: "해지 후 30일 동안 전체 데이터를 엑셀·PDF로 내려받을 수 있습니다. 그 뒤에는 자동 파기되며 사장님 동의 없이 공유되지 않습니다." },
      { q: "보안은 어떻게 관리되나요?",                         a: "국내 데이터센터에 저장·전송 암호화 적용, 워크스페이스 단위 격리, 권한은 역할별 차등. 결제는 토스페이먼츠 표준 절차를 따릅니다." },
    ],
  },

  finalCta: {
    title: "이번 달 영수증이 또 가방에 쌓이기 전에",
    subtitle: "14일 동안 사진만 찍어 보세요. 장부는 인테리어코치가 씁니다.",
    primary:   { label: "무료로 시작하기",  href: "/auth/signup" },
    secondary: { label: "3분 데모 영상",    href: "/demo-request" },
  },
} as const;

export type LandingCopy = typeof landingCopy;
```

> ⚠️ 가격 수치(79000/790000)는 `docs/competitor-v2-analysis.md` §5 근거 기반 **임시 안**. 실제 결제 테스트 전 최종 확정 필요.

---

## 부록 A — 검수 체크리스트 (이식 전 필수)

- [ ] "현장 톡방·고객 포털·전자서명" 단어가 카피 어디에도 없는지 최종 grep 확인
- [ ] 견적코치 전용 키워드(`바가지`, `적정가`)는 Features `견적코치 AI` 블록에만 존재(히어로/페인포인트에 유입 금지)
- [ ] 잠실르엘 수치(4,800만 원 등) 공개 가능 여부 최종 확인 — 불가 시 "서울 송파 32평 리모델링" 익명화만 남기고 숫자 빼기
- [ ] 가격(₩79,000 / ₩790,000) 결제 테스트 후 확정; 번복 시 FAQ·Pricing 섹션 3곳 동시 수정
- [ ] `hero.title_a` A/B 변수 세팅 (`NEXT_PUBLIC_HEADLINE_VARIANT` 기존 인프라 재사용)

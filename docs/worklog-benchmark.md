# 인테리어 업무일지 양식 벤치마크

> 인테리어코치 업무일지/작업일지 기능 설계를 위한 조사 | 2026.03.29 작성

---

## 1. 법적 양식 (Legal Requirements)

### 1-1. 건설산업기본법 상 작업일지

**근거**: 건설산업기본법 시행규칙 별지 제30호 서식 (건설공사 작업일지)

| 필드 | 필수 여부 | 설명 |
|------|----------|------|
| 공사명 | 필수 | 프로젝트명 |
| 작업일자 | 필수 | 날짜 |
| 날씨 | 필수 | 맑음/흐림/비/눈 등 |
| 기온 | 필수 | 최저/최고 기온 |
| 작업 내용 | 필수 | 당일 수행한 작업 상세 |
| 투입 인력 | 필수 | 직종별 인원 수 |
| 투입 장비 | 필수 | 장비 종류 및 수량 |
| 자재 반입 | 필수 | 반입 자재명, 수량, 규격 |
| 특기사항 | 선택 | 안전 관련, 민원, 이슈 등 |
| 작성자 서명 | 필수 | 현장 대리인 서명 |
| 감독원 확인 | 필수 | 발주처 감독원 서명 |

**적용 범위**: 법적으로는 건설산업기본법 상 건설공사 (일정 규모 이상)에 적용되나, 소규모 인테리어 공사에는 법적 의무 없음. 다만 분쟁 시 증거자료로 활용 가능.

### 1-2. 산업안전보건법 상 안전 관련 기재

| 필드 | 설명 |
|------|------|
| TBM 실시 기록 | Tool Box Meeting (작업 전 안전 회의) |
| 위험요소 점검 | 당일 작업 관련 위험요소 식별 |
| 안전장구 착용 현황 | 안전모, 안전대, 안전화 등 |
| 안전교육 실시 여부 | 신규 투입 인력 교육 기록 |
| 사고/아차사고 기록 | 사고 또는 아차사고 발생 시 기록 |

**적용 범위**: 상시근로자 50인 이상 또는 건설공사 금액 50억 이상은 안전관리자 선임 의무. 소규모 인테리어에는 법적 의무 약하나, 사고 발생 시 책임 소재 증명에 중요.

### 1-3. 공동주택관리법 시행규칙

아파트 인테리어 공사 시 관리사무소에 제출하는 서류:
- 공사 신고서 (착공 전)
- 공사 일정표
- 하도급 업체 명단
- 공사 완료 신고서

### 1-4. 국토교통부 표준 서식 핵심 필드

| 카테고리 | 필드 |
|---------|------|
| 기본 정보 | 공사명, 날짜, 날씨, 작성자 |
| 인력 투입 | 직종별(목공/타일/전기/설비/도배/도장/철거/잡공) 인원수 |
| 장비 투입 | 장비명, 규격, 수량, 사용시간 |
| 자재 반입 | 자재명, 규격, 수량, 제조사 |
| 작업 내용 | 공종별 당일 수행 작업 |
| 공정률 | 전체 공정 대비 진행률 (%) |
| 특기사항 | 안전, 품질, 민원, 변경사항 |

---

## 2. 실무 양식 (Korean Interior Industry Practice)

### 2-1. 카카오톡 기반 (가장 흔한 현실)

대부분의 소규모 인테리어 업체(1~5인)는 **카카오톡 단체방**으로 업무일지를 대체:

```
[오전 현장 카톡]
📸 사진 3~5장
"오늘 철거 완료, 내일 전기 들어갑니다"
"인부 3명 투입"

[오후 퇴근 전]
📸 완료 사진 2~3장
"도배 80% 완료. 내일 나머지 마무리"
```

**문제점**:
- 사진과 텍스트가 대화 속에 묻힘 → 나중에 찾기 어려움
- 체계적 기록 불가 (공종별, 날짜별 정리 안 됨)
- 분쟁 시 증거 자료로 인정받기 어려움
- 여러 현장을 동시 운영 시 혼선

### 2-2. 엑셀/한글 기반

중규모 업체(5~10인)에서 사용하는 엑셀 양식:

| 구분 | 포함 필드 |
|------|----------|
| 기본 | 현장명, 날짜, 작성자, 날씨 |
| 인력 | 공종별 투입 인원, 일당 |
| 자재 | 자재명, 수량, 금액, 공급처 |
| 작업 | 당일 작업 내용 (서술형) |
| 사진 | 별도 폴더에 저장 (엑셀에 링크) |
| 비용 | 당일 지출 내역 (인건비, 자재비, 잡비) |
| 이슈 | 특이사항, 고객 요청, 변경사항 |

**문제점**: 현장에서 작성 불편, 사진 연결 번거로움, 실시간 공유 어려움

### 2-3. 네이버 밴드/카페 기반

일부 업체는 네이버 밴드를 현장 단위로 개설하여 사용:
- 날짜별 게시글로 작업 기록
- 사진 업로드 편리
- 고객에게도 공유 가능

**문제점**: 구조화된 데이터 추출 불가, 통계/분석 불가

### 2-4. 인테리어 업체가 꼭 기록해야 할 항목 (실무 관점)

| 우선순위 | 항목 | 이유 |
|---------|------|------|
| P0 | 사진 (전/중/후) | 하자 분쟁 증거, 고객 보고 |
| P0 | 당일 작업 내용 | 공정 관리, 업무 인수인계 |
| P0 | 투입 인력 (공종/인원) | 인건비 관리, 노무 기록 |
| P1 | 자재 사용 내역 | 원가 관리, 재고 파악 |
| P1 | 특이사항/이슈 | 분쟁 예방, 리스크 관리 |
| P1 | 고객 소통 내역 | 변경사항 추적, CRM |
| P2 | 날씨 | 방수/도장 등 영향 기록 |
| P2 | 공정률 | 전체 일정 관리 |
| P2 | 비용 지출 | 실시간 원가 추적 |

---

## 3. 앱 벤치마크 (Korean Construction Apps)

### 3-1. 하우빌드 일일보고

| 기능 | 상세 |
|------|------|
| 작업 내역 | 공종별 작업 내용 입력 |
| 사진 기록 | 다중 사진 업로드, 자동 날짜 태깅 |
| 인력 투입 | 직종별 인원, 근무시간 |
| 자재 반입 | 자재명, 수량, 공급처 |
| 비용 기록 | 일별 지출 내역 |
| 공정률 | 공종별 진행률 입력 |
| 이슈/메모 | 자유 텍스트 + 사진 |

### 3-2. 현장의신 일일보고

| 기능 | 상세 |
|------|------|
| 사진 중심 기록 | 사진 촬영 → 자동 타임스탬프 |
| 간편 작업 입력 | 템플릿 기반 빠른 입력 |
| 공정률 | 진행률 바/퍼센트 |
| 안전 체크리스트 | 일일 안전 점검 항목 |
| PDF 내보내기 | 일보를 PDF로 생성/공유 |
| 알림 | 미작성 시 리마인더 |

### 3-3. 국내 앱 공통 필드 분석

| 필드 | 하우빌드 | 현장의신 | 빌드온 | 건설워커 |
|------|---------|---------|-------|---------|
| 사진 | O | O | O | △ |
| 작업 내용 | O | O | O | X |
| 투입 인력 | O | O | O | O |
| 자재 기록 | O | △ | O | X |
| 공정률 | O | O | O | X |
| 날씨 | O | O | △ | X |
| 비용 기록 | O | X | △ | O |
| 안전 체크 | △ | O | O | X |
| 고객 공유 | X | △ | X | X |
| 음성 메모 | X | X | X | X |

---

## 4. 해외 사례 (Overseas SaaS)

### 4-1. Buildertrend Daily Log

| 필드 | 상세 |
|------|------|
| Date & Weather | 날짜, 날씨 (자동 수집) |
| Work Performed | 공종별 작업 내용 |
| Labor | 인력 투입 (회사/하도급/직종/시간) |
| Equipment | 장비 사용 |
| Materials | 자재 반입/사용 |
| Visitors | 방문자 기록 |
| Photos | 다중 사진 + 태깅 |
| Notes | 자유 메모 |
| Safety | 안전 관련 기록 |
| Client-Facing Notes | 고객에게 공유할 내용 (별도) |
| Signature | 전자 서명 |

### 4-2. Procore Daily Log

| 필드 | 상세 |
|------|------|
| Manpower | 회사별, 직종별 인력 투입 |
| Equipment | 장비 목록, 가동시간 |
| Weather | 온도, 습도, 풍속, 강수량 (자동) |
| Work Log | 작업 상세 기록 |
| Inspections | 검사/점검 기록 |
| Safety Violations | 안전 위반 사항 |
| Accidents/Near-Misses | 사고/아차사고 |
| Delivery Log | 자재 배송 기록 |
| Waste Log | 폐기물 발생/처리 |
| Photos | GPS 태깅 + 자동 분류 |
| Custom Fields | 사용자 정의 필드 |

### 4-3. CoConstruct Daily Reports

| 필드 | 상세 |
|------|------|
| Job Progress | 선택사항 진행 현황 |
| To-Do Updates | 할 일 목록 업데이트 |
| Photos | 작업 사진 + 설명 |
| Client Updates | 고객에게 자동 이메일/앱 알림 |
| Notes for Internal | 내부용 메모 (고객 미공개) |
| Change Orders | 변경 주문 연동 |

### 4-4. 해외 vs 국내 비교

**해외에 있고 국내에 없는 기능:**

| 기능 | 설명 | 적용 가치 |
|------|------|----------|
| 날씨 자동 수집 | GPS 기반 현재 날씨 자동 입력 | 높음 (입력 부담 감소) |
| 고객 공유 뷰 | 고객에게 보여줄 내용만 선별 공유 | 매우 높음 (고객 만족) |
| GPS 태깅 사진 | 사진에 위치 정보 자동 기록 | 중간 |
| 음성→텍스트 | 음성으로 작업 내용 기록 | 높음 (현장 편의) |
| 전자 서명 | 고객/감독 확인 서명 | 높음 (분쟁 예방) |
| 타임랩스 | 시공 과정 타임랩스 영상 | 중간 (마케팅 활용) |
| AI 자동 요약 | 사진+메모를 AI가 일보로 정리 | 매우 높음 |
| 변경주문 연동 | 일지에서 바로 추가 비용 청구 | 높음 |
| 폐기물 기록 | 환경법 준수를 위한 폐기물 추적 | 낮음 (국내 규제 약함) |
| 하자 연동 | 일지에서 발견된 이슈 → 하자 접수 | 높음 |

**한국에만 필요한 기능:**

| 기능 | 설명 |
|------|------|
| 관리사무소 보고 | 아파트 공사 시 관리사무소 일보 제출 |
| 카카오톡 공유 | 한국 고객은 카톡으로 소통 |
| 공종별 일당 계산 | 일용직 일당 기반 인건비 자동 계산 |
| 세금계산서 연동 | 자재 매입 → 세금계산서 자동 매칭 |
| 한국어 음성 인식 | 한국어 특화 음성→텍스트 |

---

## 5. 인테리어코치 업무일지 최소 필드셋 제안

### 5-1. 설계 원칙

1. **모바일 퍼스트**: 현장에서 한 손으로 입력 가능
2. **사진 중심**: 사진이 핵심, 텍스트는 보조
3. **3단계 점진적 공개**: 필수 → 권장 → 선택 순으로 입력
4. **음성 지원**: 텍스트 입력 대신 음성 메모 가능
5. **자동화**: 날씨, 시간, 위치는 자동 수집

### 5-2. 필드 구성

#### 필수 (Required) - 5개

| 필드 | 입력 방식 | 설명 |
|------|----------|------|
| 현장 | 드롭다운 (자동 선택) | 진행 중 프로젝트 목록에서 선택 |
| 날짜 | 자동 (오늘) | 기본값 오늘, 수정 가능 |
| 사진 | 카메라/갤러리 | 최소 1장 필수, 다중 업로드 |
| 작업 내용 | 텍스트/음성 | 오늘 한 일 간략 기술 |
| 공종 태그 | 멀티 선택 칩 | 도배/바닥/타일/목공/전기/설비/도장/창호/방수/철거/기타 |

#### 권장 (Recommended) - 5개

| 필드 | 입력 방식 | 설명 |
|------|----------|------|
| 투입 인력 | 공종별 인원 (숫자) | 공종 태그 기반으로 자동 표시 |
| 공정률 | 슬라이더 (0~100%) | 현장 전체 진행률 |
| 특이사항 | 텍스트/음성 | 이슈, 변경사항, 고객 요청 |
| 내일 계획 | 텍스트/음성 | 다음 날 작업 예정 |
| 자재 기록 | 자재명+수량 | 당일 사용/반입 자재 |

#### 선택 (Optional) - 7개

| 필드 | 입력 방식 | 설명 |
|------|----------|------|
| 날씨 | 자동 (GPS 기반) | 날씨 API 자동 수집 |
| 비용 지출 | 금액 + 항목 | 당일 비용 발생 내역 |
| 안전 체크 | 체크리스트 | 간단한 안전 점검 (3~5개 항목) |
| 고객 메모 | 텍스트 | 고객에게 공유할 내용 (별도) |
| 음성 메모 | 녹음 | 음성 파일 첨부 |
| 동영상 | 촬영/업로드 | 작업 과정 영상 |
| 만족도 | 이모지 선택 | 오늘 현장 상태 (😊😐😟) |

### 5-3. UX 플로우

```
[홈 → 업무일지 작성]
    ↓
1. 현장 자동 선택 (진행 중 현장 1개면 자동)
    ↓
2. 사진 촬영/선택 (📸 큰 버튼)
    ↓
3. 공종 태그 선택 (칩 멀티 선택)
    ↓
4. 작업 내용 입력 (텍스트 or 🎤 음성)
    ↓
5. [저장] ← 여기까지가 최소 입력
    ↓
6. (선택) 더 입력하기 → 권장/선택 필드 표시
    ↓
7. 저장 완료 → 카카오톡/링크로 고객 공유 옵션
```

### 5-4. 고객 공유 뷰

고객에게 보여줄 일지는 별도 포맷:

```
+----------------------------------------+
|  [업체 로고]  현장명                      |
|  2026년 3월 29일 (토) | 맑음 15°C       |
+----------------------------------------+
|                                        |
|  📸 오늘의 작업 사진 (슬라이드)            |
|  [사진1] [사진2] [사진3]                 |
|                                        |
+----------------------------------------+
|  📋 작업 내용                            |
|                                        |
|  • 주방 상부장 설치 완료                   |
|  • 거실 도배 60% 진행                    |
|  • 내일 욕실 타일 시공 예정               |
|                                        |
+----------------------------------------+
|  📊 전체 공정률: [=========>  ] 72%      |
|                                        |
+----------------------------------------+
|  💬 참고사항                             |
|  "주방 상판 색상은 내일 최종 확인          |
|   부탁드립니다"                          |
|                                        |
+----------------------------------------+
|  ⓘ 인테리어코치로 관리되는 현장입니다       |
+----------------------------------------+
```

---

## 6. JSON Schema

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "DailyWorkLog",
  "description": "인테리어코치 업무일지 데이터 모델",
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "projectId": {
      "type": "string",
      "format": "uuid",
      "description": "연결된 프로젝트 ID"
    },
    "date": {
      "type": "string",
      "format": "date",
      "description": "작업일"
    },
    "createdBy": {
      "type": "string",
      "format": "uuid",
      "description": "작성자 ID"
    },
    "photos": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string", "format": "uuid" },
          "url": { "type": "string", "format": "uri" },
          "thumbnailUrl": { "type": "string", "format": "uri" },
          "caption": { "type": "string" },
          "takenAt": { "type": "string", "format": "date-time" },
          "gps": {
            "type": "object",
            "properties": {
              "lat": { "type": "number" },
              "lng": { "type": "number" }
            }
          }
        },
        "required": ["id", "url"]
      },
      "minItems": 1,
      "description": "작업 사진 (최소 1장 필수)"
    },
    "trades": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": ["demolition", "wallpaper", "flooring", "tile", "carpentry", "electrical", "plumbing", "painting", "windows_doors", "waterproofing", "other"]
      },
      "description": "당일 진행 공종 태그"
    },
    "workDescription": {
      "type": "string",
      "description": "당일 작업 내용"
    },
    "workers": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "trade": { "type": "string" },
          "count": { "type": "integer", "minimum": 0 },
          "dailyWage": { "type": "number", "minimum": 0 }
        },
        "required": ["trade", "count"]
      },
      "description": "공종별 투입 인력"
    },
    "progressRate": {
      "type": "number",
      "minimum": 0,
      "maximum": 100,
      "description": "전체 공정률 (%)"
    },
    "issues": {
      "type": "string",
      "description": "특이사항/이슈"
    },
    "tomorrowPlan": {
      "type": "string",
      "description": "내일 작업 계획"
    },
    "materials": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "quantity": { "type": "number" },
          "unit": { "type": "string" },
          "supplier": { "type": "string" }
        },
        "required": ["name"]
      },
      "description": "자재 사용/반입 기록"
    },
    "weather": {
      "type": "object",
      "properties": {
        "condition": { "type": "string", "enum": ["sunny", "cloudy", "rainy", "snowy", "foggy"] },
        "tempHigh": { "type": "number" },
        "tempLow": { "type": "number" },
        "humidity": { "type": "number" }
      },
      "description": "날씨 (자동 수집)"
    },
    "expenses": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "category": { "type": "string", "enum": ["labor", "material", "equipment", "transportation", "misc"] },
          "amount": { "type": "number", "minimum": 0 },
          "description": { "type": "string" }
        },
        "required": ["category", "amount"]
      },
      "description": "비용 지출 기록"
    },
    "safetyChecklist": {
      "type": "object",
      "properties": {
        "helmets": { "type": "boolean" },
        "fireExtinguisher": { "type": "boolean" },
        "electricalSafety": { "type": "boolean" },
        "fallProtection": { "type": "boolean" },
        "ventilation": { "type": "boolean" }
      },
      "description": "안전 체크리스트"
    },
    "clientNote": {
      "type": "string",
      "description": "고객에게 공유할 메모"
    },
    "voiceMemoUrl": {
      "type": "string",
      "format": "uri",
      "description": "음성 메모 파일 URL"
    },
    "videoUrl": {
      "type": "string",
      "format": "uri",
      "description": "작업 동영상 URL"
    },
    "satisfaction": {
      "type": "string",
      "enum": ["good", "neutral", "bad"],
      "description": "현장 상태 자체 평가"
    },
    "isSharedWithClient": {
      "type": "boolean",
      "default": false,
      "description": "고객 공유 여부"
    },
    "sharedAt": {
      "type": "string",
      "format": "date-time",
      "description": "고객 공유 일시"
    },
    "createdAt": {
      "type": "string",
      "format": "date-time"
    },
    "updatedAt": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": ["id", "projectId", "date", "createdBy", "photos", "trades", "workDescription"]
}
```

---

## 7. Drizzle ORM 테이블 제안

```typescript
// src/db/schema/worklog.ts
import { pgTable, uuid, text, date, timestamp, numeric, integer, boolean, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { projects } from './project';
import { users } from './auth';

export const weatherConditionEnum = pgEnum('weather_condition', ['sunny', 'cloudy', 'rainy', 'snowy', 'foggy']);
export const satisfactionEnum = pgEnum('satisfaction', ['good', 'neutral', 'bad']);

export const workLogs = pgTable('work_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  projectId: uuid('project_id').notNull().references(() => projects.id),
  date: date('date').notNull(),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  trades: text('trades').array().notNull(), // ['wallpaper', 'flooring']
  workDescription: text('work_description').notNull(),
  progressRate: numeric('progress_rate', { precision: 5, scale: 2 }),
  issues: text('issues'),
  tomorrowPlan: text('tomorrow_plan'),
  workers: jsonb('workers'), // [{trade, count, dailyWage}]
  materials: jsonb('materials'), // [{name, quantity, unit, supplier}]
  weather: jsonb('weather'), // {condition, tempHigh, tempLow, humidity}
  expenses: jsonb('expenses'), // [{category, amount, description}]
  safetyChecklist: jsonb('safety_checklist'),
  clientNote: text('client_note'),
  voiceMemoUrl: text('voice_memo_url'),
  satisfaction: satisfactionEnum('satisfaction'),
  isSharedWithClient: boolean('is_shared_with_client').default(false),
  sharedAt: timestamp('shared_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const workLogPhotos = pgTable('work_log_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  workLogId: uuid('work_log_id').notNull().references(() => workLogs.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  caption: text('caption'),
  takenAt: timestamp('taken_at'),
  gpsLat: numeric('gps_lat', { precision: 10, scale: 7 }),
  gpsLng: numeric('gps_lng', { precision: 10, scale: 7 }),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

---

> 작성일: 2026년 3월 29일 | 인테리어코치 전략팀

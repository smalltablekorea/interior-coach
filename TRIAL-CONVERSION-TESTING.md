# 무료체험 → 유료 전환 넛지/알림 시스템 테스트 가이드

이 문서는 AI-73 이슈로 구현된 트라이얼 전환 시스템의 테스트 방법을 설명합니다.

## 🎯 구현된 기능

### 1. 인앱 알림 (D-7, D-3, D-1)
- **D-7**: 🎯 무료체험 7일 남았어요!
- **D-3**: ⚠️ 무료체험 3일 남았어요!
- **D-1**: 🚨 무료체험 내일 종료!

### 2. 이메일 알림 시퀀스
- 각 시점별 맞춤 이메일 템플릿
- 긴급도에 따른 다른 디자인과 메시지 톤
- UTM 파라미터로 추적 가능

### 3. 사용량 기반 넛지
- 현장 80% 이상 사용 시 알림
- 고객 80% 이상 관리 시 알림
- 한계 도달 시 업그레이드 권유

### 4. 체험 종료 후 Graceful 제한
- 데이터 삭제 없음 (읽기 모드 유지)
- 새로운 데이터 생성/편집 제한
- 명확한 업그레이드 안내

### 5. UI 컴포넌트
- 트라이얼 카운트다운 배너
- 업그레이드 모달
- 사용량 경고 표시

## 🧪 테스트 시나리오

### 시나리오 1: D-7 알림 테스트

```sql
-- 7일 후 만료되는 트라이얼 구독 생성
UPDATE subscriptions 
SET 
  status = 'trialing',
  trial_ends_at = NOW() + INTERVAL '7 days',
  plan = 'pro'
WHERE user_id = 'test-user-id';
```

**예상 결과:**
- 크론 실행 시 인앱 알림 생성
- 이메일 발송 (파란색 테마, "7일의 기회" 메시지)
- 대시보드에 파란색 배너 표시

### 시나리오 2: D-1 긴급 알림 테스트

```sql
-- 내일 만료되는 트라이얼 구독 생성
UPDATE subscriptions 
SET 
  status = 'trialing',
  trial_ends_at = NOW() + INTERVAL '1 day',
  plan = 'pro'
WHERE user_id = 'test-user-id';
```

**예상 결과:**
- 긴급 알림 (빨간색 테마)
- "마지막 기회" 배지 표시
- 이메일에 성공 사례 포함

### 시나리오 3: 사용량 기반 넛지 테스트

```sql
-- Free 플랜에서 현장 2개 생성 (한계: 3개)
INSERT INTO sites (user_id, name, workspace_id) VALUES
('test-user-id', '테스트 현장 1', 'workspace-id'),
('test-user-id', '테스트 현장 2', 'workspace-id');

UPDATE subscriptions 
SET plan = 'free', status = 'active'
WHERE user_id = 'test-user-id';
```

**예상 결과:**
- 현장 추가 시 80% 경고 표시
- 3개째 현장 생성 시 업그레이드 모달

### 시나리오 4: 트라이얼 만료 후 Read-only 테스트

```sql
-- 만료된 트라이얼을 Free 플랜으로 전환
UPDATE subscriptions 
SET 
  plan = 'free',
  status = 'active',
  trial_ends_at = NOW() - INTERVAL '1 day'
WHERE user_id = 'test-user-id';
```

**예상 결과:**
- 모든 읽기 기능 정상 작동
- 생성/편집 시 업그레이드 모달 표시
- "무료체험 종료" 배너 표시

## 🔧 개발자 테스트 도구

### 1. 크론 수동 실행

```bash
# 트라이얼 넛지 크론 수동 실행
curl -X POST 'http://localhost:3000/api/trial/nudge' \
  -H 'Authorization: Bearer your-cron-secret'
```

### 2. 트라이얼 상태 API 호출

```javascript
// 브라우저 콘솔에서 실행
fetch('/api/subscription')
  .then(res => res.json())
  .then(data => console.log('구독 상태:', data));

// 트라이얼 제한 상태 확인 (구현된 경우)
fetch('/api/trial/status')
  .then(res => res.json())
  .then(data => console.log('트라이얼 상태:', data));
```

### 3. React Hook 테스트

```jsx
import { useTrialStatus } from '@/hooks/useTrialStatus';

function TestComponent() {
  const {
    isTrialExpired,
    daysLeft,
    checkActionAllowed,
    handleBlockedAction,
    getCountdownInfo
  } = useTrialStatus();

  const handleCreateSite = () => {
    if (!handleBlockedAction('create', 'sites')) {
      console.log('현장 생성이 차단됨');
      return;
    }
    
    // 현장 생성 로직
    console.log('현장 생성 허용됨');
  };

  return (
    <div>
      <p>트라이얼 상태: {isTrialExpired ? '만료' : `${daysLeft}일 남음`}</p>
      <button onClick={handleCreateSite}>
        현장 생성
      </button>
    </div>
  );
}
```

## 📧 이메일 테스트

### 환경변수 설정 확인
```bash
# .env.local
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@interiorcoach.kr
```

### 이메일 발송 테스트
```javascript
// 개발자 콘솔에서
import { sendTrialNudgeEmail } from '@/lib/trial-emails';

await sendTrialNudgeEmail({
  to: 'test@example.com',
  userName: '테스트 사용자',
  daysLeft: 3,
  plan: 'pro',
  userId: 'test-user-id'
});
```

## 🎨 UI 컴포넌트 테스트

### 1. 트라이얼 배너 테스트
```jsx
import { TrialCountdownBanner } from '@/components/trial/TrialCountdownBanner';

<TrialCountdownBanner
  daysLeft={1}
  urgency="high"
  message="체험이 내일 종료됩니다!"
  ctaText="지금 즉시 구독"
/>
```

### 2. 업그레이드 모달 테스트
```jsx
import { TrialUpgradeModal } from '@/components/trial/TrialUpgradeModal';

<TrialUpgradeModal
  isOpen={true}
  reason="trial_expired"
  daysLeft={0}
  onClose={() => console.log('모달 닫힘')}
/>
```

## 📊 성과 측정 지표

### 추적 가능한 UTM 파라미터
- **utm_source**: `email`, `trial_banner`, `upgrade_modal`
- **utm_medium**: `trial_nudge`, `usage_limit`, `feature_lock`
- **utm_campaign**: `d7`, `d3`, `d1`, `trial_conversion`

### 분석 포인트
1. **알림별 전환율**
   - D-7 알림 후 구독률
   - D-3 알림 후 구독률  
   - D-1 알림 후 구독률

2. **사용량 넛지 효과**
   - 80% 경고 후 구독률
   - 100% 차단 후 구독률

3. **이메일 성과**
   - 오픈율, 클릭률
   - 이메일별 전환율

4. **Read-only 모드 효과**
   - 만료 후 복귀율
   - 평균 복귀 기간

## 🚀 배포 체크리스트

### 1. 환경변수 설정
- [ ] `RESEND_API_KEY` 설정
- [ ] `RESEND_FROM_EMAIL` 설정  
- [ ] `CRON_SECRET` 설정

### 2. 데이터베이스 마이그레이션
- [ ] 기존 subscriptions 테이블 확인
- [ ] trial_ends_at 필드 존재 확인
- [ ] notifications 테이블 확인

### 3. Vercel 크론 작업
- [ ] `/api/trial/nudge` 엔드포인트 배포
- [ ] 크론 스케줄 활성화 확인 (매일 10시)
- [ ] 크론 실행 로그 모니터링

### 4. 프론트엔드 컴포넌트
- [ ] 트라이얼 배너 적절한 위치에 배치
- [ ] 업그레이드 모달 전역 사용 가능
- [ ] 사용량 표시기 각 페이지에 적용

### 5. 모니터링 설정
- [ ] 이메일 발송 성공/실패 로그
- [ ] 크론 실행 성공/실패 알림
- [ ] 사용자 전환율 추적 설정

## 🐛 문제 해결 가이드

### 이메일이 발송되지 않을 때
1. RESEND_API_KEY 확인
2. From 이메일 도메인 인증 확인
3. 수신자 이메일 주소 유효성 확인

### 크론이 실행되지 않을 때
1. Vercel 배포 상태 확인
2. CRON_SECRET 환경변수 확인
3. 크론 함수 로그 확인

### UI 컴포넌트 오류
1. 필요한 의존성 패키지 설치 확인
2. 타입스크립트 에러 확인
3. 브라우저 콘솔 에러 확인

## 📈 최적화 방안

### 성능 최적화
- 크론 실행 시간 최적화 (배치 처리)
- 이메일 발송 큐 시스템 도입
- 캐싱을 통한 API 응답 속도 개선

### 사용자 경험 개선
- 개인화된 넛지 메시지
- A/B 테스트를 통한 최적 타이밍 발견
- 더 세밀한 사용량 기반 알림

### 전환율 향상
- 업그레이드 인센티브 추가
- 사회적 증명 강화
- 더 명확한 가치 제안
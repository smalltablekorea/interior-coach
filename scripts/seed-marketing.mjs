// 마케팅 센터 시드 데이터
// Run: node scripts/seed-marketing.mjs
//
// 시스템 세그먼트 9개, 기본 자동화 5개, 샘플 캠페인 3개,
// 샘플 실험 2개, 최근 30일 일별 메트릭, 샘플 리드 10명

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function hoursAgo(n) {
  const d = new Date();
  d.setHours(d.getHours() - n);
  return d.toISOString();
}

async function seed() {
  console.log("=== 마케팅 센터 시드 시작 ===\n");

  // ────────────────────────────────────────────
  // 1. 기본 세그먼트 (9개)
  // ────────────────────────────────────────────
  console.log("1) 시스템 세그먼트 생성...");
  const segments = await sql`
    INSERT INTO mkt_segments (id, name, description, rules, member_count, is_system, is_active, last_calculated_at) VALUES
      (gen_random_uuid(), '가입만 함', '가입 후 업로드 미시작 사용자',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "has_signed_up", operator: "eq", value: true },
         { field: "has_uploaded", operator: "eq", value: false }
       ]})}, 142, true, true, NOW()),
      (gen_random_uuid(), '업로드 미시작', '가입 후 3일 이상 업로드 미시작',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "has_signed_up", operator: "eq", value: true },
         { field: "has_uploaded", operator: "eq", value: false },
         { field: "days_since_signup", operator: "gte", value: 3 }
       ]})}, 87, true, true, NOW()),
      (gen_random_uuid(), '업로드 중단', '업로드 시작 후 제출 미완료',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "has_uploaded", operator: "eq", value: true },
         { field: "has_submitted", operator: "eq", value: false }
       ]})}, 34, true, true, NOW()),
      (gen_random_uuid(), '분석 완료·미결제', '분석 완료 후 결제 미진행',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "has_analyzed", operator: "eq", value: true },
         { field: "has_paid", operator: "eq", value: false }
       ]})}, 56, true, true, NOW()),
      (gen_random_uuid(), '결제 실패', '결제 시도 후 실패한 사용자',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "last_event", operator: "eq", value: "payment_failed" }
       ]})}, 8, true, true, NOW()),
      (gen_random_uuid(), '리포트 미확인', '결제 완료 후 리포트 미조회',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "has_paid", operator: "eq", value: true },
         { field: "has_viewed_report", operator: "eq", value: false }
       ]})}, 12, true, true, NOW()),
      (gen_random_uuid(), '업체문의 완료', '업체문의까지 완료한 고객',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "has_inquired", operator: "eq", value: true }
       ]})}, 23, true, true, NOW()),
      (gen_random_uuid(), '7일 비활성', '최근 7일간 활동 없는 사용자',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "days_since_last_active", operator: "gte", value: 7 },
         { field: "status", operator: "neq", value: "customer" }
       ]})}, 65, true, true, NOW()),
      (gen_random_uuid(), '고가치 리드', '리드 점수 80 이상',
       ${JSON.stringify({ logic: "and", rules: [
         { field: "lead_score", operator: "gte", value: 80 }
       ]})}, 19, true, true, NOW())
    RETURNING id, name
  `;
  console.log("  세그먼트:", segments.map(s => s.name).join(", "));

  // 세그먼트 ID 매핑
  const segMap = {};
  for (const s of segments) segMap[s.name] = s.id;

  // ────────────────────────────────────────────
  // 2. 기본 자동화 5개 + 단계
  // ────────────────────────────────────────────
  console.log("\n2) 시스템 자동화 생성...");

  const defaultSafeguards = JSON.stringify({
    noNightSend: true,
    excludeRecentPayers: false,
    maxSendPerDay: 3,
    dedupeWindow: 24,
    preventReentry: true,
  });

  // 자동화 1: 가입→업로드 유도
  const [auto1] = await sql`
    INSERT INTO mkt_automations (id, name, description, status, trigger_event, trigger_segment_id, safeguards, is_system, total_entered, total_completed, total_converted)
    VALUES (gen_random_uuid(), '가입 → 업로드 유도', '가입 후 업로드를 시작하지 않은 사용자에게 안내 발송', 'active', 'signup_completed', ${segMap["가입만 함"]}, ${defaultSafeguards}, true, 320, 180, 95)
    RETURNING id
  `;
  await sql`
    INSERT INTO mkt_automation_steps (id, automation_id, sort_order, type, config) VALUES
      (gen_random_uuid(), ${auto1.id}, 0, 'trigger', ${JSON.stringify({ trigger: { type: "event", event: "signup_completed" } })}),
      (gen_random_uuid(), ${auto1.id}, 1, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 3600 } })}),
      (gen_random_uuid(), ${auto1.id}, 2, 'action', ${JSON.stringify({ action: { type: "send_email", channel: "email", content: "견적코치에 오신 걸 환영합니다! 지금 도면을 업로드하시면 무료 AI 분석을 받아보실 수 있어요." } })}),
      (gen_random_uuid(), ${auto1.id}, 3, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 86400 } })}),
      (gen_random_uuid(), ${auto1.id}, 4, 'condition', ${JSON.stringify({ condition: { field: "has_uploaded", operator: "eq", value: false, trueBranch: 5 } })}),
      (gen_random_uuid(), ${auto1.id}, 5, 'action', ${JSON.stringify({ action: { type: "send_kakao", channel: "kakao", content: "아직 도면을 업로드하지 않으셨네요. 3분이면 AI가 견적을 분석해드립니다!" } })})
  `;

  // 자동화 2: 업로드 중단→계속 유도
  const [auto2] = await sql`
    INSERT INTO mkt_automations (id, name, description, status, trigger_event, trigger_segment_id, safeguards, is_system, total_entered, total_completed, total_converted)
    VALUES (gen_random_uuid(), '업로드 중단 → 계속하기 유도', '업로드를 시작했지만 제출하지 않은 사용자 리마인더', 'active', 'upload_started', ${segMap["업로드 중단"]}, ${defaultSafeguards}, true, 150, 85, 52)
    RETURNING id
  `;
  await sql`
    INSERT INTO mkt_automation_steps (id, automation_id, sort_order, type, config) VALUES
      (gen_random_uuid(), ${auto2.id}, 0, 'trigger', ${JSON.stringify({ trigger: { type: "event", event: "upload_started" } })}),
      (gen_random_uuid(), ${auto2.id}, 1, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 7200 } })}),
      (gen_random_uuid(), ${auto2.id}, 2, 'condition', ${JSON.stringify({ condition: { field: "has_submitted", operator: "eq", value: false, trueBranch: 3 } })}),
      (gen_random_uuid(), ${auto2.id}, 3, 'action', ${JSON.stringify({ action: { type: "send_email", channel: "email", content: "업로드가 중단되었어요. 이어서 진행하시면 바로 AI 분석 결과를 받아보실 수 있습니다." } })})
  `;

  // 자동화 3: 분석 완료→결제 넛지
  const [auto3] = await sql`
    INSERT INTO mkt_automations (id, name, description, status, trigger_event, trigger_segment_id, safeguards, is_system, total_entered, total_completed, total_converted)
    VALUES (gen_random_uuid(), '분석 완료 → 결제 넛지', '분석 완료 후 결제하지 않은 사용자에게 결제 유도', 'active', 'analysis_completed', ${segMap["분석 완료·미결제"]}, ${defaultSafeguards}, true, 210, 130, 78)
    RETURNING id
  `;
  await sql`
    INSERT INTO mkt_automation_steps (id, automation_id, sort_order, type, config) VALUES
      (gen_random_uuid(), ${auto3.id}, 0, 'trigger', ${JSON.stringify({ trigger: { type: "event", event: "analysis_completed" } })}),
      (gen_random_uuid(), ${auto3.id}, 1, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 43200 } })}),
      (gen_random_uuid(), ${auto3.id}, 2, 'condition', ${JSON.stringify({ condition: { field: "has_paid", operator: "eq", value: false, trueBranch: 3 } })}),
      (gen_random_uuid(), ${auto3.id}, 3, 'action', ${JSON.stringify({ action: { type: "send_email", channel: "email", content: "AI 견적 분석이 완료되었습니다! 상세 리포트를 확인하시고 최적의 시공 업체를 만나보세요." } })}),
      (gen_random_uuid(), ${auto3.id}, 4, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 172800 } })}),
      (gen_random_uuid(), ${auto3.id}, 5, 'action', ${JSON.stringify({ action: { type: "send_kakao", channel: "kakao", content: "견적 분석 리포트가 대기 중이에요. 지금 확인하시면 업체별 비교까지 한눈에 보실 수 있습니다." } })})
  `;

  // 자동화 4: 결제→리포트/팁 안내
  const [auto4] = await sql`
    INSERT INTO mkt_automations (id, name, description, status, trigger_event, safeguards, is_system, total_entered, total_completed, total_converted)
    VALUES (gen_random_uuid(), '결제 완료 → 리포트·팁 안내', '결제 완료 후 리포트 확인 및 활용 팁 발송', 'active', 'payment_succeeded', ${defaultSafeguards}, true, 180, 160, 120)
    RETURNING id
  `;
  await sql`
    INSERT INTO mkt_automation_steps (id, automation_id, sort_order, type, config) VALUES
      (gen_random_uuid(), ${auto4.id}, 0, 'trigger', ${JSON.stringify({ trigger: { type: "event", event: "payment_succeeded" } })}),
      (gen_random_uuid(), ${auto4.id}, 1, 'action', ${JSON.stringify({ action: { type: "send_email", channel: "email", content: "결제가 완료되었습니다! 지금 바로 견적 분석 리포트를 확인해보세요." } })}),
      (gen_random_uuid(), ${auto4.id}, 2, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 86400 } })}),
      (gen_random_uuid(), ${auto4.id}, 3, 'action', ${JSON.stringify({ action: { type: "send_email", channel: "email", content: "리포트 활용 팁: 업체별 견적 비교 시 재료 단가와 시공비를 분리해서 확인하세요. 추천 업체에 바로 문의도 가능합니다!" } })})
  `;

  // 자동화 5: 리포트 확인→리뷰 요청
  const [auto5] = await sql`
    INSERT INTO mkt_automations (id, name, description, status, trigger_event, safeguards, is_system, total_entered, total_completed, total_converted)
    VALUES (gen_random_uuid(), '리포트 확인 → 리뷰 요청', '리포트 확인 후 3일 뒤 리뷰 요청', 'active', 'report_viewed', ${defaultSafeguards}, true, 95, 70, 25)
    RETURNING id
  `;
  await sql`
    INSERT INTO mkt_automation_steps (id, automation_id, sort_order, type, config) VALUES
      (gen_random_uuid(), ${auto5.id}, 0, 'trigger', ${JSON.stringify({ trigger: { type: "event", event: "report_viewed" } })}),
      (gen_random_uuid(), ${auto5.id}, 1, 'delay', ${JSON.stringify({ action: { type: "wait" }, trigger: { delay: 259200 } })}),
      (gen_random_uuid(), ${auto5.id}, 2, 'action', ${JSON.stringify({ action: { type: "send_email", channel: "email", content: "견적코치 이용은 어떠셨나요? 간단한 리뷰를 남겨주시면 다른 분들에게도 큰 도움이 됩니다." } })})
  `;

  console.log("  자동화 5개 + 단계 생성 완료");

  // ────────────────────────────────────────────
  // 3. 샘플 캠페인 3개
  // ────────────────────────────────────────────
  console.log("\n3) 샘플 캠페인 생성...");
  await sql`
    INSERT INTO mkt_admin_campaigns (id, name, description, goal, channel, status, budget, spent, start_date, end_date,
      utm_source, utm_medium, utm_campaign, target_segment_id,
      kpi_metric, kpi_target, kpi_current,
      impressions, clicks, signups, payments, revenue)
    VALUES
      (gen_random_uuid(), '네이버 검색광고 - 인테리어 견적', '인테리어 견적 키워드 검색광고', '신규 가입 유치',
       'search_ads', 'active', 3000000, 1850000, ${daysAgo(21)}, ${daysAgo(-10)},
       'naver', 'cpc', 'interior_estimate_2026q1', ${segMap["가입만 함"]},
       'signups', 500, 342,
       48500, 3200, 342, 45, 2250000),
      (gen_random_uuid(), '분석 완료 미결제 리타겟', '분석까지 했지만 결제 안 한 사용자 대상 리타게팅', '결제 전환',
       'retargeting', 'active', 1000000, 420000, ${daysAgo(14)}, ${daysAgo(-17)},
       'gyeonjeokcoach', 'retargeting', 'unpaid_retarget_mar', ${segMap["분석 완료·미결제"]},
       'payments', 100, 38,
       12000, 850, 0, 38, 1900000),
      (gen_random_uuid(), '봄 시즌 이메일 캠페인', '봄 인테리어 시즌 가입자 대상 이메일 캠페인', '업로드 유도',
       'email', 'completed', 0, 0, ${daysAgo(30)}, ${daysAgo(7)},
       'gyeonjeokcoach', 'email', 'spring_season_2026', null,
       'upload_starts', 200, 178,
       0, 0, 0, 22, 1100000)
  `;
  console.log("  캠페인 3개 생성 완료");

  // ────────────────────────────────────────────
  // 4. 샘플 실험 2개
  // ────────────────────────────────────────────
  console.log("\n4) 샘플 실험 생성...");
  const experiments = await sql`
    INSERT INTO mkt_experiments (id, name, description, target_element, status, primary_metric, start_date, end_date, traffic_percent)
    VALUES
      (gen_random_uuid(), 'CTA 버튼 문구 테스트', '메인 히어로 CTA 버튼 문구 A/B 테스트', 'cta', 'running', 'upload_start_rate', ${daysAgo(10)}, ${daysAgo(-4)}, 100),
      (gen_random_uuid(), '가격 표시 방식 테스트', '결제 페이지 가격 강조 방식 비교', 'price_copy', 'completed', 'payment_rate', ${daysAgo(30)}, ${daysAgo(5)}, 50)
    RETURNING id, name
  `;

  const [exp1, exp2] = experiments;

  // 실험 1 변형
  await sql`
    INSERT INTO mkt_experiment_variants (id, experiment_id, name, description, content, traffic_weight, impressions, clicks, conversions, conversion_rate, is_control) VALUES
      (gen_random_uuid(), ${exp1.id}, 'A (컨트롤)', '무료 견적 분석 받기', ${JSON.stringify({ text: "무료 견적 분석 받기", color: "blue" })}, 50, 1240, 186, 62, 5.0, true),
      (gen_random_uuid(), ${exp1.id}, 'B', '3분만에 견적 비교하기', ${JSON.stringify({ text: "3분만에 견적 비교하기", color: "blue" })}, 50, 1260, 214, 78, 6.2, false)
  `;

  // 실험 2 변형 (완료됨, winner 설정)
  const exp2Variants = await sql`
    INSERT INTO mkt_experiment_variants (id, experiment_id, name, description, content, traffic_weight, impressions, clicks, conversions, conversion_rate, is_control) VALUES
      (gen_random_uuid(), ${exp2.id}, 'A (컨트롤)', '₩50,000 (부가세 별도)', ${JSON.stringify({ format: "price_only", text: "₩50,000 (부가세 별도)" })}, 50, 3800, 520, 95, 2.5, true),
      (gen_random_uuid(), ${exp2.id}, 'B', '커피 한 잔 값으로 수백만원 절약', ${JSON.stringify({ format: "value_framing", text: "커피 한 잔 값으로 수백만원 절약" })}, 50, 3750, 680, 142, 3.8, false)
    RETURNING id, name
  `;

  // winner 설정
  const winnerId = exp2Variants.find(v => v.name === 'B')?.id;
  if (winnerId) {
    await sql`UPDATE mkt_experiments SET winner_variant_id = ${winnerId} WHERE id = ${exp2.id}`;
  }
  console.log("  실험 2개 + 변형 생성 완료");

  // ────────────────────────────────────────────
  // 5. 최근 30일 일별 메트릭
  // ────────────────────────────────────────────
  console.log("\n5) 일별 메트릭 (30일)...");

  const dailyValues = [];
  for (let i = 29; i >= 0; i--) {
    const dateStr = daysAgo(i);
    const dayOfWeek = new Date(dateStr).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const weekendFactor = isWeekend ? 0.6 : 1.0;
    // 약간의 성장 트렌드 + 랜덤
    const growthFactor = 1 + (30 - i) * 0.008;
    const rand = () => 0.8 + Math.random() * 0.4;

    const visits = Math.round(180 * weekendFactor * growthFactor * rand());
    const signups = Math.round(visits * 0.12 * rand());
    const logins = Math.round((signups + visits * 0.3) * rand());
    const uploadStarts = Math.round(signups * 0.55 * rand());
    const uploadSubmits = Math.round(uploadStarts * 0.72 * rand());
    const analysisCompleted = Math.round(uploadSubmits * 0.88 * rand());
    const checkoutStarts = Math.round(analysisCompleted * 0.45 * rand());
    const paymentSucceeded = Math.round(checkoutStarts * 0.62 * rand());
    const paymentFailed = Math.round(checkoutStarts * 0.08 * rand());
    const reportViews = Math.round(paymentSucceeded * 0.85 * rand());
    const inquiries = Math.round(reportViews * 0.35 * rand());
    const revenue = paymentSucceeded * 50000;

    const byChannel = {
      naver: { visits: Math.round(visits * 0.4), signups: Math.round(signups * 0.35) },
      google: { visits: Math.round(visits * 0.25), signups: Math.round(signups * 0.2) },
      direct: { visits: Math.round(visits * 0.2), signups: Math.round(signups * 0.25) },
      referral: { visits: Math.round(visits * 0.15), signups: Math.round(signups * 0.2) },
    };
    const byDevice = {
      mobile: { visits: Math.round(visits * 0.65), signups: Math.round(signups * 0.6) },
      desktop: { visits: Math.round(visits * 0.3), signups: Math.round(signups * 0.35) },
      tablet: { visits: Math.round(visits * 0.05), signups: Math.round(signups * 0.05) },
    };
    const byRegion = {
      서울: Math.round(visits * 0.45),
      경기: Math.round(visits * 0.25),
      부산: Math.round(visits * 0.08),
      대구: Math.round(visits * 0.05),
      기타: Math.round(visits * 0.17),
    };

    dailyValues.push({
      dateStr, visits, signups, logins, uploadStarts, uploadSubmits,
      analysisCompleted, checkoutStarts, paymentSucceeded, paymentFailed,
      reportViews, inquiries, revenue, byChannel, byDevice, byRegion,
    });
  }

  // batch insert (5 rows at a time to avoid query size limits)
  for (let batch = 0; batch < dailyValues.length; batch += 5) {
    const chunk = dailyValues.slice(batch, batch + 5);
    for (const d of chunk) {
      await sql`
        INSERT INTO mkt_daily_metrics (id, date, visits, signups, logins, upload_starts, upload_submits,
          analysis_completed, checkout_starts, payment_succeeded, payment_failed,
          report_views, inquiries, revenue, by_channel, by_device, by_region)
        VALUES (gen_random_uuid(), ${d.dateStr}, ${d.visits}, ${d.signups}, ${d.logins},
          ${d.uploadStarts}, ${d.uploadSubmits}, ${d.analysisCompleted}, ${d.checkoutStarts},
          ${d.paymentSucceeded}, ${d.paymentFailed}, ${d.reportViews}, ${d.inquiries}, ${d.revenue},
          ${JSON.stringify(d.byChannel)}, ${JSON.stringify(d.byDevice)}, ${JSON.stringify(d.byRegion)})
      `;
    }
  }
  console.log("  30일 메트릭 생성 완료");

  // ────────────────────────────────────────────
  // 6. 샘플 리드 10명
  // ────────────────────────────────────────────
  console.log("\n6) 샘플 리드 생성...");

  const sampleLeads = [
    { name: "김서연", email: "seoyeon.kim@example.com", status: "customer", score: 130, src: "naver", med: "cpc", hasSignedUp: true, hasUploaded: true, hasSubmitted: true, hasAnalyzed: true, hasPaid: true, hasViewedReport: true, hasInquired: true, lastEvent: "inquiry_submitted", daysAgoActive: 1 },
    { name: "이준혁", email: "junhyuk.lee@example.com", status: "qualified", score: 95, src: "google", med: "organic", hasSignedUp: true, hasUploaded: true, hasSubmitted: true, hasAnalyzed: true, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "analysis_completed", daysAgoActive: 2 },
    { name: "박민지", email: "minji.park@example.com", status: "engaged", score: 60, src: "naver", med: "cpc", hasSignedUp: true, hasUploaded: true, hasSubmitted: true, hasAnalyzed: false, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "upload_submitted", daysAgoActive: 3 },
    { name: "최윤호", email: "yunho.choi@example.com", status: "engaged", score: 50, src: "direct", med: null, hasSignedUp: true, hasUploaded: true, hasSubmitted: false, hasAnalyzed: false, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "upload_started", daysAgoActive: 1 },
    { name: "정하나", email: "hana.jung@example.com", status: "identified", score: 15, src: "referral", med: "friend", hasSignedUp: true, hasUploaded: false, hasSubmitted: false, hasAnalyzed: false, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "signup_completed", daysAgoActive: 5 },
    { name: "강도윤", email: "doyun.kang@example.com", status: "customer", score: 110, src: "naver", med: "cpc", hasSignedUp: true, hasUploaded: true, hasSubmitted: true, hasAnalyzed: true, hasPaid: true, hasViewedReport: true, hasInquired: false, lastEvent: "report_viewed", daysAgoActive: 4 },
    { name: "송예진", email: "yejin.song@example.com", status: "qualified", score: 85, src: "google", med: "cpc", hasSignedUp: true, hasUploaded: true, hasSubmitted: true, hasAnalyzed: true, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "checkout_started", daysAgoActive: 1 },
    { name: "임재현", email: "jaehyun.im@example.com", status: "identified", score: 10, src: "naver", med: "organic", hasSignedUp: true, hasUploaded: false, hasSubmitted: false, hasAnalyzed: false, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "signup_completed", daysAgoActive: 8 },
    { name: "한소율", email: "soyul.han@example.com", status: "customer", score: 145, src: "referral", med: "review", hasSignedUp: true, hasUploaded: true, hasSubmitted: true, hasAnalyzed: true, hasPaid: true, hasViewedReport: true, hasInquired: true, lastEvent: "referral_shared", daysAgoActive: 0 },
    { name: "오태민", email: "taemin.oh@example.com", status: "churned", score: 5, src: "google", med: "organic", hasSignedUp: true, hasUploaded: false, hasSubmitted: false, hasAnalyzed: false, hasPaid: false, hasViewedReport: false, hasInquired: false, lastEvent: "login_completed", daysAgoActive: 15 },
  ];

  for (const lead of sampleLeads) {
    await sql`
      INSERT INTO mkt_leads (id, email, name, status, lead_score,
        first_source, first_medium,
        last_event, last_event_at, last_active_at,
        has_signed_up, has_uploaded, has_submitted, has_analyzed, has_paid, has_viewed_report, has_inquired,
        tags)
      VALUES (gen_random_uuid(), ${lead.email}, ${lead.name}, ${lead.status}, ${lead.score},
        ${lead.src}, ${lead.med},
        ${lead.lastEvent}, ${hoursAgo(lead.daysAgoActive * 24)}, ${hoursAgo(lead.daysAgoActive * 24)},
        ${lead.hasSignedUp}, ${lead.hasUploaded}, ${lead.hasSubmitted}, ${lead.hasAnalyzed}, ${lead.hasPaid}, ${lead.hasViewedReport}, ${lead.hasInquired},
        ${JSON.stringify(lead.status === "customer" ? ["VIP", "결제완료"] : lead.status === "churned" ? ["이탈위험"] : [])})
    `;
  }
  console.log("  리드 10명 생성 완료");

  // ────────────────────────────────────────────
  // 7. 샘플 이벤트 (리드별 최근 이벤트)
  // ────────────────────────────────────────────
  console.log("\n7) 샘플 이벤트 생성...");

  const eventSamples = [
    { email: "seoyeon.kim@example.com", events: ["signup_completed", "upload_started", "upload_submitted", "analysis_completed", "checkout_started", "payment_succeeded", "report_viewed", "inquiry_submitted"] },
    { email: "junhyuk.lee@example.com", events: ["signup_completed", "upload_started", "upload_submitted", "analysis_completed", "paywall_viewed"] },
    { email: "minji.park@example.com", events: ["signup_completed", "upload_started", "upload_submitted"] },
    { email: "yunho.choi@example.com", events: ["signup_completed", "upload_started"] },
    { email: "hana.jung@example.com", events: ["signup_completed"] },
    { email: "soyul.han@example.com", events: ["signup_completed", "upload_started", "upload_submitted", "analysis_completed", "payment_succeeded", "report_viewed", "inquiry_submitted", "referral_shared"] },
  ];

  for (const sample of eventSamples) {
    for (let i = 0; i < sample.events.length; i++) {
      const eventHoursAgo = (sample.events.length - i) * 12 + Math.floor(Math.random() * 6);
      await sql`
        INSERT INTO mkt_events (id, event_type, occurred_at, source, medium, device_type, metadata)
        VALUES (gen_random_uuid(), ${sample.events[i]}, ${hoursAgo(eventHoursAgo)},
          'naver', 'cpc', ${Math.random() > 0.35 ? 'mobile' : 'desktop'},
          ${JSON.stringify({ seed: true })})
      `;
    }
  }
  console.log("  샘플 이벤트 생성 완료");

  console.log("\n=== 마케팅 센터 시드 완료 ===");
  console.log("  - 세그먼트: 9개");
  console.log("  - 자동화: 5개 (+ 단계)");
  console.log("  - 캠페인: 3개");
  console.log("  - 실험: 2개 (+ 변형)");
  console.log("  - 일별 메트릭: 30일");
  console.log("  - 리드: 10명");
  console.log("  - 이벤트: ~30개");
}

seed().catch((err) => {
  console.error("시드 실패:", err);
  process.exit(1);
});

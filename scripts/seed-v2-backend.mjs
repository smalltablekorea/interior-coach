// Seed v2 backend demo data: projects(sites), defects, daily_logs, billings, workers, attendance
// Run: node scripts/seed-v2-backend.mjs
// Requires: SEED_USER_ID, SEED_WORKSPACE_ID env vars or uses defaults

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

// 실제 사용시 본인 userId / workspaceId 로 교체
const USER_ID = process.env.SEED_USER_ID || "system";
const WORKSPACE_ID = process.env.SEED_WORKSPACE_ID || null;

async function seed() {
  console.log("🌱 Seeding v2 backend demo data...\n");

  // ─── 1. Workers (6명) ───
  console.log("1/7 Creating workers...");
  const workers = await sql`
    INSERT INTO workers (id, user_id, workspace_id, name, phone, trade, daily_wage, memo) VALUES
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '김목수', '010-1111-0001', '목공', 350000, '경력 15년'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '박전기', '010-1111-0002', '전기', 300000, '전기기능사 자격'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '이설비', '010-1111-0003', '설비', 300000, '배관/위생 전문'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '최타일', '010-1111-0004', '타일', 320000, '대형타일 시공 가능'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '정도배', '010-1111-0005', '도배', 280000, '실크/합지 전문'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '한도장', '010-1111-0006', '도장', 300000, '친환경 페인트 전문')
    RETURNING id, name, trade
  `;
  console.log("  Workers:", workers.map(w => `${w.name}(${w.trade})`).join(", "));

  // ─── 2. Customers ───
  console.log("\n2/7 Creating customers...");
  const customers = await sql`
    INSERT INTO customers (id, user_id, workspace_id, name, phone, email, address, memo) VALUES
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '강남 아파트 고객', '010-2222-0001', 'gangnam@test.com', '서울시 강남구 테헤란로 123 래미안아파트 502호', '34평 전체 리모델링'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '분당 빌라 고객', '010-2222-0002', 'bundang@test.com', '성남시 분당구 정자일로 45 청구빌라 201호', '욕실+주방 부분 시공'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '마포 오피스텔 고객', '010-2222-0003', 'mapo@test.com', '서울시 마포구 월드컵로 88 오피스텔 1203호', '원룸 전체 리뉴얼'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, '용산 주택 고객', '010-2222-0004', 'yongsan@test.com', '서울시 용산구 한남대로 55-1', '단독주택 2층 전면 인테리어')
    RETURNING id, name
  `;
  console.log("  Customers:", customers.map(c => c.name).join(", "));

  // ─── 3. Sites (4개 프로젝트, progress/budget/spent/trades 포함) ───
  console.log("\n3/7 Creating sites (projects)...");
  const sites = await sql`
    INSERT INTO sites (id, user_id, workspace_id, customer_id, name, address, building_type, area_pyeong, status, start_date, end_date, progress, budget, spent, trades, memo) VALUES
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${customers[0].id},
        '강남 래미안 34평 리모델링', '서울시 강남구 테헤란로 123 래미안아파트 502호',
        '아파트', 34, '시공중', '2026-03-10', '2026-04-25',
        65, 85000000, 42000000,
        '["demolition","plumbing","electrical","carpentry","tile","wallpaper","paint","furniture","window"]'::jsonb,
        '전체 리모델링 - 철거~도배~조명 완공'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${customers[1].id},
        '분당 청구빌라 욕실+주방', '성남시 분당구 정자일로 45 청구빌라 201호',
        '빌라', 28, '시공중', '2026-03-17', '2026-04-15',
        35, 35000000, 9800000,
        '["demolition","plumbing","tile","waterproof","furniture"]'::jsonb,
        '욕실 2개소 + 주방 부분 시공'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${customers[2].id},
        '마포 오피스텔 원룸 리뉴얼', '서울시 마포구 월드컵로 88 오피스텔 1203호',
        '오피스텔', 12, '견적중', '2026-04-07', '2026-04-25',
        0, 15000000, 0,
        '["demolition","paint","wallpaper","flooring","lighting"]'::jsonb,
        '원룸 전체 리뉴얼 - 견적 확인 중'),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${customers[3].id},
        '용산 한남동 단독주택 2층', '서울시 용산구 한남대로 55-1',
        '주택', 55, '시공완료', '2026-01-15', '2026-03-20',
        100, 120000000, 108000000,
        '["demolition","plumbing","electrical","carpentry","tile","wallpaper","paint","furniture","window","flooring","waterproof","lighting"]'::jsonb,
        '2층 전면 인테리어 - 준공 완료')
    RETURNING id, name, status
  `;
  console.log("  Sites:", sites.map(s => `${s.name}(${s.status})`).join("\n        "));

  // ─── 4. Construction Phases (13개 공정 = 시공중 현장 2개) ───
  console.log("\n4/7 Creating construction phases...");
  const [site1, site2, site3, site4] = sites;

  // Site 1: 강남 래미안 (시공중 65%)
  await sql`
    INSERT INTO construction_phases (id, user_id, workspace_id, site_id, category, planned_start, planned_end, actual_start, actual_end, progress, status, sort_order) VALUES
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '철거', '2026-03-10', '2026-03-12', '2026-03-10', '2026-03-12', 100, '완료', 1),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '설비', '2026-03-13', '2026-03-15', '2026-03-13', '2026-03-15', 100, '완료', 2),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '전기', '2026-03-13', '2026-03-14', '2026-03-13', '2026-03-14', 100, '완료', 3),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '목공', '2026-03-16', '2026-03-22', '2026-03-16', '2026-03-23', 100, '완료', 4),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '타일', '2026-03-23', '2026-03-28', '2026-03-24', NULL, 70, '진행중', 5),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '도배', '2026-03-29', '2026-04-02', NULL, NULL, 0, '대기', 6),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '도장', '2026-04-03', '2026-04-08', NULL, NULL, 0, '대기', 7),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '가구', '2026-04-09', '2026-04-15', NULL, NULL, 0, '대기', 8),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '조명/마감', '2026-04-16', '2026-04-20', NULL, NULL, 0, '대기', 9),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site1.id}, '준공청소', '2026-04-21', '2026-04-23', NULL, NULL, 0, '대기', 10)
  `;

  // Site 2: 분당 청구빌라 (시공중 35%)
  await sql`
    INSERT INTO construction_phases (id, user_id, workspace_id, site_id, category, planned_start, planned_end, actual_start, actual_end, progress, status, sort_order) VALUES
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site2.id}, '철거', '2026-03-17', '2026-03-18', '2026-03-17', '2026-03-18', 100, '완료', 1),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site2.id}, '배관', '2026-03-19', '2026-03-21', '2026-03-19', NULL, 80, '진행중', 2),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site2.id}, '방수', '2026-03-24', '2026-03-26', NULL, NULL, 0, '대기', 3),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site2.id}, '타일', '2026-03-27', '2026-04-03', NULL, NULL, 0, '대기', 4),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site2.id}, '가구(주방)', '2026-04-04', '2026-04-10', NULL, NULL, 0, '대기', 5),
      (gen_random_uuid(), ${USER_ID}, ${WORKSPACE_ID}, ${site2.id}, '마감/청소', '2026-04-11', '2026-04-15', NULL, NULL, 0, '대기', 6)
  `;

  console.log("  Created 16 construction phases");

  // ─── 5. Defects (5건) ───
  console.log("\n5/7 Creating defects...");
  const defects = await sql`
    INSERT INTO defects (id, site_id, user_id, workspace_id, trade_id, trade_name, title, description, severity, status, reported_at, resolved_at, assigned_to_name) VALUES
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        'tile', '타일', '거실 타일 들뜸 발견', '거실 진입부 바닥 타일 3장이 들떠있음. 접착불량 추정. 재시공 필요.',
        'major', 'in_progress', '2026-03-28 10:30:00', NULL, '최타일'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        'plumbing', '설비', '주방 싱크대 하부 미세 누수', '싱크대 배수관 연결부에서 미세 누수 발견. 조인트 교체 필요.',
        'critical', 'reported', '2026-03-30 09:00:00', NULL, NULL),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        'carpentry', '목공', '안방 몰딩 마감 불량', '안방 천장 몰딩 이음새 부분 틈 발생. 코킹 재시공으로 보수 가능.',
        'minor', 'resolved', '2026-03-22 14:00:00', '2026-03-23 11:00:00', '김목수'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        'demolition', '철거', '화장실 바닥 일부 미철거', '메인 욕실 바닥 기존 타일 일부 잔존. 추가 철거 필요.',
        'major', 'resolved', '2026-03-18 16:00:00', '2026-03-19 09:00:00', NULL),
      (gen_random_uuid(), ${site4.id}, ${USER_ID}, ${WORKSPACE_ID},
        'electrical', '전기', 'A/S: 거실 조명 스위치 오작동', '거실 3구 스위치 중 2번째가 간헐적으로 작동 안됨. 점검 필요.',
        'minor', 'reported', '2026-03-25 11:00:00', NULL, '박전기')
    RETURNING id, title
  `;
  console.log("  Defects:", defects.map(d => d.title).join("\n           "));

  // ─── 6. Daily Logs (5건) ───
  console.log("\n6/7 Creating daily logs...");
  await sql`
    INSERT INTO daily_logs (id, site_id, user_id, workspace_id, author_name, log_date, trades_worked, trades_worked_names, summary, detail, issues, next_day_plan, weather, worker_count) VALUES
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '현장 관리자', '2026-03-28',
        '["tile"]'::jsonb, '["타일"]'::jsonb,
        '타일 시공 3일차 - 욕실 타일 완료, 거실 진행중',
        '메인 욕실 벽면 타일 시공 완료. 거실 바닥 타일 60% 진행. 일부 들뜸 발견하여 하자 접수.',
        '거실 타일 3장 들뜸 - 재시공 예정',
        '거실 바닥 타일 잔여분 시공 + 주방 벽면 타일 시작',
        'cloudy', 3),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '현장 관리자', '2026-03-27',
        '["tile"]'::jsonb, '["타일"]'::jsonb,
        '타일 시공 2일차 - 메인 욕실 벽면 진행',
        '메인 욕실 벽면 타일 시공 80% 완료. 포세린 600x600 적용. 줄눈 작업은 내일 예정.',
        NULL,
        '욕실 벽면 잔여분 + 바닥 시작',
        'sunny', 2),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '현장 관리자', '2026-03-26',
        '["tile","carpentry"]'::jsonb, '["타일","목공"]'::jsonb,
        '목공 잔여 마감 + 타일 자재 반입',
        '안방 몰딩 보수 완료. 타일 자재(포세린 600x600, 모자이크 300x300) 현장 반입. 시공 준비.',
        '안방 몰딩 이음새 코킹 보수',
        '타일 시공 시작 (욕실 우선)',
        'sunny', 2),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        '현장 관리자', '2026-03-20',
        '["plumbing"]'::jsonb, '["배관"]'::jsonb,
        '배관 시공 2일차 - 급수관 교체 진행',
        '메인 욕실 급수관 교체 완료. 보조 욕실 급수관 50% 진행. 온수 배관 단열 처리.',
        NULL,
        '보조 욕실 급수관 잔여 + 배수관 교체',
        'rainy', 2),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        '현장 관리자', '2026-03-19',
        '["plumbing","demolition"]'::jsonb, '["배관","철거"]'::jsonb,
        '미철거 잔여분 처리 + 배관 시작',
        '화장실 바닥 잔존 타일 추가 철거 완료. 메인 욕실 급수관 교체 시작.',
        '기존 배수관 상태 예상보다 노후 - 전체 교체 권장',
        '급수관 교체 계속 + 보조 욕실 착수',
        'cloudy', 3)
  `;
  console.log("  Created 5 daily logs");

  // ─── 7. Billings (9개 마일스톤) ───
  console.log("\n7/7 Creating billing milestones...");
  await sql`
    INSERT INTO billings (id, site_id, user_id, workspace_id, milestone_name, trade_id, milestone_order, amount, tax_amount, status, due_date, paid_at, notes) VALUES
      -- Site 1: 강남 래미안 (계약금 8,500만)
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '계약금', NULL, 1, 25500000, 2550000, 'paid', '2026-03-10', '2026-03-10 10:00:00', '계약 체결 시 30%'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '철거/설비/전기 완료', 'demolition', 2, 17000000, 1700000, 'paid', '2026-03-15', '2026-03-16 14:00:00', '1차 중도금 20%'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '목공/타일 완료', 'carpentry', 3, 17000000, 1700000, 'invoiced', '2026-04-01', NULL, '2차 중도금 20% - 청구 완료'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '도배/도장 완료', 'wallpaper', 4, 12750000, 1275000, 'pending', '2026-04-10', NULL, '3차 중도금 15%'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID},
        '준공 잔금', NULL, 5, 12750000, 1275000, 'pending', '2026-04-25', NULL, '잔금 15%'),

      -- Site 2: 분당 청구빌라 (계약금 3,500만)
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        '계약금', NULL, 1, 10500000, 1050000, 'paid', '2026-03-17', '2026-03-17 09:00:00', '30%'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        '철거/배관 완료', 'demolition', 2, 8750000, 875000, 'pending', '2026-03-28', NULL, '중도금 25%'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        '타일/방수 완료', 'tile', 3, 8750000, 875000, 'pending', '2026-04-08', NULL, '중도금 25%'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID},
        '준공 잔금', NULL, 4, 7000000, 700000, 'pending', '2026-04-15', NULL, '잔금 20%')
  `;
  console.log("  Created 9 billing milestones");

  // ─── 8. Attendance (출역 데이터) ───
  console.log("\n8/8 Creating attendance records...");
  const w = workers;
  await sql`
    INSERT INTO attendance (id, site_id, user_id, workspace_id, member_id, member_name, role, work_date, check_in, check_out, hours_worked, overtime_hours, status, notes) VALUES
      -- Site 1: 3/28 타일 시공
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, ${w[3].id}, '최타일', '타일', '2026-03-28', '08:00', '18:00', 10, 2, 'present', '거실 바닥 타일 시공'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, NULL, '타일 보조1', '타일보조', '2026-03-28', '08:30', '17:30', 9, 1, 'present', NULL),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, NULL, '타일 보조2', '타일보조', '2026-03-28', '08:30', '17:00', 8.5, 0.5, 'present', NULL),

      -- Site 1: 3/27 타일 시공
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, ${w[3].id}, '최타일', '타일', '2026-03-27', '08:00', '17:00', 9, 1, 'present', '욕실 벽면 타일'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, NULL, '타일 보조1', '타일보조', '2026-03-27', '09:00', '17:00', 8, 0, 'present', NULL),

      -- Site 1: 3/26 목공 마감 + 타일 자재 반입
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, ${w[0].id}, '김목수', '목공', '2026-03-26', '08:00', '15:00', 7, 0, 'present', '안방 몰딩 보수'),
      (gen_random_uuid(), ${site1.id}, ${USER_ID}, ${WORKSPACE_ID}, ${w[3].id}, '최타일', '타일', '2026-03-26', '13:00', '17:00', 4, 0, 'half_day', '타일 자재 반입 확인'),

      -- Site 2: 3/20 배관 시공
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID}, ${w[2].id}, '이설비', '설비', '2026-03-20', '08:00', '17:30', 9.5, 1.5, 'present', '급수관 교체'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID}, NULL, '설비 보조', '설비보조', '2026-03-20', '08:30', '17:00', 8.5, 0.5, 'present', NULL),

      -- Site 2: 3/19 철거 잔여 + 배관 시작
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID}, ${w[2].id}, '이설비', '설비', '2026-03-19', '08:00', '18:00', 10, 2, 'present', '배관 시작'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID}, NULL, '철거팀', '철거', '2026-03-19', '08:00', '12:00', 4, 0, 'half_day', '잔존 타일 추가 철거'),
      (gen_random_uuid(), ${site2.id}, ${USER_ID}, ${WORKSPACE_ID}, NULL, '설비 보조', '설비보조', '2026-03-19', '09:00', '18:00', 9, 1, 'present', NULL)
  `;
  console.log("  Created 12 attendance records");

  // ─── Summary ───
  console.log("\n✅ v2 Backend demo data seeded successfully!");
  console.log("  - 6 workers");
  console.log("  - 4 customers");
  console.log("  - 4 sites (2 시공중, 1 견적중, 1 시공완료)");
  console.log("  - 16 construction phases");
  console.log("  - 5 defects");
  console.log("  - 5 daily logs");
  console.log("  - 9 billing milestones");
  console.log("  - 12 attendance records");
}

seed().catch(console.error);

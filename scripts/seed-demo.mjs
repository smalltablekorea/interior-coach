// Seed demo schedule data from the spreadsheet screenshot
// Run: node scripts/seed-demo.mjs

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  const userId = "system";

  // 1. Create customers
  console.log("Creating customers...");
  const customers = await sql`
    INSERT INTO customers (id, user_id, name, phone, address) VALUES
      (gen_random_uuid(), ${userId}, '한남동 고객', '010-1234-5678', '서울시 용산구 독서당로 70'),
      (gen_random_uuid(), ${userId}, '일성스카이빌 고객', '010-2345-6789', '서울 강서구 강서로5나길 50 일성스카이빌 1404'),
      (gen_random_uuid(), ${userId}, '우장산 고객', '010-3456-7890', '서울시 강서구 우장산로 92 우장산롯데아파트 102동 1106호')
    RETURNING id, name
  `;
  console.log("Customers created:", customers.map(c => c.name));

  const [cust1, cust2, cust3] = customers;

  // 2. Create sites
  console.log("Creating sites...");
  const sites = await sql`
    INSERT INTO sites (id, user_id, customer_id, name, address, building_type, area_pyeong, status, start_date, end_date, memo) VALUES
      (gen_random_uuid(), ${userId}, ${cust1.id}, '한남동 현대리버티하우스', '서울시 용산구 독서당로 70', '아파트', 62, '시공중', '2026-03-03', '2026-04-01', '802호'),
      (gen_random_uuid(), ${userId}, ${cust2.id}, '일성스카이빌', '서울 강서구 강서로5나길 50 일성스카이빌 1404', '아파트', 45, '시공중', '2026-03-03', '2026-04-05', NULL),
      (gen_random_uuid(), ${userId}, ${cust3.id}, '우장산 롯데아파트', '서울시 강서구 우장산로 92 우장산롯데아파트 102동 1106호', '아파트', 50, '시공중', '2026-03-07', '2026-04-10', NULL)
    RETURNING id, name
  `;
  console.log("Sites created:", sites.map(s => s.name));

  const [site1, site2, site3] = sites;

  // 3. Create construction phases
  // Site 1: 한남동 현대리버티하우스
  console.log("Creating phases for 한남동...");
  await sql`
    INSERT INTO construction_phases (id, user_id, site_id, category, planned_start, planned_end, actual_start, actual_end, progress, status, sort_order) VALUES
      (gen_random_uuid(), ${userId}, ${site1.id}, '도장공사', '2026-03-03', '2026-03-13', '2026-03-03', NULL, 60, '진행중', 1),
      (gen_random_uuid(), ${userId}, ${site1.id}, '필름공사', '2026-03-04', '2026-03-06', '2026-03-04', '2026-03-06', 100, '완료', 2),
      (gen_random_uuid(), ${userId}, ${site1.id}, '가구공사(씽크연구소)', '2026-03-12', '2026-03-17', '2026-03-12', NULL, 40, '진행중', 3),
      (gen_random_uuid(), ${userId}, ${site1.id}, '전기기구취부(조명설장)', '2026-03-18', '2026-03-19', NULL, NULL, 0, '대기', 4),
      (gen_random_uuid(), ${userId}, ${site1.id}, '한국 뗄콘 보일러 설치', '2026-03-20', '2026-03-20', NULL, NULL, 0, '대기', 5),
      (gen_random_uuid(), ${userId}, ${site1.id}, '자동소화기 설치 / 스톤미장', '2026-03-20', '2026-03-20', NULL, NULL, 0, '대기', 6),
      (gen_random_uuid(), ${userId}, ${site1.id}, '에어컨 설치(베스트)', '2026-03-24', '2026-03-24', NULL, NULL, 0, '대기', 7),
      (gen_random_uuid(), ${userId}, ${site1.id}, '세라믹시공 / 박판타일', '2026-03-24', '2026-03-24', NULL, NULL, 0, '대기', 8),
      (gen_random_uuid(), ${userId}, ${site1.id}, '전기기구취부(준완설장) / 세라믹시공', '2026-03-25', '2026-03-25', NULL, NULL, 0, '대기', 9),
      (gen_random_uuid(), ${userId}, ${site1.id}, '준공청소(클린타임)', '2026-03-26', '2026-03-26', NULL, NULL, 0, '대기', 10),
      (gen_random_uuid(), ${userId}, ${site1.id}, '실리콘 코킹 및 거울 시공', '2026-03-27', '2026-03-27', NULL, NULL, 0, '대기', 11),
      (gen_random_uuid(), ${userId}, ${site1.id}, '스톤미장 / 위생기구', '2026-03-23', '2026-03-23', NULL, NULL, 0, '대기', 12),
      (gen_random_uuid(), ${userId}, ${site1.id}, '가전 진입', '2026-03-30', '2026-03-30', NULL, NULL, 0, '대기', 13)
  `;

  // Site 2: 일성스카이빌
  console.log("Creating phases for 일성스카이빌...");
  await sql`
    INSERT INTO construction_phases (id, user_id, site_id, category, planned_start, planned_end, actual_start, actual_end, progress, status, sort_order) VALUES
      (gen_random_uuid(), ${userId}, ${site2.id}, '설비', '2026-03-03', '2026-03-07', '2026-03-03', NULL, 70, '진행중', 1),
      (gen_random_uuid(), ${userId}, ${site2.id}, '전기', '2026-03-03', '2026-03-05', '2026-03-03', '2026-03-05', 100, '완료', 2),
      (gen_random_uuid(), ${userId}, ${site2.id}, '보일러 설치', '2026-03-03', '2026-03-03', '2026-03-03', '2026-03-03', 100, '완료', 3),
      (gen_random_uuid(), ${userId}, ${site2.id}, '인터넷 기사 방문', '2026-03-03', '2026-03-03', '2026-03-03', '2026-03-03', 100, '완료', 4),
      (gen_random_uuid(), ${userId}, ${site2.id}, '샷시', '2026-03-06', '2026-03-06', '2026-03-06', '2026-03-06', 100, '완료', 5),
      (gen_random_uuid(), ${userId}, ${site2.id}, '목공', '2026-03-09', '2026-03-12', '2026-03-09', NULL, 60, '진행중', 6),
      (gen_random_uuid(), ${userId}, ${site2.id}, '설비진행', '2026-03-12', '2026-03-12', NULL, NULL, 0, '대기', 7),
      (gen_random_uuid(), ${userId}, ${site2.id}, '타일', '2026-03-13', '2026-03-20', NULL, NULL, 0, '대기', 8),
      (gen_random_uuid(), ${userId}, ${site2.id}, '필름', '2026-03-19', '2026-03-20', NULL, NULL, 0, '대기', 9),
      (gen_random_uuid(), ${userId}, ${site2.id}, '중문 실측 9시 / 디스크글밸브 교체', '2026-03-19', '2026-03-19', NULL, NULL, 0, '대기', 10),
      (gen_random_uuid(), ${userId}, ${site2.id}, '도배', '2026-03-21', '2026-03-22', NULL, NULL, 0, '대기', 11),
      (gen_random_uuid(), ${userId}, ${site2.id}, '가구 / 수건장 및 거울 발주', '2026-03-23', '2026-03-23', NULL, NULL, 0, '대기', 12),
      (gen_random_uuid(), ${userId}, ${site2.id}, '마감 / 실내기 설치', '2026-03-25', '2026-03-25', NULL, NULL, 0, '대기', 13),
      (gen_random_uuid(), ${userId}, ${site2.id}, '발코니단성', '2026-03-26', '2026-03-26', NULL, NULL, 0, '대기', 14),
      (gen_random_uuid(), ${userId}, ${site2.id}, '도기세팅', '2026-03-27', '2026-03-27', NULL, NULL, 0, '대기', 15),
      (gen_random_uuid(), ${userId}, ${site2.id}, '바닥', '2026-03-30', '2026-03-30', NULL, NULL, 0, '대기', 16),
      (gen_random_uuid(), ${userId}, ${site2.id}, '중문시공 / 전기 마감', '2026-03-31', '2026-03-31', NULL, NULL, 0, '대기', 17),
      (gen_random_uuid(), ${userId}, ${site2.id}, '입주청소', '2026-04-01', '2026-04-01', NULL, NULL, 0, '대기', 18)
  `;

  // Site 3: 우장산 롯데아파트
  console.log("Creating phases for 우장산...");
  await sql`
    INSERT INTO construction_phases (id, user_id, site_id, category, planned_start, planned_end, actual_start, actual_end, progress, status, sort_order) VALUES
      (gen_random_uuid(), ${userId}, ${site3.id}, '10시 미팅', '2026-03-07', '2026-03-07', NULL, NULL, 0, '대기', 1),
      (gen_random_uuid(), ${userId}, ${site3.id}, '에어컨 배선 / 샷시 실측(KCC본사창) 9시', '2026-03-17', '2026-03-17', NULL, NULL, 0, '대기', 2),
      (gen_random_uuid(), ${userId}, ${site3.id}, '철거', '2026-03-18', '2026-03-20', NULL, NULL, 0, '대기', 3),
      (gen_random_uuid(), ${userId}, ${site3.id}, '설비 / 전기 / 보일러 설치 / 인터넷 기사 방문 / 가스배관 이설', '2026-03-23', '2026-03-23', NULL, NULL, 0, '대기', 4),
      (gen_random_uuid(), ${userId}, ${site3.id}, '설비 / 전기', '2026-03-24', '2026-03-24', NULL, NULL, 0, '대기', 5),
      (gen_random_uuid(), ${userId}, ${site3.id}, '설비', '2026-03-25', '2026-03-25', NULL, NULL, 0, '대기', 6),
      (gen_random_uuid(), ${userId}, ${site3.id}, '설비예비', '2026-03-26', '2026-03-26', NULL, NULL, 0, '대기', 7),
      (gen_random_uuid(), ${userId}, ${site3.id}, '샷시', '2026-03-27', '2026-03-27', NULL, NULL, 0, '대기', 8),
      (gen_random_uuid(), ${userId}, ${site3.id}, '목공', '2026-03-30', '2026-03-31', NULL, NULL, 0, '대기', 9)
  `;

  console.log("✅ Demo data seeded successfully!");
  console.log(`  - 3 customers`);
  console.log(`  - 3 sites`);
  console.log(`  - ${13 + 18 + 9} construction phases`);
}

seed().catch(console.error);

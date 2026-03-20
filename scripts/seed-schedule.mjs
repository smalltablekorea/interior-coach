import { Client } from "pg";

const DB_URL =
  "postgresql://neondb_owner:npg_W9TOnGB3zKFX@ep-square-pond-a11pvsyy-pooler.ap-southeast-1.aws.neon.tech/interiorcoach?sslmode=require";

async function main() {
  const client = new Client({ connectionString: DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log("Connected to DB");

  // 1. Find demo user
  const { rows: users } = await client.query(
    `SELECT id, email FROM "user" WHERE email = 'demo@interiorcoach.kr'`
  );
  if (users.length === 0) {
    console.error("Demo user (demo@interiorcoach.kr) not found!");
    await client.end();
    process.exit(1);
  }
  const userId = users[0].id;
  console.log("Found demo user:", userId);

  // 2. Clean up existing demo schedule data for these sites
  const siteNames = ["한남동 현대리버티하우스", "일성스카이빌", "우장산 롯데아파트"];
  const { rows: existingSites } = await client.query(
    `SELECT id, name FROM sites WHERE user_id = $1 AND name = ANY($2)`,
    [userId, siteNames]
  );

  if (existingSites.length > 0) {
    const existingIds = existingSites.map((s) => s.id);
    console.log("Cleaning up existing sites:", existingSites.map((s) => s.name));
    await client.query(
      `DELETE FROM construction_phases WHERE site_id = ANY($1)`,
      [existingIds]
    );
    await client.query(
      `DELETE FROM material_orders WHERE site_id = ANY($1)`,
      [existingIds]
    );
    await client.query(`DELETE FROM sites WHERE id = ANY($1)`, [existingIds]);
  }

  // 3. Create 3 sites
  const { rows: [s1] } = await client.query(
    `INSERT INTO sites (user_id, name, address, building_type, status, start_date, end_date, memo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [userId, "한남동 현대리버티하우스", "서울시 용산구 독서당로 70, 802호", "아파트", "시공중", "2026-03-03", "2026-03-30", "도장→필름→가구→전기→도배→스톤→설비→세라믹→청소→유리→가전"]
  );
  const { rows: [s2] } = await client.query(
    `INSERT INTO sites (user_id, name, address, building_type, status, start_date, end_date, memo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [userId, "일성스카이빌", "서울 강서구 강서로5나길 50 일성스카이빌 1404", "아파트", "시공중", "2026-03-03", "2026-03-31", "설비/전기→샷시→목공→타일→필름→도배→가구→마감→바닥→중문"]
  );
  const { rows: [s3] } = await client.query(
    `INSERT INTO sites (user_id, name, address, building_type, status, start_date, end_date, memo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [userId, "우장산 롯데아파트", "서울시 강서구 우장산로 92 우장산롯데아파트 102동 1106호", "아파트", "시공중", "2026-03-16", "2026-04-30", "샷시→철거→설비/전기→샷시→목공→타일→도배→가구→마감"]
  );

  console.log("Created sites:", { s1: s1.id, s2: s2.id, s3: s3.id });

  // 4. Create construction phases
  // Today is 2026-03-20. Past phases → 완료, current → 진행중, future → 대기
  const phases = [
    // ── 한남동 현대리버티하우스 ──
    { siteId: s1.id, category: "도장공사", ps: "2026-03-03", pe: "2026-03-11", as: "2026-03-03", ae: "2026-03-11", progress: 100, status: "완료", sort: 1, memo: "도장공사[hgg]" },
    { siteId: s1.id, category: "필름공사", ps: "2026-03-04", pe: "2026-03-12", as: "2026-03-04", ae: "2026-03-12", progress: 100, status: "완료", sort: 2, memo: "필름공사(바오)" },
    { siteId: s1.id, category: "탄성공사", ps: "2026-03-11", pe: "2026-03-11", as: "2026-03-11", ae: "2026-03-11", progress: 100, status: "완료", sort: 3, memo: "탄성(루베스톤)" },
    { siteId: s1.id, category: "가구공사", ps: "2026-03-12", pe: "2026-03-17", as: "2026-03-12", ae: "2026-03-17", progress: 100, status: "완료", sort: 4, memo: "가구공사(씽크연구소) / 아일랜드 철제 프레임 제작" },
    { siteId: s1.id, category: "전기공사", ps: "2026-03-18", pe: "2026-03-25", as: "2026-03-18", ae: null, progress: 30, status: "진행중", sort: 5, memo: "전기기구취부(준원설장)" },
    { siteId: s1.id, category: "도배공사", ps: "2026-03-18", pe: "2026-03-19", as: "2026-03-18", ae: "2026-03-19", progress: 100, status: "완료", sort: 6 },
    { siteId: s1.id, category: "스톤미장", ps: "2026-03-19", pe: "2026-03-23", as: "2026-03-19", ae: null, progress: 40, status: "진행중", sort: 7 },
    { siteId: s1.id, category: "설비공사", ps: "2026-03-20", pe: "2026-03-24", as: "2026-03-20", ae: null, progress: 20, status: "진행중", sort: 8, memo: "보일러 설치, 자동소화기 설치" },
    { siteId: s1.id, category: "위생기구", ps: "2026-03-23", pe: "2026-03-23", progress: 0, status: "대기", sort: 9 },
    { siteId: s1.id, category: "에어컨 설치", ps: "2026-03-24", pe: "2026-03-24", progress: 0, status: "대기", sort: 10, memo: "에어컨 설치(베스트)" },
    { siteId: s1.id, category: "세라믹공사", ps: "2026-03-24", pe: "2026-03-25", progress: 0, status: "대기", sort: 11, memo: "세라믹시공 / 박판타일 시공" },
    { siteId: s1.id, category: "준공청소", ps: "2026-03-26", pe: "2026-03-26", progress: 0, status: "대기", sort: 12, memo: "준공청소(클린타임)" },
    { siteId: s1.id, category: "유리공사", ps: "2026-03-27", pe: "2026-03-27", progress: 0, status: "대기", sort: 13, memo: "실리콘 코킹 및 거울 시공[상상유리] / 유리 부스 시공" },
    { siteId: s1.id, category: "가전 진입", ps: "2026-03-30", pe: "2026-03-30", progress: 0, status: "대기", sort: 14 },

    // ── 일성스카이빌 ──
    { siteId: s2.id, category: "설비공사", ps: "2026-03-03", pe: "2026-03-05", as: "2026-03-03", ae: "2026-03-05", progress: 100, status: "완료", sort: 1, memo: "설비 / 보일러 설치 / 인터넷 기사 방문" },
    { siteId: s2.id, category: "전기공사", ps: "2026-03-03", pe: "2026-03-04", as: "2026-03-03", ae: "2026-03-04", progress: 100, status: "완료", sort: 2 },
    { siteId: s2.id, category: "샷시", ps: "2026-03-06", pe: "2026-03-06", as: "2026-03-06", ae: "2026-03-06", progress: 100, status: "완료", sort: 3 },
    { siteId: s2.id, category: "목공", ps: "2026-03-09", pe: "2026-03-12", as: "2026-03-09", ae: "2026-03-12", progress: 100, status: "완료", sort: 4, memo: "설비진행 포함 (3/12)" },
    { siteId: s2.id, category: "타일공사", ps: "2026-03-13", pe: "2026-03-18", as: "2026-03-13", ae: "2026-03-18", progress: 100, status: "완료", sort: 5, memo: "아침 일찍 폐기물 정리 (3/13)" },
    { siteId: s2.id, category: "필름공사", ps: "2026-03-19", pe: "2026-03-20", as: "2026-03-19", ae: null, progress: 50, status: "진행중", sort: 6, memo: "중문 실측 9시 / 디스크밸브 교체 (3/19)" },
    { siteId: s2.id, category: "도배공사", ps: "2026-03-21", pe: "2026-03-22", progress: 0, status: "대기", sort: 7 },
    { siteId: s2.id, category: "가구공사", ps: "2026-03-23", pe: "2026-03-23", progress: 0, status: "대기", sort: 8, memo: "수건장 및 거울 발주" },
    { siteId: s2.id, category: "설비/전기 마감", ps: "2026-03-24", pe: "2026-03-25", progress: 0, status: "대기", sort: 9, memo: "실내기 설치 포함" },
    { siteId: s2.id, category: "마감공사", ps: "2026-03-26", pe: "2026-03-27", progress: 0, status: "대기", sort: 10, memo: "발코니탄성 / 도기세팅" },
    { siteId: s2.id, category: "바닥공사", ps: "2026-03-30", pe: "2026-03-30", progress: 0, status: "대기", sort: 11 },
    { siteId: s2.id, category: "중문시공", ps: "2026-03-31", pe: "2026-03-31", progress: 0, status: "대기", sort: 12, memo: "중문시공 / 전기 마감" },

    // ── 우장산 롯데아파트 ──
    { siteId: s3.id, category: "에어컨 배선", ps: "2026-03-16", pe: "2026-03-16", as: "2026-03-16", ae: "2026-03-16", progress: 100, status: "완료", sort: 1, memo: "에어컨 배선 / 샷시 설치 / 실측(KCC본사창) 9시" },
    { siteId: s3.id, category: "철거", ps: "2026-03-17", pe: "2026-03-20", as: "2026-03-17", ae: null, progress: 75, status: "진행중", sort: 2 },
    { siteId: s3.id, category: "설비공사", ps: "2026-03-23", pe: "2026-03-26", progress: 0, status: "대기", sort: 3, memo: "보일러 설치 / 인터넷 기사 방문 / 가스배관 이설" },
    { siteId: s3.id, category: "전기공사", ps: "2026-03-23", pe: "2026-03-24", progress: 0, status: "대기", sort: 4 },
    { siteId: s3.id, category: "샷시", ps: "2026-03-27", pe: "2026-03-27", progress: 0, status: "대기", sort: 5 },
    { siteId: s3.id, category: "목공", ps: "2026-03-30", pe: "2026-04-01", progress: 0, status: "대기", sort: 6 },
  ];

  let phaseCount = 0;
  for (const p of phases) {
    await client.query(
      `INSERT INTO construction_phases (user_id, site_id, category, planned_start, planned_end, actual_start, actual_end, progress, status, sort_order, memo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [userId, p.siteId, p.category, p.ps, p.pe, p.as || null, p.ae || null, p.progress, p.status, p.sort, p.memo || null]
    );
    phaseCount++;
  }
  console.log(`Inserted ${phaseCount} construction phases`);

  // 5. Create material orders
  const orders = [
    // 한남동 현대리버티하우스
    { siteId: s1.id, name: "도장 페인트(친환경)", qty: 20, price: 35000, total: 700000, ordered: "2026-03-01", delivery: "2026-03-03", status: "입고완료" },
    { siteId: s1.id, name: "필름지(바오)", qty: 30, price: 15000, total: 450000, ordered: "2026-03-02", delivery: "2026-03-04", status: "입고완료" },
    { siteId: s1.id, name: "탄성코트(루베스톤)", qty: 5, price: 45000, total: 225000, ordered: "2026-03-05", delivery: "2026-03-11", status: "입고완료" },
    { siteId: s1.id, name: "싱크대/가구(씽크연구소)", qty: 1, price: 5500000, total: 5500000, ordered: "2026-03-05", delivery: "2026-03-12", status: "입고완료" },
    { siteId: s1.id, name: "아일랜드 철제 프레임", qty: 1, price: 1200000, total: 1200000, ordered: "2026-03-10", delivery: "2026-03-16", status: "입고완료" },
    { siteId: s1.id, name: "세라믹 타일(토마스마블)", qty: 15, price: 85000, total: 1275000, ordered: "2026-03-15", delivery: "2026-03-24", status: "배송중" },
    { siteId: s1.id, name: "에어컨(베스트)", qty: 3, price: 1200000, total: 3600000, ordered: "2026-03-10", delivery: "2026-03-24", status: "배송중" },
    { siteId: s1.id, name: "보일러(한국벽콘)", qty: 1, price: 2200000, total: 2200000, ordered: "2026-03-12", delivery: "2026-03-20", status: "입고완료" },
    { siteId: s1.id, name: "유리 부스/거울(상상유리)", qty: 1, price: 2800000, total: 2800000, ordered: "2026-03-15", delivery: "2026-03-27", status: "발주" },
    { siteId: s1.id, name: "자동소화기", qty: 2, price: 180000, total: 360000, ordered: "2026-03-15", delivery: "2026-03-20", status: "입고완료" },

    // 일성스카이빌
    { siteId: s2.id, name: "설비 자재(배관/피팅)", qty: 1, price: 850000, total: 850000, ordered: "2026-03-01", delivery: "2026-03-03", status: "입고완료" },
    { siteId: s2.id, name: "보일러", qty: 1, price: 2200000, total: 2200000, ordered: "2026-03-01", delivery: "2026-03-03", status: "입고완료" },
    { siteId: s2.id, name: "샷시", qty: 6, price: 450000, total: 2700000, ordered: "2026-03-01", delivery: "2026-03-06", status: "입고완료" },
    { siteId: s2.id, name: "목재/합판", qty: 30, price: 25000, total: 750000, ordered: "2026-03-05", delivery: "2026-03-09", status: "입고완료" },
    { siteId: s2.id, name: "타일(현관/욕실)", qty: 25, price: 45000, total: 1125000, ordered: "2026-03-07", delivery: "2026-03-13", status: "입고완료" },
    { siteId: s2.id, name: "필름지", qty: 20, price: 15000, total: 300000, ordered: "2026-03-12", delivery: "2026-03-19", status: "입고완료" },
    { siteId: s2.id, name: "도배지", qty: 40, price: 12000, total: 480000, ordered: "2026-03-15", delivery: "2026-03-21", status: "배송중" },
    { siteId: s2.id, name: "중문", qty: 1, price: 1800000, total: 1800000, ordered: "2026-03-19", delivery: "2026-03-31", status: "발주" },
    { siteId: s2.id, name: "수건장/거울", qty: 2, price: 350000, total: 700000, ordered: "2026-03-23", delivery: "2026-03-27", status: "발주" },
    { siteId: s2.id, name: "바닥재", qty: 20, price: 35000, total: 700000, ordered: "2026-03-20", delivery: "2026-03-30", status: "발주" },

    // 우장산 롯데아파트
    { siteId: s3.id, name: "샷시(KCC)", qty: 8, price: 450000, total: 3600000, ordered: "2026-03-10", delivery: "2026-03-16", status: "입고완료" },
    { siteId: s3.id, name: "에어컨 배선 자재", qty: 1, price: 500000, total: 500000, ordered: "2026-03-12", delivery: "2026-03-16", status: "입고완료" },
    { siteId: s3.id, name: "보일러", qty: 1, price: 2500000, total: 2500000, ordered: "2026-03-15", delivery: "2026-03-23", status: "배송중" },
    { siteId: s3.id, name: "설비 자재(배관/피팅)", qty: 1, price: 950000, total: 950000, ordered: "2026-03-18", delivery: "2026-03-23", status: "배송중" },
    { siteId: s3.id, name: "목재/합판", qty: 35, price: 25000, total: 875000, ordered: "2026-03-22", delivery: "2026-03-30", status: "발주" },
  ];

  let orderCount = 0;
  for (const o of orders) {
    await client.query(
      `INSERT INTO material_orders (user_id, site_id, material_name, quantity, unit_price, total_amount, ordered_date, delivery_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [userId, o.siteId, o.name, o.qty, o.price, o.total, o.ordered, o.delivery, o.status]
    );
    orderCount++;
  }
  console.log(`Inserted ${orderCount} material orders`);

  await client.end();
  console.log("\nDone! Schedule data seeded for demo@interiorcoach.kr");
  console.log("  - 한남동 현대리버티하우스 (14 phases, 10 orders)");
  console.log("  - 일성스카이빌 (12 phases, 10 orders)");
  console.log("  - 우장산 롯데아파트 (6 phases, 5 orders)");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});

import { neon } from "@neondatabase/serverless";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  // 1. Create demo user if not exists
  const existing = await sql`SELECT id FROM "user" WHERE email = 'demo@interiorcoach.kr'`;
  let userId;
  if (existing.length === 0) {
    await sql`
      INSERT INTO "user" (id, name, email, email_verified)
      VALUES ('demo', '데모 관리자', 'demo@interiorcoach.kr', true)
    `;
    userId = "demo";
    console.log("Created demo user");
  } else {
    userId = existing[0].id;
    console.log("Demo user exists:", userId);
  }

  // 2. Create 3 sites from spreadsheet
  const sitesData = [
    {
      name: "한남동 현대리버티하우스",
      address: "서울시 용산구 독서당로 70",
      status: "시공중",
      startDate: "2026-03-03",
      endDate: "2026-03-30",
    },
    {
      name: "일성스카이빌",
      address: "서울 강서구 강서로5나길 50 일성스카이빌 1404",
      status: "시공중",
      startDate: "2026-03-03",
      endDate: "2026-04-01",
    },
    {
      name: "우장산 롯데아파트",
      address: "서울시 강서구 우장산로 92 우장산롯데아파트 102동 1106호",
      status: "시공중",
      startDate: "2026-03-17",
      endDate: "2026-04-01",
    },
  ];

  const siteIds = [];
  for (const s of sitesData) {
    // Check if site already exists
    const existingSite = await sql`SELECT id FROM sites WHERE name = ${s.name} LIMIT 1`;
    if (existingSite.length > 0) {
      siteIds.push(existingSite[0].id);
      console.log(`Site exists: ${s.name} -> ${existingSite[0].id}`);
    } else {
      const [row] = await sql`
        INSERT INTO sites (user_id, name, address, building_type, status, start_date, end_date, memo)
        VALUES (${userId}, ${s.name}, ${s.address}, '아파트', ${s.status}, ${s.startDate}, ${s.endDate}, NULL)
        RETURNING id
      `;
      siteIds.push(row.id);
      console.log(`Site created: ${s.name} -> ${row.id}`);
    }
  }

  const [hannam, ilsung, woojang] = siteIds;

  // 3. Construction phases - based on spreadsheet screenshot
  // Each phase = a trade/work type with its date range at a specific site

  const phases = [
    // === 한남동 현대리버티하우스 ===
    { siteId: hannam, category: "도장공사", plannedStart: "2026-03-03", plannedEnd: "2026-03-11", status: "완료", progress: 100 },
    { siteId: hannam, category: "필름공사", plannedStart: "2026-03-04", plannedEnd: "2026-03-12", status: "완료", progress: 100 },
    { siteId: hannam, category: "가구공사", plannedStart: "2026-03-12", plannedEnd: "2026-03-17", status: "완료", progress: 100 },
    { siteId: hannam, category: "전기기구취부", plannedStart: "2026-03-18", plannedEnd: "2026-03-25", status: "완료", progress: 100 },
    { siteId: hannam, category: "도배", plannedStart: "2026-03-18", plannedEnd: "2026-03-19", status: "완료", progress: 100 },
    { siteId: hannam, category: "스톤미장", plannedStart: "2026-03-19", plannedEnd: "2026-03-23", status: "진행중", progress: 60 },
    { siteId: hannam, category: "보일러 설치", plannedStart: "2026-03-20", plannedEnd: "2026-03-20", status: "완료", progress: 100 },
    { siteId: hannam, category: "에어컨 설치", plannedStart: "2026-03-24", plannedEnd: "2026-03-24", status: "예정", progress: 0 },
    { siteId: hannam, category: "세라믹시공", plannedStart: "2026-03-24", plannedEnd: "2026-03-25", status: "예정", progress: 0 },
    { siteId: hannam, category: "준공청소", plannedStart: "2026-03-26", plannedEnd: "2026-03-26", status: "예정", progress: 0 },
    { siteId: hannam, category: "실리콘/유리시공", plannedStart: "2026-03-27", plannedEnd: "2026-03-27", status: "예정", progress: 0 },
    { siteId: hannam, category: "가전 진입", plannedStart: "2026-03-30", plannedEnd: "2026-03-30", status: "예정", progress: 0 },

    // === 일성스카이빌 ===
    { siteId: ilsung, category: "설비", plannedStart: "2026-03-03", plannedEnd: "2026-03-07", status: "완료", progress: 100 },
    { siteId: ilsung, category: "전기", plannedStart: "2026-03-03", plannedEnd: "2026-03-04", status: "완료", progress: 100 },
    { siteId: ilsung, category: "보일러 설치", plannedStart: "2026-03-03", plannedEnd: "2026-03-03", status: "완료", progress: 100 },
    { siteId: ilsung, category: "샷시", plannedStart: "2026-03-06", plannedEnd: "2026-03-06", status: "완료", progress: 100 },
    { siteId: ilsung, category: "목공", plannedStart: "2026-03-09", plannedEnd: "2026-03-14", status: "완료", progress: 100 },
    { siteId: ilsung, category: "타일", plannedStart: "2026-03-13", plannedEnd: "2026-03-18", status: "진행중", progress: 70 },
    { siteId: ilsung, category: "필름", plannedStart: "2026-03-19", plannedEnd: "2026-03-20", status: "진행중", progress: 50 },
    { siteId: ilsung, category: "중문 실측", plannedStart: "2026-03-19", plannedEnd: "2026-03-19", status: "완료", progress: 100 },
    { siteId: ilsung, category: "도배", plannedStart: "2026-03-21", plannedEnd: "2026-03-22", status: "예정", progress: 0 },
    { siteId: ilsung, category: "가구", plannedStart: "2026-03-23", plannedEnd: "2026-03-23", status: "예정", progress: 0 },
    { siteId: ilsung, category: "마감/실내기 설치", plannedStart: "2026-03-25", plannedEnd: "2026-03-25", status: "예정", progress: 0 },
    { siteId: ilsung, category: "발코니단성", plannedStart: "2026-03-26", plannedEnd: "2026-03-26", status: "예정", progress: 0 },
    { siteId: ilsung, category: "도기세팅", plannedStart: "2026-03-27", plannedEnd: "2026-03-27", status: "예정", progress: 0 },
    { siteId: ilsung, category: "바닥", plannedStart: "2026-03-30", plannedEnd: "2026-03-30", status: "예정", progress: 0 },
    { siteId: ilsung, category: "중문시공/전기마감", plannedStart: "2026-03-31", plannedEnd: "2026-03-31", status: "예정", progress: 0 },
    { siteId: ilsung, category: "입주청소", plannedStart: "2026-04-01", plannedEnd: "2026-04-01", status: "예정", progress: 0 },

    // === 우장산 롯데아파트 ===
    { siteId: woojang, category: "에어컨배선/샷시실측", plannedStart: "2026-03-17", plannedEnd: "2026-03-17", status: "예정", progress: 0 },
    { siteId: woojang, category: "철거", plannedStart: "2026-03-18", plannedEnd: "2026-03-20", status: "예정", progress: 0 },
    { siteId: woojang, category: "설비", plannedStart: "2026-03-23", plannedEnd: "2026-03-26", status: "예정", progress: 0 },
    { siteId: woojang, category: "전기", plannedStart: "2026-03-23", plannedEnd: "2026-03-24", status: "예정", progress: 0 },
    { siteId: woojang, category: "보일러 설치", plannedStart: "2026-03-23", plannedEnd: "2026-03-23", status: "예정", progress: 0 },
    { siteId: woojang, category: "샷시", plannedStart: "2026-03-27", plannedEnd: "2026-03-27", status: "예정", progress: 0 },
    { siteId: woojang, category: "목공", plannedStart: "2026-03-30", plannedEnd: "2026-04-01", status: "예정", progress: 0 },
  ];

  let sortOrder = 0;
  for (const p of phases) {
    sortOrder++;
    await sql`
      INSERT INTO construction_phases (
        user_id, site_id, category, planned_start, planned_end,
        status, progress, sort_order
      ) VALUES (
        ${userId}, ${p.siteId}, ${p.category}, ${p.plannedStart}, ${p.plannedEnd},
        ${p.status}, ${p.progress}, ${sortOrder}
      )
    `;
  }
  console.log(`Created ${phases.length} construction phases`);

  // Summary
  const siteCount = await sql`SELECT COUNT(*) as cnt FROM sites`;
  const phaseCount = await sql`SELECT COUNT(*) as cnt FROM construction_phases`;
  console.log(`\nTotal sites: ${siteCount[0].cnt}`);
  console.log(`Total phases: ${phaseCount[0].cnt}`);
  console.log("\nDone!");
}

main().catch(console.error);

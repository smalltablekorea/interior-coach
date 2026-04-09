// Seed real construction schedules from Google Sheets data
// Run: node scripts/seed-real-schedules.mjs
// Requires: SEED_USER_ID env var or defaults to admin user lookup

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

// ── 현장별 일정 데이터 (Google Sheets 파싱 결과) ──
const SITES = {
  "한남동 현대리버티하우스": [
    { date: "2026-01-06", task: "철거(베스트)" },
    { date: "2026-01-07", task: "철거(베스트)" },
    { date: "2026-01-08", task: "철거(베스트)" },
    { date: "2026-01-09", task: "철거(베스트) / 가스철거(한결)" },
    { date: "2026-01-12", task: "철거" },
    { date: "2026-01-13", task: "에어컨배관(베스트)" },
    { date: "2026-01-14", task: "전열교환기" },
    { date: "2026-01-15", task: "설비공사(광명) / 금속실측 / 보일러 설치" },
    { date: "2026-01-16", task: "설비공사(광명)" },
    { date: "2026-01-19", task: "설비공사(광명) / 전기배선(준원실장) / 인터넷 기사 방문" },
    { date: "2026-01-20", task: "설비공사(광명) / 전기배선(준원실장)" },
    { date: "2026-01-21", task: "금속시공 / 목자재반입 / 샷시" },
    { date: "2026-01-22", task: "목공사(1987) / 전기배선(준원실장)" },
    { date: "2026-01-23", task: "목공사(1987)" },
    { date: "2026-01-26", task: "목공사(1987)" },
    { date: "2026-01-27", task: "목공사(1987) / 폐기물반출" },
    { date: "2026-01-28", task: "목공사(1987)" },
    { date: "2026-01-29", task: "목공사(1987)" },
    { date: "2026-01-30", task: "목공사(1987)" },
    { date: "2026-02-02", task: "목공사(1987)" },
    { date: "2026-02-03", task: "목공사(1987)" },
    { date: "2026-02-04", task: "목공사(1987) / 폐기물반출" },
    { date: "2026-02-05", task: "전기등타공(준원실장) / 타일자재반입 / 마감정리" },
    { date: "2026-02-06", task: "수평몰탈[광명설비]" },
    { date: "2026-02-09", task: "목공사(1987) / 타일공사(sm)" },
    { date: "2026-02-10", task: "목공사(1987) / 타일공사(sm)" },
    { date: "2026-02-11", task: "목공사(1987) / 타일공사(sm)" },
    { date: "2026-02-12", task: "목공사(1987) / 타일공사(sm)" },
    { date: "2026-02-13", task: "목공사(1987) / 타일공사(sm)" },
    { date: "2026-02-19", task: "타일공사(sm)" },
    { date: "2026-02-20", task: "타일공사(sm)" },
    { date: "2026-02-23", task: "타일공사(sm)" },
    { date: "2026-02-24", task: "타일공사(sm)" },
    { date: "2026-02-25", task: "타일공사(sm)" },
    { date: "2026-02-26", task: "타일공사(sm) / 필름공사(바오)" },
    { date: "2026-02-27", task: "타일공사(sm) / 필름공사(바오)" },
    { date: "2026-03-03", task: "도장공사[hgg]" },
    { date: "2026-03-04", task: "필름공사(바오)" },
    { date: "2026-03-05", task: "필름공사(바오) / 도장공사[hgg]" },
    { date: "2026-03-06", task: "도장공사[hgg]" },
    { date: "2026-03-09", task: "도장공사[hgg]" },
    { date: "2026-03-10", task: "도장공사[hgg]" },
    { date: "2026-03-11", task: "도장공사[hgg] / 탄성(루베스톤)" },
    { date: "2026-03-12", task: "가구공사[씽크연구소] / 필름마무리" },
    { date: "2026-03-13", task: "가구공사[씽크연구소]" },
    { date: "2026-03-16", task: "가구공사(씽크) / 아일랜드 철제 프레임 제작" },
    { date: "2026-03-17", task: "가구공사(씽크)" },
    { date: "2026-03-18", task: "전기기구취부(준원실장) / 도배 / 세라믹실측" },
    { date: "2026-03-19", task: "전기기구취부(준원실장) / 도배 / 스톤미장" },
    { date: "2026-03-20", task: "보일러 설치 / 자동소화기 설치 / 스톤미장" },
    { date: "2026-03-23", task: "스톤미장 / 위생기구" },
    { date: "2026-03-24", task: "에어컨 설치(베스트) / 세라믹시공 / 박판타일" },
    { date: "2026-03-25", task: "전기기구취부(준원실장) / 세라믹시공" },
    { date: "2026-03-26", task: "준공청소(클린타임)" },
    { date: "2026-03-27", task: "실리콘 코킹 및 거울 시공 / 유리 부스 시공" },
    { date: "2026-03-30", task: "가전 진입" },
    { date: "2026-04-01", task: "도배마감 / 전기마감" },
    { date: "2026-04-02", task: "가구마감" },
    { date: "2026-04-04", task: "청소마감" },
    { date: "2026-04-06", task: "실리콘마감" },
    { date: "2026-04-07", task: "입주" },
    { date: "2026-04-20", task: "타일" },
    { date: "2026-04-21", task: "타일" },
    { date: "2026-04-22", task: "타일" },
    { date: "2026-04-23", task: "필름" },
    { date: "2026-04-24", task: "필름" },
    { date: "2026-04-27", task: "필름" },
    { date: "2026-04-28", task: "필름/도배" },
    { date: "2026-04-29", task: "도배" },
    { date: "2026-04-30", task: "가구" },
    { date: "2026-05-01", task: "장판" },
    { date: "2026-05-04", task: "전기 / 중문 / 에어컨설치" },
    { date: "2026-05-05", task: "입주청소" },
    { date: "2026-05-06", task: "실리콘" },
  ],
  "일성스카이빌": [
    { date: "2026-02-24", task: "에어컨 배선 / 샷시 실측(우리창호)" },
    { date: "2026-02-25", task: "철거" },
    { date: "2026-02-26", task: "철거" },
    { date: "2026-02-27", task: "철거" },
    { date: "2026-03-03", task: "설비 / 전기 / 보일러 설치 / 인터넷 기사 방문" },
    { date: "2026-03-04", task: "설비 / 전기" },
    { date: "2026-03-05", task: "설비" },
    { date: "2026-03-06", task: "샷시" },
    { date: "2026-03-09", task: "목공" },
    { date: "2026-03-10", task: "목공" },
    { date: "2026-03-11", task: "목공" },
    { date: "2026-03-12", task: "목공 / 설비진행" },
    { date: "2026-03-13", task: "타일" },
    { date: "2026-03-16", task: "타일" },
    { date: "2026-03-17", task: "타일" },
    { date: "2026-03-18", task: "타일" },
    { date: "2026-03-19", task: "필름 / 중문 실측 / 디스크밸브 교체" },
    { date: "2026-03-20", task: "필름" },
    { date: "2026-03-21", task: "도배" },
    { date: "2026-03-22", task: "도배" },
    { date: "2026-03-23", task: "가구 / 수건장 및 거울 발주" },
    { date: "2026-03-25", task: "마감 / 실내기 설치" },
    { date: "2026-03-26", task: "발코니탄성" },
    { date: "2026-03-27", task: "도기세팅" },
    { date: "2026-03-30", task: "바닥" },
    { date: "2026-03-31", task: "중문시공 / 전기 마감" },
    { date: "2026-04-01", task: "입주청소" },
    { date: "2026-04-02", task: "실리콘" },
    { date: "2026-04-04", task: "입주" },
    { date: "2026-04-07", task: "네스트 설치[난방시스템]" },
  ],
  "우장산 롯데아파트": [
    { date: "2026-03-17", task: "에어컨 배선 / 샷시 실측(KCC본사창)" },
    { date: "2026-03-18", task: "철거" },
    { date: "2026-03-19", task: "철거" },
    { date: "2026-03-20", task: "철거" },
    { date: "2026-03-23", task: "설비 / 전기 / 보일러 설치 / 인터넷 기사 방문 / 가스배관 이설" },
    { date: "2026-03-24", task: "설비 / 전기" },
    { date: "2026-03-25", task: "설비" },
    { date: "2026-03-26", task: "설비예비" },
    { date: "2026-03-27", task: "샷시" },
    { date: "2026-03-30", task: "목공" },
    { date: "2026-03-31", task: "목공" },
    { date: "2026-04-01", task: "목공" },
    { date: "2026-04-02", task: "목공" },
    { date: "2026-04-03", task: "목공" },
    { date: "2026-04-04", task: "목공 폐기물 반출 / 타일 자재 진입" },
    { date: "2026-04-06", task: "타일" },
    { date: "2026-04-07", task: "타일 / 도기 발주" },
    { date: "2026-04-08", task: "타일" },
    { date: "2026-04-09", task: "타일" },
    { date: "2026-04-10", task: "메지" },
    { date: "2026-04-13", task: "필름" },
    { date: "2026-04-14", task: "필름 / 도기세팅" },
    { date: "2026-04-15", task: "필름 / 발코니 탄성 / 도기세팅" },
    { date: "2026-04-16", task: "도배" },
    { date: "2026-04-17", task: "도배" },
    { date: "2026-04-20", task: "마루시공" },
    { date: "2026-04-21", task: "가구" },
    { date: "2026-04-22", task: "가구 / 세라믹 실측" },
    { date: "2026-04-23", task: "도배" },
    { date: "2026-04-24", task: "전기" },
    { date: "2026-04-27", task: "전기 / 에어컨 실내기 설치" },
    { date: "2026-04-28", task: "입주청소 / 세라믹 시공" },
    { date: "2026-04-29", task: "실리콘마감 / 유리시공" },
    { date: "2026-04-30", task: "현장 사진촬영" },
    { date: "2026-05-01", task: "이사" },
  ],
};

// 날짜 진행 상태 판단
function getStatus(date, today) {
  if (date < today) return "완료";
  if (date === today) return "진행중";
  return "대기";
}

function getProgress(status) {
  if (status === "완료") return 100;
  if (status === "진행중") return 50;
  return 0;
}

async function seed() {
  const today = new Date().toISOString().slice(0, 10);
  console.log(`🌱 Seeding real schedules from Google Sheets (today: ${today})...\n`);

  // 관리자 유저 ID 조회
  const [admin] = await sql`SELECT id FROM "user" WHERE email = 'smalltablekorea@gmail.com' LIMIT 1`;
  if (!admin) { console.error("Admin user not found"); return; }
  const userId = admin.id;
  console.log(`Admin user: ${userId}`);

  // 워크스페이스 조회
  const workspaces = await sql`SELECT id FROM workspaces WHERE owner_id = ${userId} LIMIT 1`;
  const workspaceId = workspaces[0]?.id || null;
  console.log(`Workspace: ${workspaceId}\n`);

  for (const [siteName, tasks] of Object.entries(SITES)) {
    // 기존 현장 찾기
    const [site] = await sql`SELECT id FROM sites WHERE name = ${siteName} AND user_id = ${userId} LIMIT 1`;
    if (!site) {
      console.log(`⚠️ Site "${siteName}" not found — skipping`);
      continue;
    }

    // 기존 공정 삭제 (재시드)
    const deleted = await sql`DELETE FROM construction_phases WHERE site_id = ${site.id} AND user_id = ${userId}`;
    console.log(`🗑️ Deleted ${deleted.length || 0} existing phases for "${siteName}"`);

    // 일별 작업을 공정 블록으로 그룹화 (연속 날짜 동일 공종 → 1개 공정)
    let sortOrder = 1;
    let inserted = 0;

    for (const { date, task } of tasks) {
      const status = getStatus(date, today);
      const progress = getProgress(status);

      await sql`
        INSERT INTO construction_phases (id, user_id, workspace_id, site_id, category, planned_start, planned_end,
          actual_start, actual_end, progress, status, sort_order, memo)
        VALUES (
          gen_random_uuid(), ${userId}, ${workspaceId}, ${site.id}, ${task}, ${date}, ${date},
          ${status !== '대기' ? date : null}, ${status === '완료' ? date : null},
          ${progress}, ${status}, ${sortOrder}, null
        )
      `;
      sortOrder++;
      inserted++;
    }

    console.log(`✅ "${siteName}": ${inserted} phases inserted`);
  }

  console.log("\n🎉 Done!");
}

seed().catch(console.error);

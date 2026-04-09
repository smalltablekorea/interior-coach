#!/usr/bin/env node
/**
 * 실제 진행 중인 현장 3개와 공정 일정을 DB에 시드합니다.
 * 실행: node scripts/seed-sites-schedule.mjs
 */
import { config } from "dotenv";
config({ path: ".env" });

import pg from "pg";
const { Client } = pg;

const client = new Client({ connectionString: process.env.DATABASE_URL });

async function main() {
  await client.connect();

  // 관리자 계정의 userId와 workspaceId 가져오기
  const userRes = await client.query(
    `SELECT id FROM "user" WHERE email = 'smalltablekorea@gmail.com' LIMIT 1`
  );
  if (!userRes.rows.length) { console.error("관리자 계정 없음"); process.exit(1); }
  const userId = userRes.rows[0].id;

  const wsRes = await client.query(
    `SELECT id FROM workspaces WHERE owner_id = $1 LIMIT 1`, [userId]
  );
  // workspace가 없으면 workspace_members에서 찾기
  let workspaceId = wsRes.rows[0]?.id || null;
  if (!workspaceId) {
    const wmRes = await client.query(
      `SELECT workspace_id FROM workspace_members WHERE user_id = $1 LIMIT 1`, [userId]
    );
    workspaceId = wmRes.rows[0]?.workspace_id || null;
  }

  console.log(`userId: ${userId}, workspaceId: ${workspaceId}`);

  // ═══ 현장 3개 등록 ═══
  const sitesData = [
    {
      name: "한남동 현대리버티하우스",
      address: "서울시 용산구 독서당로 70",
      buildingType: "아파트",
      status: "시공중",
      startDate: "2026-03-03",
      endDate: "2026-04-07",
      phases: [
        { category: "도장공사(hgg)", start: "2026-03-03", end: "2026-03-06" },
        { category: "필름공사(바오)", start: "2026-03-04", end: "2026-03-05" },
        { category: "도장공사(hgg)/탄성", start: "2026-03-11", end: "2026-03-11" },
        { category: "가구공사(씽크연구소)/필름마무리", start: "2026-03-12", end: "2026-03-12" },
        { category: "가구공사(씽크연구소)", start: "2026-03-13", end: "2026-03-13" },
        { category: "가구공사(씽크)/아일랜드 철제 프레임 제작", start: "2026-03-16", end: "2026-03-16" },
        { category: "가구공사(씽크)", start: "2026-03-17", end: "2026-03-17" },
        { category: "전기기구취부(준철실장)/도배/세라믹실측", start: "2026-03-18", end: "2026-03-18" },
        { category: "전기기구취부(준철실장)/도배/스톤미장", start: "2026-03-19", end: "2026-03-19" },
        { category: "한국 벽콘 보일러 설치/자동소화기 설치/스톤미장", start: "2026-03-20", end: "2026-03-20" },
        { category: "스톤미장/위생기구", start: "2026-03-23", end: "2026-03-23" },
        { category: "에어컨 설치(베스트)/세라믹시공/박판타일 시공", start: "2026-03-24", end: "2026-03-24" },
        { category: "전기기구취부(준철실장)/세라믹시공", start: "2026-03-25", end: "2026-03-25" },
        { category: "준공정소(클린타임)", start: "2026-03-26", end: "2026-03-26" },
        { category: "실리콘 코킹 및 거울 시공/유리 부스 시공", start: "2026-03-27", end: "2026-03-27" },
        { category: "가전 진입", start: "2026-03-30", end: "2026-03-30" },
        { category: "도배마감/전기마감", start: "2026-04-01", end: "2026-04-01" },
        { category: "가구마감", start: "2026-04-02", end: "2026-04-02" },
        { category: "청소마감", start: "2026-04-04", end: "2026-04-04" },
        { category: "실리콘마감", start: "2026-04-06", end: "2026-04-06" },
        { category: "입주", start: "2026-04-07", end: "2026-04-07" },
      ],
    },
    {
      name: "일성스카이빌 1404",
      address: "서울 강서구 강서로5나길 50 일성스카이빌 1404",
      buildingType: "아파트",
      status: "시공중",
      startDate: "2026-03-03",
      endDate: "2026-05-08",
      phases: [
        { category: "설비/전기/보일러 설치/인터넷 기사 방문", start: "2026-03-03", end: "2026-03-04" },
        { category: "설비/전기", start: "2026-03-05", end: "2026-03-06" },
        { category: "창호", start: "2026-03-06", end: "2026-03-06" },
        { category: "목공/11시 반 촬영", start: "2026-03-09", end: "2026-03-09" },
        { category: "목공", start: "2026-03-10", end: "2026-03-13" },
        { category: "목공/설비진행", start: "2026-03-12", end: "2026-03-12" },
        { category: "타일/아침 일찍 폐기물 정리", start: "2026-03-13", end: "2026-03-13" },
        { category: "타일", start: "2026-03-16", end: "2026-03-20" },
        { category: "필름/중문 실측 9시/디스크밸브 교체", start: "2026-03-19", end: "2026-03-19" },
        { category: "필름", start: "2026-03-20", end: "2026-03-20" },
        { category: "도배", start: "2026-03-21", end: "2026-03-22" },
        { category: "가구/수건장 및 거울 발주", start: "2026-03-23", end: "2026-03-23" },
        { category: "마감/실내기 설치", start: "2026-03-25", end: "2026-03-25" },
        { category: "발코니탄성", start: "2026-03-26", end: "2026-03-26" },
        { category: "도기세팅", start: "2026-03-27", end: "2026-03-27" },
        { category: "바닥", start: "2026-03-30", end: "2026-03-30" },
        { category: "중문시공/전기 마감", start: "2026-03-31", end: "2026-03-31" },
        { category: "입주청소", start: "2026-04-01", end: "2026-04-01" },
        { category: "실리콘", start: "2026-04-02", end: "2026-04-02" },
        { category: "입주", start: "2026-04-04", end: "2026-04-04" },
        { category: "이사일정", start: "2026-04-06", end: "2026-04-06" },
        { category: "네스트 설치(난방시스템)", start: "2026-04-07", end: "2026-04-07" },
      ],
    },
    {
      name: "우장산 롯데아파트 102동 1106호",
      address: "서울시 강서구 우장산로 92 우장산롯데아파트 102동 1106호",
      buildingType: "아파트",
      status: "시공중",
      startDate: "2026-03-23",
      endDate: "2026-05-08",
      phases: [
        { category: "설비/전기/보일러설치/인터넷기사방문/가스배관이설", start: "2026-03-23", end: "2026-03-25" },
        { category: "설비/전기", start: "2026-03-24", end: "2026-03-25" },
        { category: "창호", start: "2026-03-27", end: "2026-03-27" },
        { category: "목공", start: "2026-03-30", end: "2026-04-04" },
        { category: "목공 폐기물 반출/타일 자재 진입", start: "2026-04-04", end: "2026-04-04" },
        { category: "타일", start: "2026-04-06", end: "2026-04-10" },
        { category: "타일/도기 발주", start: "2026-04-08", end: "2026-04-08" },
        { category: "메지", start: "2026-04-10", end: "2026-04-10" },
        { category: "필름", start: "2026-04-13", end: "2026-04-13" },
        { category: "필름/도기세팅", start: "2026-04-14", end: "2026-04-14" },
        { category: "필름/발코니 탄성/도기세팅", start: "2026-04-15", end: "2026-04-15" },
        { category: "도배", start: "2026-04-16", end: "2026-04-17" },
        { category: "마루시공", start: "2026-04-20", end: "2026-04-20" },
        { category: "가구", start: "2026-04-21", end: "2026-04-22" },
        { category: "가구/세라믹 실측", start: "2026-04-22", end: "2026-04-22" },
        { category: "도배", start: "2026-04-23", end: "2026-04-23" },
        { category: "전기", start: "2026-04-24", end: "2026-04-24" },
        { category: "전기/에어컨 실내기 설치", start: "2026-04-27", end: "2026-04-27" },
        { category: "입주청소/세라믹 시공", start: "2026-04-28", end: "2026-04-28" },
        { category: "실리콘마감/유리시공", start: "2026-04-29", end: "2026-04-29" },
        { category: "현장 사진촬영", start: "2026-04-30", end: "2026-04-30" },
        { category: "이사", start: "2026-05-01", end: "2026-05-01" },
        { category: "전기/중문/에어컨설치", start: "2026-05-04", end: "2026-05-04" },
        { category: "입주청소", start: "2026-05-05", end: "2026-05-05" },
        { category: "실리콘", start: "2026-05-06", end: "2026-05-06" },
      ],
    },
  ];

  for (const site of sitesData) {
    // 기존에 같은 이름의 현장이 있으면 건너뛰기
    const existing = await client.query(
      `SELECT id FROM sites WHERE name = $1 AND user_id = $2 AND deleted_at IS NULL LIMIT 1`,
      [site.name, userId]
    );

    let siteId;
    if (existing.rows.length > 0) {
      siteId = existing.rows[0].id;
      console.log(`기존 현장 사용: ${site.name} (${siteId})`);
      // 기존 공정 삭제 후 재등록
      await client.query(`DELETE FROM construction_phases WHERE site_id = $1`, [siteId]);
    } else {
      const insertRes = await client.query(
        `INSERT INTO sites (user_id, workspace_id, name, address, building_type, status, start_date, end_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING id`,
        [userId, workspaceId, site.name, site.address, site.buildingType, site.status, site.startDate, site.endDate]
      );
      siteId = insertRes.rows[0].id;
      console.log(`현장 생성: ${site.name} (${siteId})`);
    }

    // 공정 등록
    for (let i = 0; i < site.phases.length; i++) {
      const phase = site.phases[i];
      await client.query(
        `INSERT INTO construction_phases (user_id, workspace_id, site_id, category, planned_start, planned_end, status, progress, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [userId, workspaceId, siteId, phase.category, phase.start, phase.end, "진행중", 0, i + 1]
      );
    }
    console.log(`  → ${site.phases.length}개 공정 등록 완료`);
  }

  console.log("\n✅ 모든 현장 및 공정 등록 완료!");
  await client.end();
}

main().catch((err) => { console.error(err); process.exit(1); });

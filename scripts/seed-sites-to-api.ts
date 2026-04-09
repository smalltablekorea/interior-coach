/**
 * 22개 현장 + 공정 일정 일괄 등록 스크립트
 *
 * 사용법:
 *   npx tsx scripts/seed-sites-to-api.ts
 *
 * 환경변수:
 *   BASE_URL: API 서버 주소 (기본값: http://localhost:3000)
 *   AUTH_COOKIE: 인증 쿠키 (로그인 후 브라우저에서 복사)
 *
 * 주의: 프로덕션에서 실행하려면 BASE_URL을 변경하세요.
 */

import fs from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const AUTH_COOKIE = process.env.AUTH_COOKIE || "";

interface SeedSite {
  name: string;
  address: string;
  owner_name: string;
  owner_phone: string;
  building_type: string;
  status: string;
  start_date: string;
  end_date: string;
  note: string;
  phases: Record<string, { start: string; end: string; works: string[] }>;
  work_days: number;
}

async function api(endpoint: string, body: Record<string, unknown>) {
  const res = await fetch(`${BASE_URL}/api${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: AUTH_COOKIE,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${endpoint} failed (${res.status}): ${text}`);
  }

  return res.json();
}

async function main() {
  // 시드 데이터 로드
  const dataPath = path.join(__dirname, "seed-sites.json");
  const sites: SeedSite[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  console.log(`\n📦 ${sites.length}개 현장 등록 시작\n`);
  console.log(`🌐 서버: ${BASE_URL}`);
  console.log(`🔑 인증: ${AUTH_COOKIE ? "설정됨" : "⚠️ 미설정 (AUTH_COOKIE 필요)"}\n`);

  if (!AUTH_COOKIE) {
    console.log("❌ AUTH_COOKIE 환경변수를 설정해주세요.");
    console.log("   1. 브라우저에서 인테리어코치에 로그인");
    console.log("   2. 개발자 도구 → Application → Cookies에서 쿠키 값 복사");
    console.log("   3. AUTH_COOKIE='쿠키값' npx tsx scripts/seed-sites-to-api.ts");
    process.exit(1);
  }

  let successSites = 0;
  let successPhases = 0;
  let failedSites = 0;

  for (const site of sites) {
    try {
      // 1. 고객 등록 (이름이 있는 경우)
      let customerId: string | undefined;
      if (site.owner_name) {
        try {
          const customerRes = await api("/customers", {
            name: site.owner_name,
            phone: site.owner_phone,
            address: site.address,
            status: site.status === "시공중" ? "시공중" : "시공완료",
          });
          customerId = customerRes.id;
          console.log(`  👤 고객 등록: ${site.owner_name}`);
        } catch {
          console.log(`  ⚠️ 고객 등록 실패 (계속 진행): ${site.owner_name}`);
        }
      }

      // 2. 현장 등록
      const siteRes = await api("/sites", {
        name: site.name,
        address: site.address,
        buildingType: site.building_type,
        status: site.status,
        startDate: site.start_date,
        endDate: site.end_date,
        memo: site.note || undefined,
        customerId: customerId || undefined,
      });

      const siteId = siteRes.id;
      const emoji = site.status === "시공중" ? "🟢" : site.status === "시공완료" ? "🟡" : "⚪";
      console.log(`${emoji} 현장 등록: ${site.name} (${site.start_date} ~ ${site.end_date})`);
      successSites++;

      // 3. 공정 등록
      const phaseEntries = Object.entries(site.phases);
      for (let i = 0; i < phaseEntries.length; i++) {
        const [category, phase] = phaseEntries[i];

        // 공정 상태 결정
        let phaseStatus: string;
        let progress: number;

        if (phase.end < "2026-04-08") {
          phaseStatus = "완료";
          progress = 100;
        } else if (phase.start <= "2026-04-08") {
          phaseStatus = "진행중";
          progress = 50;
        } else {
          phaseStatus = "예정";
          progress = 0;
        }

        try {
          await api("/schedule", {
            siteId,
            category,
            plannedStart: phase.start,
            plannedEnd: phase.end,
            status: phaseStatus,
            progress,
            memo: phase.works.slice(0, 3).join(" / "),
          });
          successPhases++;
        } catch (err) {
          console.log(`    ⚠️ 공정 등록 실패: ${category} - ${err}`);
        }
      }
      console.log(`  └─ ${phaseEntries.length}개 공정 등록 완료`);

      // API 과부하 방지
      await new Promise((r) => setTimeout(r, 200));

    } catch (err) {
      console.log(`❌ 현장 등록 실패: ${site.name} - ${err}`);
      failedSites++;
    }
  }

  console.log(`\n${"═".repeat(60)}`);
  console.log(`✅ 완료: 현장 ${successSites}개, 공정 ${successPhases}개 등록`);
  if (failedSites > 0) {
    console.log(`❌ 실패: 현장 ${failedSites}개`);
  }
  console.log(`${"═".repeat(60)}\n`);
}

main().catch(console.error);

/**
 * 기존 유저 데이터를 워크스페이스 구조로 마이그레이션하는 스크립트.
 *
 * 실행:
 *   npx tsx scripts/migrate-to-workspaces.ts
 *
 * 동작:
 * 1. 새 테이블 생성 (drizzle-kit push 필요)
 * 2. 각 유저별 개인 워크스페이스 자동 생성
 * 3. 유저를 해당 워크스페이스의 owner로 등록
 * 4. 기존 데이터의 workspace_id를 해당 워크스페이스로 설정
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq, sql } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

const sqlClient = neon(DATABASE_URL);
const db = drizzle(sqlClient, { schema });

// workspace_id가 있는 모든 데이터 테이블
const TABLES_WITH_WORKSPACE_ID = [
  "customers",
  "sites",
  "estimates",
  "contracts",
  "construction_phases",
  "workers",
  "materials",
  "material_orders",
  "expenses",
  "inventory",
  "site_photos",
  "communication_logs",
  "tax_revenue",
  "tax_expenses",
  "tax_vendors",
  "tax_invoices",
  "tax_payroll",
  "tax_calendar",
  "tax_ai_consultations",
  "subscriptions",
  "usage_records",
  "billing_records",
  "analysis_credits",
  "analysis_results",
  "threads_account",
  "threads_templates",
  "threads_posts",
  "threads_auto_rules",
  "threads_comments",
  "marketing_channels",
  "marketing_content",
  "marketing_posts",
  "marketing_inquiries",
  "marketing_campaigns",
  "marketing_keywords",
  "sms_leads",
  "sms_campaigns",
  "sms_outreach_log",
  "sms_conversions",
  "sms_content",
  "sms_crawl_log",
  "notifications",
];

async function migrate() {
  console.log("🚀 워크스페이스 마이그레이션 시작...\n");

  // 1. 모든 유저 조회
  const users = await db.select({ id: schema.user.id, name: schema.user.name, email: schema.user.email }).from(schema.user);
  console.log(`📋 총 ${users.length}명의 유저 발견\n`);

  let created = 0;
  let skipped = 0;

  for (const u of users) {
    // 이미 워크스페이스가 있는지 확인
    const [existingMembership] = await db
      .select({ workspaceId: schema.workspaceMembers.workspaceId })
      .from(schema.workspaceMembers)
      .where(eq(schema.workspaceMembers.userId, u.id))
      .limit(1);

    if (existingMembership) {
      console.log(`  ⏭️  ${u.name} (${u.email}) — 이미 워크스페이스 있음`);
      skipped++;
      continue;
    }

    // 워크스페이스 생성
    const slugBase = u.name
      .toLowerCase()
      .replace(/[^\w\s가-힣-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "workspace";

    const slug = `${slugBase}-${Date.now().toString(36)}`;

    // 초대코드 생성
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
    let inviteCode = "";
    for (let i = 0; i < 8; i++) {
      inviteCode += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const [workspace] = await db
      .insert(schema.workspaces)
      .values({
        name: `${u.name}의 워크스페이스`,
        slug,
        ownerId: u.id,
        inviteCode,
        plan: "free",
        maxMembers: 5,
      })
      .returning();

    // owner 멤버 추가
    const [member] = await db
      .insert(schema.workspaceMembers)
      .values({
        workspaceId: workspace.id,
        userId: u.id,
        role: "owner",
      })
      .returning();

    // 기본 권한 설정
    const categories = [
      "site_management",
      "estimates",
      "marketing",
      "accounting",
      "customers",
      "settings",
    ];
    await db.insert(schema.workspacePermissions).values(
      categories.map((category) => ({
        workspaceId: workspace.id,
        memberId: member.id,
        category,
        accessLevel: "admin",
      })),
    );

    // activeWorkspaceId 설정
    await db
      .update(schema.user)
      .set({ activeWorkspaceId: workspace.id })
      .where(eq(schema.user.id, u.id));

    // 기존 데이터의 workspace_id 업데이트 (raw SQL로 일괄)
    for (const tableName of TABLES_WITH_WORKSPACE_ID) {
      try {
        await db.execute(
          sql`UPDATE ${sql.identifier(tableName)} SET workspace_id = ${workspace.id} WHERE user_id = ${u.id} AND workspace_id IS NULL`,
        );
      } catch {
        // 일부 테이블에 해당 유저 데이터가 없을 수 있음
      }
    }

    console.log(`  ✅ ${u.name} (${u.email}) → workspace: ${workspace.name} (${workspace.id})`);
    created++;
  }

  console.log(`\n📊 결과: ${created}개 생성, ${skipped}개 스킵`);
  console.log("✅ 마이그레이션 완료!");
}

migrate().catch((err) => {
  console.error("❌ 마이그레이션 실패:", err);
  process.exit(1);
});

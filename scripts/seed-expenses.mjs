// Seed demo expense data for dashboard
// Run: node scripts/seed-expenses.mjs

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function seed() {
  const userId = "system";

  // Get existing sites (limit to 3)
  const allSites = await sql`SELECT id, name FROM sites WHERE user_id = ${userId} ORDER BY created_at LIMIT 3`;
  if (allSites.length === 0) {
    console.log("❌ No sites found. Run seed-demo.mjs first.");
    return;
  }
  const sites = allSites;

  console.log("Found sites:", sites.map((s) => s.name));

  // Create estimates for each site
  console.log("Creating estimates...");
  const estimateData = [
    { siteId: sites[0].id, totalAmount: 85000000 },
    { siteId: sites[1]?.id, totalAmount: 52000000 },
    { siteId: sites[2]?.id, totalAmount: 63000000 },
  ].filter(e => e.siteId);

  for (const est of estimateData) {
    const [estimate] = await sql`
      INSERT INTO estimates (id, user_id, site_id, version, total_amount, status)
      VALUES (gen_random_uuid(), ${userId}, ${est.siteId}, 1, ${est.totalAmount}, '승인')
      RETURNING id
    `;

    // Estimate items by category
    const categories = [
      { category: "철거공사", amount: Math.round(est.totalAmount * 0.05) },
      { category: "목공사", amount: Math.round(est.totalAmount * 0.15) },
      { category: "전기공사", amount: Math.round(est.totalAmount * 0.08) },
      { category: "설비공사", amount: Math.round(est.totalAmount * 0.1) },
      { category: "타일공사", amount: Math.round(est.totalAmount * 0.12) },
      { category: "도배공사", amount: Math.round(est.totalAmount * 0.08) },
      { category: "도장공사", amount: Math.round(est.totalAmount * 0.06) },
      { category: "가구공사", amount: Math.round(est.totalAmount * 0.2) },
      { category: "필름공사", amount: Math.round(est.totalAmount * 0.04) },
      { category: "기타", amount: Math.round(est.totalAmount * 0.12) },
    ];

    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      await sql`
        INSERT INTO estimate_items (id, estimate_id, category, item_name, unit, quantity, unit_price, amount, sort_order)
        VALUES (gen_random_uuid(), ${estimate.id}, ${cat.category}, ${cat.category}, '식', 1, ${cat.amount}, ${cat.amount}, ${i + 1})
      `;
    }
  }

  // Create contracts
  console.log("Creating contracts...");
  const contractConfigs = [
    { siteId: sites[0].id, amount: 92000000, midPaid: true },
    { siteId: sites[1]?.id, amount: 58000000, midPaid: false },
    { siteId: sites[2]?.id, amount: 70000000, midPaid: false },
  ].filter(c => c.siteId);

  for (const cfg of contractConfigs) {
    const [contract] = await sql`
      INSERT INTO contracts (id, user_id, site_id, contract_amount, contract_date)
      VALUES (gen_random_uuid(), ${userId}, ${cfg.siteId}, ${cfg.amount}, '2026-02-25')
      RETURNING id
    `;

    const deposit = Math.round(cfg.amount * 0.3);
    const mid = Math.round(cfg.amount * 0.4);
    const final_ = Math.round(cfg.amount * 0.3);

    // Deposit (paid)
    await sql`
      INSERT INTO contract_payments (id, contract_id, type, amount, due_date, paid_date, status)
      VALUES (gen_random_uuid(), ${contract.id}, '계약금', ${deposit}, '2026-02-28', '2026-02-28', '완납')
    `;

    // Mid-payment
    if (cfg.midPaid) {
      await sql`
        INSERT INTO contract_payments (id, contract_id, type, amount, due_date, paid_date, status)
        VALUES (gen_random_uuid(), ${contract.id}, '중도금', ${mid}, '2026-03-15', '2026-03-14', '완납')
      `;
    } else {
      await sql`
        INSERT INTO contract_payments (id, contract_id, type, amount, due_date, paid_date, status)
        VALUES (gen_random_uuid(), ${contract.id}, '중도금', ${mid}, '2026-03-15', NULL, '미수')
      `;
    }

    // Final payment (always unpaid)
    await sql`
      INSERT INTO contract_payments (id, contract_id, type, amount, due_date, paid_date, status)
      VALUES (gen_random_uuid(), ${contract.id}, '잔금', ${final_}, '2026-04-01', NULL, '미수')
    `;
  }

  // Create expenses
  console.log("Creating expenses...");
  const expenseEntries = [
    // Site 1: 한남동 (more expenses since further along)
    { siteId: sites[0].id, category: "자재비", description: "도장 페인트 (벤자민무어)", amount: 3200000, date: "2026-03-03", paymentMethod: "카드", vendor: "벤자민무어 코리아" },
    { siteId: sites[0].id, category: "인건비", description: "도장 기사 3일분", amount: 1800000, date: "2026-03-05", paymentMethod: "계좌이체", vendor: "박도장" },
    { siteId: sites[0].id, category: "자재비", description: "필름 시트지", amount: 1500000, date: "2026-03-04", paymentMethod: "카드", vendor: "LX하우시스" },
    { siteId: sites[0].id, category: "인건비", description: "필름 시공", amount: 900000, date: "2026-03-06", paymentMethod: "현금", vendor: "김필름" },
    { siteId: sites[0].id, category: "자재비", description: "씽크대 주문제작", amount: 8500000, date: "2026-03-10", paymentMethod: "계좌이체", vendor: "씽크연구소" },
    { siteId: sites[0].id, category: "인건비", description: "가구 시공 기사", amount: 2200000, date: "2026-03-12", paymentMethod: "계좌이체", vendor: "이목수" },
    { siteId: sites[0].id, category: "자재비", description: "전기 조명기구", amount: 4200000, date: "2026-03-08", paymentMethod: "카드", vendor: "필립스 조명" },
    { siteId: sites[0].id, category: "운반비", description: "자재 운반", amount: 350000, date: "2026-03-03", paymentMethod: "현금", vendor: "용달" },
    { siteId: sites[0].id, category: "자재비", description: "보일러 (뗄콘)", amount: 3800000, date: "2026-03-15", paymentMethod: "계좌이체", vendor: "뗄콘코리아" },
    { siteId: sites[0].id, category: "기타", description: "현장 식비", amount: 180000, date: "2026-03-07", paymentMethod: "카드", vendor: null },

    // Site 2: 일성스카이빌
    ...(sites[1] ? [
      { siteId: sites[1].id, category: "자재비", description: "설비 배관자재", amount: 2800000, date: "2026-03-03", paymentMethod: "카드", vendor: "삼정배관" },
      { siteId: sites[1].id, category: "인건비", description: "설비 기사 5일분", amount: 2500000, date: "2026-03-07", paymentMethod: "계좌이체", vendor: "정설비" },
      { siteId: sites[1].id, category: "인건비", description: "전기 기사 3일분", amount: 1500000, date: "2026-03-05", paymentMethod: "계좌이체", vendor: "최전기" },
      { siteId: sites[1].id, category: "자재비", description: "보일러 교체", amount: 2100000, date: "2026-03-03", paymentMethod: "카드", vendor: "경동나비엔" },
      { siteId: sites[1].id, category: "자재비", description: "KCC 샷시", amount: 4500000, date: "2026-03-06", paymentMethod: "계좌이체", vendor: "KCC글라스" },
      { siteId: sites[1].id, category: "인건비", description: "목공 기사 4일분", amount: 3200000, date: "2026-03-12", paymentMethod: "계좌이체", vendor: "한목수" },
      { siteId: sites[1].id, category: "자재비", description: "목공 자재 합판/각재", amount: 1800000, date: "2026-03-09", paymentMethod: "카드", vendor: "목재나라" },
      { siteId: sites[1].id, category: "운반비", description: "샷시 운반", amount: 200000, date: "2026-03-06", paymentMethod: "현금", vendor: "용달" },
    ] : []),

    // Site 3: 우장산 (fewer expenses, just started)
    ...(sites[2] ? [
      { siteId: sites[2].id, category: "기타", description: "현장 미팅 교통비", amount: 50000, date: "2026-03-07", paymentMethod: "카드", vendor: null },
      { siteId: sites[2].id, category: "자재비", description: "에어컨 배선 자재", amount: 450000, date: "2026-03-17", paymentMethod: "카드", vendor: "대한전선" },
      { siteId: sites[2].id, category: "인건비", description: "철거 인부 3일", amount: 2400000, date: "2026-03-18", paymentMethod: "현금", vendor: "철거전문" },
      { siteId: sites[2].id, category: "운반비", description: "폐기물 처리", amount: 800000, date: "2026-03-20", paymentMethod: "계좌이체", vendor: "청룡산업" },
    ] : []),
  ];

  for (const exp of expenseEntries) {
    await sql`
      INSERT INTO expenses (id, user_id, site_id, category, description, amount, date, payment_method, vendor)
      VALUES (gen_random_uuid(), ${userId}, ${exp.siteId}, ${exp.category}, ${exp.description}, ${exp.amount}, ${exp.date}, ${exp.paymentMethod}, ${exp.vendor})
    `;
  }

  console.log(`✅ Seeded successfully!`);
  console.log(`  - 3 estimates with items`);
  console.log(`  - 3 contracts with payments`);
  console.log(`  - ${expenseEntries.length} expenses`);
}

seed().catch(console.error);

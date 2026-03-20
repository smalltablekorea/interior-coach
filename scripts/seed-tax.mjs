import pg from "pg";

const DATABASE_URL = "postgresql://neondb_owner:npg_W9TOnGB3zKFX@ep-square-pond-a11pvsyy-pooler.ap-southeast-1.aws.neon.tech/interiorcoach?sslmode=require";
const client = new pg.Client({ connectionString: DATABASE_URL });

async function seed() {
  await client.connect();

  // Get site IDs
  const siteRes = await client.query("SELECT id, name FROM sites LIMIT 5");
  const sites = siteRes.rows;
  const siteIds = sites.map((s) => s.id);

  console.log(`Found ${sites.length} sites`);

  // Seed vendors
  const vendors = [
    { name: "한솔타일", biz: "1234567890", rep: "김한솔", type: "도소매", item: "타일/건축자재", phone: "02-1234-5678" },
    { name: "동아목재", biz: "2345678901", rep: "박동아", type: "제조", item: "목재/합판", phone: "031-234-5678" },
    { name: "삼진설비", biz: "3456789012", rep: "이삼진", type: "건설", item: "설비공사", phone: "032-345-6789" },
    { name: "대한전기", biz: "4567890123", rep: "최대한", type: "건설", item: "전기공사", phone: "02-456-7890" },
    { name: "미래페인트", biz: "5678901234", rep: "정미래", type: "도소매", item: "도료/페인트", phone: "02-567-8901" },
    { name: "성우인테리어", biz: "6789012345", rep: "조성우", type: "건설", item: "인테리어", phone: "031-678-9012" },
  ];

  const vendorIds = [];
  for (const v of vendors) {
    const res = await client.query(
      `INSERT INTO tax_vendors (user_id, name, business_number, representative, business_type, business_item, contact_phone)
       VALUES ('demo', $1, $2, $3, $4, $5, $6) RETURNING id`,
      [v.name, v.biz, v.rep, v.type, v.item, v.phone]
    );
    vendorIds.push(res.rows[0].id);
  }
  console.log(`Seeded ${vendorIds.length} vendors`);

  // Seed revenue (past 6 months)
  const now = new Date();
  let revenueCount = 0;
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const entries = Math.floor(Math.random() * 4) + 2; // 2-5 per month
    for (let i = 0; i < entries; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const supply = (Math.floor(Math.random() * 50) + 5) * 100000; // 50만~5500만
      const vat = Math.round(supply * 0.1);
      const type = ["construction", "construction", "construction", "design", "as"][Math.floor(Math.random() * 5)];
      const method = ["transfer", "invoice", "cash", "card"][Math.floor(Math.random() * 4)];
      const siteId = siteIds[Math.floor(Math.random() * siteIds.length)] || null;
      const collected = Math.random() > 0.3;

      await client.query(
        `INSERT INTO tax_revenue (user_id, site_id, date, type, description, supply_amount, vat_amount, total_amount, payment_method, is_collected)
         VALUES ('demo', $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [siteId, date, type, `${sites.find((s) => s.id === siteId)?.name || "일반"} ${type === "construction" ? "공사" : type === "design" ? "설계" : "A/S"}`, supply, vat, supply + vat, method, collected]
      );
      revenueCount++;
    }
  }
  console.log(`Seeded ${revenueCount} revenue entries`);

  // Seed expenses (past 6 months)
  const categories = ["material", "subcontract", "salary", "vehicle", "office", "transport", "insurance", "other"];
  const catDescriptions = {
    material: ["타일 구매", "합판 구매", "페인트 구매", "설비자재", "전기자재", "욕실자재"],
    subcontract: ["목공 외주", "타일 외주", "설비 외주", "전기 외주", "도배 외주", "철거 외주"],
    salary: ["직원 급여", "사무직 급여"],
    vehicle: ["유류비", "주차비", "차량수리"],
    office: ["임대료", "전기요금", "통신비", "사무용품"],
    transport: ["자재 운반비", "폐기물 처리비"],
    insurance: ["산재보험", "배상책임보험"],
    other: ["교육비", "마케팅비"],
  };

  let expenseCount = 0;
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const entries = Math.floor(Math.random() * 8) + 5; // 5-12 per month
    for (let i = 0; i < entries; i++) {
      const day = Math.floor(Math.random() * 28) + 1;
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const descs = catDescriptions[cat];
      const desc = descs[Math.floor(Math.random() * descs.length)];
      const supply = (Math.floor(Math.random() * 30) + 1) * 100000; // 10만~3000만
      const vat = Math.round(supply * 0.1);
      const method = ["card", "transfer", "cash", "invoice"][Math.floor(Math.random() * 4)];
      const siteId = Math.random() > 0.3 ? siteIds[Math.floor(Math.random() * siteIds.length)] : null;
      const vendorId = vendorIds[Math.floor(Math.random() * vendorIds.length)];
      const deductible = cat !== "welfare" || Math.random() > 0.5;

      await client.query(
        `INSERT INTO tax_expenses (user_id, site_id, vendor_id, date, category, description, supply_amount, vat_amount, total_amount, payment_method, is_deductible)
         VALUES ('demo', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [siteId, vendorId, date, cat, desc, supply, vat, supply + vat, method, deductible]
      );
      expenseCount++;
    }
  }
  console.log(`Seeded ${expenseCount} expense entries`);

  // Seed tax calendar
  const calendarItems = [
    { title: "부가세 예정신고 (1기)", type: "vat", due: "2026-04-25" },
    { title: "종합소득세 신고", type: "income_tax", due: "2026-05-31" },
    { title: "원천세 신고/납부 (4월)", type: "withholding", due: "2026-04-10" },
    { title: "원천세 신고/납부 (5월)", type: "withholding", due: "2026-05-10" },
    { title: "4대보험 신고 (4월)", type: "insurance", due: "2026-04-10" },
  ];

  for (const c of calendarItems) {
    await client.query(
      `INSERT INTO tax_calendar (user_id, title, type, due_date, status, auto_generated)
       VALUES ('demo', $1, $2, $3, 'upcoming', true)`,
      [c.title, c.type, c.due]
    );
  }
  console.log(`Seeded ${calendarItems.length} calendar items`);

  // Seed payroll
  const payrollData = [
    { workerName: "김목수", workerType: "일용직", payPeriod: "2026-02", workDays: 15, grossAmount: 3000000 },
    { workerName: "이타일", workerType: "일용직", payPeriod: "2026-02", workDays: 12, grossAmount: 2400000 },
    { workerName: "박전기", workerType: "일용직", payPeriod: "2026-03", workDays: 10, grossAmount: 2200000 },
    { workerName: "정디자인", workerType: "프리랜서", payPeriod: "2026-02", workDays: null, grossAmount: 4000000 },
    { workerName: "한설계", workerType: "프리랜서", payPeriod: "2026-03", workDays: null, grossAmount: 3500000 },
    { workerName: "최관리", workerType: "정규직", payPeriod: "2026-03", workDays: 22, grossAmount: 3800000 },
  ];

  for (const p of payrollData) {
    let incomeTax = 0, localTax = 0, nationalPension = 0, healthInsurance = 0, employmentInsurance = 0;
    if (p.workerType === "일용직") {
      incomeTax = Math.round(p.grossAmount * 0.027);
      localTax = Math.round(incomeTax * 0.1);
    } else if (p.workerType === "프리랜서") {
      incomeTax = Math.round(p.grossAmount * 0.03);
      localTax = Math.round(p.grossAmount * 0.003);
    } else if (p.workerType === "정규직") {
      incomeTax = Math.round(p.grossAmount * 0.035);
      localTax = Math.round(incomeTax * 0.1);
      nationalPension = Math.round(p.grossAmount * 0.045);
      healthInsurance = Math.round(p.grossAmount * 0.03545);
      employmentInsurance = Math.round(p.grossAmount * 0.009);
    }
    const netAmount = p.grossAmount - incomeTax - localTax - nationalPension - healthInsurance - employmentInsurance;
    const siteId = siteIds[Math.floor(Math.random() * siteIds.length)] || null;
    const isPaid = p.payPeriod === "2026-02";

    await client.query(
      `INSERT INTO tax_payroll (user_id, site_id, worker_name, worker_type, pay_period, work_days, gross_amount, income_tax, local_tax, national_pension, health_insurance, employment_insurance, net_amount, is_paid, payment_method)
       VALUES ('demo', $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'transfer')`,
      [siteId, p.workerName, p.workerType, p.payPeriod, p.workDays, p.grossAmount, incomeTax, localTax, nationalPension, healthInsurance, employmentInsurance, netAmount, isPaid]
    );
  }
  console.log(`Seeded ${payrollData.length} payroll records`);

  await client.end();
  console.log("Done!");
}

seed().catch(console.error);

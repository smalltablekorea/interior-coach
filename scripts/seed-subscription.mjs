import pg from "pg";

const DATABASE_URL = "postgresql://neondb_owner:npg_W9TOnGB3zKFX@ep-square-pond-a11pvsyy-pooler.ap-southeast-1.aws.neon.tech/interiorcoach?sslmode=require";
const client = new pg.Client({ connectionString: DATABASE_URL });

async function seed() {
  await client.connect();

  const userId = "demo";

  // Check if subscription already exists
  const existing = await client.query(
    "SELECT id FROM subscriptions WHERE user_id = $1",
    [userId]
  );

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(trialEnd.getDate() + 14);
  const periodEnd = new Date(trialEnd);

  if (existing.rows.length > 0) {
    await client.query(
      `UPDATE subscriptions SET plan = 'pro', status = 'trialing', billing_cycle = 'monthly',
       trial_ends_at = $1, current_period_start = $2, current_period_end = $3, updated_at = $2
       WHERE user_id = $4`,
      [trialEnd, now, periodEnd, userId]
    );
    console.log("Updated existing subscription to Pro trial");
  } else {
    await client.query(
      `INSERT INTO subscriptions (user_id, plan, billing_cycle, status, trial_ends_at, current_period_start, current_period_end)
       VALUES ($1, 'pro', 'monthly', 'trialing', $2, $3, $4)`,
      [userId, trialEnd, now, periodEnd]
    );
    console.log("Created Pro trial subscription");
  }

  // Seed usage records
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Check existing usage records
  const existingUsage = await client.query(
    "SELECT id FROM usage_records WHERE user_id = $1 AND period = $2",
    [userId, period]
  );

  if (existingUsage.rows.length === 0) {
    await client.query(
      `INSERT INTO usage_records (user_id, feature, period, count) VALUES ($1, 'aiTaxAdvisor', $2, 3)`,
      [userId, period]
    );
    console.log(`Seeded usage record: aiTaxAdvisor = 3 for ${period}`);
  } else {
    console.log("Usage records already exist, skipping");
  }

  await client.end();
  console.log("Done!");
}

seed().catch(console.error);

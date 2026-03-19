import { readFileSync } from "fs";
import { Client } from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DB_URL =
  "postgresql://neondb_owner:npg_W9TOnGB3zKFX@ep-square-pond-a11pvsyy-pooler.ap-southeast-1.aws.neon.tech/interiorcoach?sslmode=require";

function parseCSV(text) {
  const lines = text.split("\n").filter((l) => l.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const row = [];
    let current = "";
    let inQuotes = false;
    for (const ch of lines[i]) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    row.push(current.trim());
    if (row.length >= 6) rows.push(row);
  }
  return rows;
}

async function main() {
  const csv = readFileSync(join(__dirname, "materials.csv"), "utf-8");
  const rows = parseCSV(csv);
  console.log(`Parsed ${rows.length} rows from CSV`);

  const client = new Client({ connectionString: DB_URL });
  await client.connect();

  // Clear existing standard materials
  const delResult = await client.query(
    "DELETE FROM materials WHERE is_standard = true"
  );
  console.log(`Deleted ${delResult.rowCount} existing standard materials`);

  // Insert in batches of 50
  const batchSize = 50;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const values = [];
    const params = [];
    let paramIdx = 1;

    for (const [category, name, brand, grade, unit, priceStr] of batch) {
      const price = parseInt(priceStr.replace(/[^0-9]/g, ""), 10) || 0;
      const brandVal = brand === "-" ? null : brand;
      values.push(
        `($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, true)`
      );
      params.push(category, name, brandVal, grade, unit, price);
    }

    await client.query(
      `INSERT INTO materials (category, name, brand, grade, unit, unit_price, is_standard) VALUES ${values.join(", ")}`,
      params
    );
    inserted += batch.length;
    if (inserted % 200 === 0 || inserted === rows.length) {
      console.log(`Inserted ${inserted}/${rows.length}`);
    }
  }

  // Verify
  const countResult = await client.query(
    "SELECT COUNT(*) FROM materials WHERE is_standard = true"
  );
  console.log(
    `Total standard materials in DB: ${countResult.rows[0].count}`
  );

  await client.end();
  console.log("Done!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

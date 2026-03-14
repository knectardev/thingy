import { readFileSync } from "fs";
import pg from "pg";

const connectionString = process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error("No POSTGRES_URL found. Set it in .env.local");
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

try {
  await client.connect();
  const schema = readFileSync("lib/schema.sql", "utf-8");
  await client.query(schema);
  console.log("Schema applied successfully.");
} catch (err) {
  console.error("Failed to apply schema:", err.message);
  process.exit(1);
} finally {
  await client.end();
}

import { readFileSync } from "node:fs";
import path from "node:path";
import { createPool } from "@vercel/postgres";
import { getDirectPostgresConnectionUrl } from "@/lib/db/client";
import { ensureProductAdminSchema } from "@/lib/db/filters-repository";

export async function runMigrations(): Promise<void> {
  const connectionString = getDirectPostgresConnectionUrl();
  if (!connectionString) {
    throw new Error("Missing direct Postgres connection URL for migrations");
  }

  const schemaPath = path.join(process.cwd(), "lib/db/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  const pool = createPool({ connectionString });
  try {
    for (const statement of statements) {
      await pool.query(statement);
    }
  } finally {
    await pool.end();
  }

  await ensureProductAdminSchema();
}

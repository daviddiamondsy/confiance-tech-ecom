import { readFileSync } from "node:fs";
import path from "node:path";
import { queryDdl } from "@/lib/db/client";
import { ensureProductAdminSchema } from "@/lib/db/filters-repository";

export async function runMigrations(): Promise<void> {
  const schemaPath = path.join(process.cwd(), "lib/db/schema.sql");
  const schema = readFileSync(schemaPath, "utf8");
  const statements = schema
    .split(";")
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  for (const statement of statements) {
    await queryDdl(statement);
  }

  await ensureProductAdminSchema();
}

import { ensureCatalogSchema } from "@/lib/db/catalog-schema";

export async function runMigrations(): Promise<void> {
  await ensureCatalogSchema();
}

import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { ensureOrdersSchema } from "@/lib/db/orders-schema";
import { ensureReferralSchema } from "@/lib/db/referral-schema";

export async function runMigrations(): Promise<void> {
  await ensureCatalogSchema();
  await ensureReferralSchema();
  await ensureOrdersSchema();
}

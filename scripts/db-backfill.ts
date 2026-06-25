import { config } from "dotenv";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";

config({ path: ".env.local" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error(
      "No database URL found. Set POSTGRES_URL or DATABASE_URL in .env.local (copy from Vercel → Storage → Neon)."
    );
    process.exit(1);
  }

  // ensureCatalogSchema already runs catalog backfills; no second pass needed.
  await ensureCatalogSchema();
  console.log("Catalog backfills applied (S24 Ultra + ₦25,000 international shipping).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

import { config } from "dotenv";
import { isPostgresConfigured } from "@/lib/db/client";
import { backfillLikeNewProductNames } from "@/lib/db/filters-repository";

config({ path: ".env.local" });
config({ path: ".env.production" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error(
      "No database URL found. Set POSTGRES_URL or DATABASE_URL (e.g. DATABASE_URL=... npm run db:backfill-like-new-names)."
    );
    process.exit(1);
  }

  const count = await backfillLikeNewProductNames();
  console.log(`Updated ${count} product name(s) to use (Like New) instead of (Clean).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

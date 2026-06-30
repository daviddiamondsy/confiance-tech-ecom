import { config } from "dotenv";
import { isPostgresConfigured } from "@/lib/db/client";
import { backfillIphoneUnlockedCopy } from "@/lib/db/products-repository";

config({ path: ".env.local" });
config({ path: ".env.production" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error(
      "No database URL found. Set POSTGRES_URL or DATABASE_URL (e.g. DATABASE_URL=... npm run db:backfill-iphone-unlocked)."
    );
    process.exit(1);
  }

  const count = await backfillIphoneUnlockedCopy();
  console.log(`Backfilled Unlocked copy for ${count} iPhone product(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

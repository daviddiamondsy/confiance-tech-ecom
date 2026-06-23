import { config } from "dotenv";
import { isPostgresConfigured } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { seedCatalog } from "@/lib/db/seed";

config({ path: ".env.local" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error(
      "No database URL found. Set POSTGRES_URL or DATABASE_URL in .env.local (Neon/Vercel integration provides DATABASE_URL)."
    );
    process.exit(1);
  }

  await runMigrations();
  const count = await seedCatalog();
  console.log(`Seeded ${count} products.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

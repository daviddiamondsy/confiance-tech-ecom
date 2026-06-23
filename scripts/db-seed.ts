import { config } from "dotenv";
import { runMigrations } from "@/lib/db/migrate";
import { seedCatalog } from "@/lib/db/seed";

config({ path: ".env.local" });

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL is not set. Link Vercel Postgres or add it to .env.local");
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

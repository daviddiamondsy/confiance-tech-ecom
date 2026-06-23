import { config } from "dotenv";
import { runMigrations } from "@/lib/db/migrate";

config({ path: ".env.local" });

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error("POSTGRES_URL is not set. Link Vercel Postgres or add it to .env.local");
    process.exit(1);
  }

  await runMigrations();
  console.log("Database schema applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

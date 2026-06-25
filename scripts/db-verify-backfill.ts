import { config } from "dotenv";
import { isPostgresConfigured, sql } from "@/lib/db/client";

config({ path: ".env.local" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error("No database URL found.");
    process.exit(1);
  }

  const migrations = await sql<{ id: string; applied_at: string }>`
    SELECT id, applied_at FROM schema_migrations ORDER BY applied_at
  `;
  console.log("Migrations:", migrations.rows);

  const s24 = await sql<{
    id: string;
    slug: string;
    name: string;
    international_shipping_ngn: number;
    price: number;
  }>`
    SELECT id, slug, name, international_shipping_ngn, price
    FROM products
    WHERE slug = 'samsung-galaxy-s24-ultra'
       OR name ILIKE '%s24%ultra%'
  `;
  console.log("S24 products:", s24.rows);

  const shipping = await sql<{ international_shipping_ngn: number; n: number }>`
    SELECT international_shipping_ngn, count(*)::int as n
    FROM products
    GROUP BY international_shipping_ngn
    ORDER BY 1
  `;
  console.log("Shipping distribution:", shipping.rows);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

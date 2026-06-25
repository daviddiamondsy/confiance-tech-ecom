import { config } from "dotenv";
import { isPostgresConfigured, sql } from "@/lib/db/client";
import { fetchPricingConfig } from "@/lib/db/pricing-config-repository";
import { priceFromYuan } from "@/lib/pricing";
import { productShippingFromRow } from "@/lib/product-shipping";

config({ path: ".env.local" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error("No database URL");
    process.exit(1);
  }

  const config = await fetchPricingConfig();
  const { rows } = await sql`
    SELECT p.name, p.slug, p.price, p.yuan_cost::float AS yuan_cost,
           p.china_shipping_yuan, p.international_shipping_ngn
    FROM products p
    WHERE p.slug = 'macbook-pro-m4'
    LIMIT 1
  `;
  const row = rows[0];
  if (!row) {
    console.log("MacBook not found");
    return;
  }

  const shipping = productShippingFromRow(row);
  const yuan = Number(row.yuan_cost);
  const calculated = priceFromYuan(yuan, config, shipping);

  console.log({
    name: row.name,
    dbPrice: row.price,
    calculated,
    matches: Number(row.price) === calculated,
    yuan,
    shipping,
    pricingConfig: config,
  });

  const { rows: opts } = await sql`
    SELECT storage, price, yuan_cost::float AS yuan
    FROM product_storage_options o
    JOIN products p ON p.id = o.product_id
    WHERE p.slug = 'macbook-pro-m4'
  `;
  for (const opt of opts) {
    const optPrice = priceFromYuan(Number(opt.yuan), config, shipping);
    console.log("variant", opt.storage, { db: opt.price, calculated: optPrice, matches: Number(opt.price) === optPrice });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

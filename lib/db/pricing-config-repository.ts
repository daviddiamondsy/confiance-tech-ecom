import { sql } from "@vercel/postgres";
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/pricing";

interface PricingConfigRow {
  yuan_to_naira: string;
  shipping_ngn: number;
  selling_markup: string;
  expensive_yuan_threshold: string | null;
  expensive_selling_markup: string | null;
}

function mapRow(row: PricingConfigRow): PricingConfig {
  return {
    yuanToNaira: Number(row.yuan_to_naira),
    shippingNgn: row.shipping_ngn,
    sellingMarkup: Number(row.selling_markup),
    expensiveYuanThreshold:
      row.expensive_yuan_threshold != null ? Number(row.expensive_yuan_threshold) : null,
    expensiveSellingMarkup:
      row.expensive_selling_markup != null ? Number(row.expensive_selling_markup) : null,
  };
}

export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    const { rows } = await sql<PricingConfigRow>`
      SELECT
        yuan_to_naira,
        shipping_ngn,
        selling_markup,
        expensive_yuan_threshold,
        expensive_selling_markup
      FROM pricing_config
      WHERE id = 'default'
      LIMIT 1
    `;
    if (rows[0]) return mapRow(rows[0]);
  } catch {
    // Table may not exist before first migrate
  }
  return DEFAULT_PRICING_CONFIG;
}

export async function updatePricingConfig(
  config: PricingConfig
): Promise<PricingConfig> {
  await sql.query(
    `INSERT INTO pricing_config (
       id, yuan_to_naira, shipping_ngn, selling_markup,
       expensive_yuan_threshold, expensive_selling_markup, updated_at
     )
     VALUES ('default', $1, $2, $3, $4, $5, NOW())
     ON CONFLICT (id) DO UPDATE SET
       yuan_to_naira = EXCLUDED.yuan_to_naira,
       shipping_ngn = EXCLUDED.shipping_ngn,
       selling_markup = EXCLUDED.selling_markup,
       expensive_yuan_threshold = EXCLUDED.expensive_yuan_threshold,
       expensive_selling_markup = EXCLUDED.expensive_selling_markup,
       updated_at = NOW()`,
    [
      config.yuanToNaira,
      config.shippingNgn,
      config.sellingMarkup,
      config.expensiveYuanThreshold ?? null,
      config.expensiveSellingMarkup ?? null,
    ]
  );

  return config;
}

export async function recalculateAllPrices(config: PricingConfig): Promise<void> {
  const { priceFromYuan } = await import("@/lib/pricing");

  const { rows: products } = await sql<{ id: string; yuan_cost: string | null }>`
    SELECT id, yuan_cost FROM products WHERE yuan_cost IS NOT NULL
  `;

  for (const product of products) {
    const yuan = Number(product.yuan_cost);
    const price = priceFromYuan(yuan, config);
    await sql.query(`UPDATE products SET price = $1, updated_at = NOW() WHERE id = $2`, [
      price,
      product.id,
    ]);
  }

  const { rows: options } = await sql<{
    id: number;
    yuan_cost: string | null;
  }>`SELECT id, yuan_cost FROM product_storage_options WHERE yuan_cost IS NOT NULL`;

  for (const option of options) {
    const yuan = Number(option.yuan_cost);
    const price = priceFromYuan(yuan, config);
    await sql.query(`UPDATE product_storage_options SET price = $1 WHERE id = $2`, [
      price,
      option.id,
    ]);
  }
}

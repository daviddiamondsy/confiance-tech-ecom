import { sql } from "@/lib/db/client";
import { CATALOG_YUAN } from "@/lib/catalog-yuan";
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/pricing";
import { productShippingFromRow } from "@/lib/product-shipping";

function storageOptionYuanCost(
  productId: string,
  storage: string,
  optionYuan: string | null,
  baseYuan: number | null
): number | null {
  if (optionYuan != null && !Number.isNaN(Number(optionYuan))) {
    return Number(optionYuan);
  }

  const catalogYuan = CATALOG_YUAN[productId]?.storageYuan?.[storage];
  if (catalogYuan != null) {
    return catalogYuan;
  }

  return baseYuan;
}

interface PricingConfigRow {
  yuan_to_naira: string;
  selling_markup: string;
  expensive_yuan_threshold: string | null;
  expensive_selling_markup: string | null;
}

function mapRow(row: PricingConfigRow): PricingConfig {
  return {
    yuanToNaira: Number(row.yuan_to_naira),
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
     VALUES ('default', $1, 0, $2, $3, $4, NOW())
     ON CONFLICT (id) DO UPDATE SET
       yuan_to_naira = EXCLUDED.yuan_to_naira,
       selling_markup = EXCLUDED.selling_markup,
       expensive_yuan_threshold = EXCLUDED.expensive_yuan_threshold,
       expensive_selling_markup = EXCLUDED.expensive_selling_markup,
       updated_at = NOW()`,
    [
      config.yuanToNaira,
      config.sellingMarkup,
      config.expensiveYuanThreshold ?? null,
      config.expensiveSellingMarkup ?? null,
    ]
  );

  return config;
}

export async function recalculateAllPrices(config: PricingConfig): Promise<void> {
  const { priceFromYuan } = await import("@/lib/pricing");

  const { rows: products } = await sql<{
    id: string;
    name: string;
    yuan_cost: string | null;
    china_shipping_yuan: number;
    international_shipping_ngn: number;
    local_delivery_ngn: number;
  }>`
    SELECT id, name, yuan_cost, china_shipping_yuan, international_shipping_ngn, local_delivery_ngn
    FROM products
    WHERE yuan_cost IS NOT NULL
  `;

  for (const product of products) {
    const yuan = Number(product.yuan_cost);
    const shipping = productShippingFromRow(product);
    const price = priceFromYuan(yuan, config, shipping);
    await sql.query(`UPDATE products SET price = $1, updated_at = NOW() WHERE id = $2`, [
      price,
      product.id,
    ]);
  }

  const { rows: options } = await sql<{
    id: number;
    product_id: string;
    storage: string;
    yuan_cost: string | null;
    product_yuan_cost: string | null;
    china_shipping_yuan: number;
    international_shipping_ngn: number;
    local_delivery_ngn: number;
    name: string;
  }>`
    SELECT
      o.id,
      o.product_id,
      o.storage,
      o.yuan_cost,
      p.yuan_cost AS product_yuan_cost,
      p.china_shipping_yuan,
      p.international_shipping_ngn,
      p.local_delivery_ngn,
      p.name
    FROM product_storage_options o
    JOIN products p ON p.id = o.product_id
  `;

  for (const option of options) {
    const baseYuan =
      option.product_yuan_cost != null ? Number(option.product_yuan_cost) : null;
    const yuan = storageOptionYuanCost(
      option.product_id,
      option.storage,
      option.yuan_cost,
      baseYuan
    );
    if (yuan == null) continue;

    const shipping = productShippingFromRow(option);
    const price = priceFromYuan(yuan, config, shipping);
    await sql.query(`UPDATE product_storage_options SET price = $1, yuan_cost = $2 WHERE id = $3`, [
      price,
      yuan,
      option.id,
    ]);
  }
}

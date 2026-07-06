import { sql } from "@/lib/db/client";
import { CATALOG_YUAN } from "@/lib/catalog-yuan";
import {
  DEFAULT_EXPENSIVE_WHOLESALE_NGN_THRESHOLD,
  DEFAULT_GBP_TO_NAIRA,
  DEFAULT_USD_TO_NAIRA,
  DEFAULT_PRICING_CONFIG,
  parseCostCurrency,
  priceFromSupplierCost,
  type PricingConfig,
  type SupplierCostCurrency,
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
  gbp_to_naira: string | null;
  usd_to_naira: string | null;
  selling_markup: string;
  expensive_yuan_threshold: string | null;
  expensive_wholesale_ngn_threshold: string | null;
  expensive_selling_markup: string | null;
}

function mapRow(row: PricingConfigRow): PricingConfig {
  return {
    yuanToNaira: Number(row.yuan_to_naira),
    gbpToNaira: row.gbp_to_naira != null ? Number(row.gbp_to_naira) : DEFAULT_GBP_TO_NAIRA,
    usdToNaira: row.usd_to_naira != null ? Number(row.usd_to_naira) : DEFAULT_USD_TO_NAIRA,
    sellingMarkup: Number(row.selling_markup),
    expensiveYuanThreshold:
      row.expensive_yuan_threshold != null ? Number(row.expensive_yuan_threshold) : null,
    expensiveWholesaleNgnThreshold:
      row.expensive_wholesale_ngn_threshold != null
        ? Number(row.expensive_wholesale_ngn_threshold)
        : DEFAULT_EXPENSIVE_WHOLESALE_NGN_THRESHOLD,
    expensiveSellingMarkup:
      row.expensive_selling_markup != null ? Number(row.expensive_selling_markup) : null,
  };
}

export async function fetchPricingConfig(): Promise<PricingConfig> {
  try {
    const { rows } = await sql<PricingConfigRow>`
      SELECT
        yuan_to_naira,
        gbp_to_naira,
        usd_to_naira,
        selling_markup,
        expensive_yuan_threshold,
        expensive_wholesale_ngn_threshold,
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
       id, yuan_to_naira, gbp_to_naira, usd_to_naira, shipping_ngn, selling_markup,
       expensive_yuan_threshold, expensive_wholesale_ngn_threshold, expensive_selling_markup, updated_at
     )
     VALUES ('default', $1, $2, $3, 0, $4, $5, $6, $7, NOW())
     ON CONFLICT (id) DO UPDATE SET
       yuan_to_naira = EXCLUDED.yuan_to_naira,
       gbp_to_naira = EXCLUDED.gbp_to_naira,
       usd_to_naira = EXCLUDED.usd_to_naira,
       selling_markup = EXCLUDED.selling_markup,
       expensive_yuan_threshold = EXCLUDED.expensive_yuan_threshold,
       expensive_wholesale_ngn_threshold = EXCLUDED.expensive_wholesale_ngn_threshold,
       expensive_selling_markup = EXCLUDED.expensive_selling_markup,
       updated_at = NOW()`,
    [
      config.yuanToNaira,
      config.gbpToNaira,
      config.usdToNaira,
      config.sellingMarkup,
      config.expensiveYuanThreshold ?? null,
      config.expensiveWholesaleNgnThreshold ?? null,
      config.expensiveSellingMarkup ?? null,
    ]
  );

  return config;
}

function resolveCostCurrency(raw: string | null | undefined): SupplierCostCurrency {
  if (!raw) return "cny";
  try {
    return parseCostCurrency(raw);
  } catch {
    return "cny";
  }
}

export async function recalculateAllPrices(config: PricingConfig): Promise<void> {
  const { rows: products } = await sql<{
    id: string;
    name: string;
    yuan_cost: string | null;
    cost_currency: string | null;
    china_shipping_yuan: number;
    international_shipping_ngn: number;
    local_delivery_ngn: number;
  }>`
    SELECT id, name, yuan_cost, cost_currency, china_shipping_yuan, international_shipping_ngn, local_delivery_ngn
    FROM products
    WHERE yuan_cost IS NOT NULL
  `;

  for (const product of products) {
    const cost = Number(product.yuan_cost);
    const currency = resolveCostCurrency(product.cost_currency);
    const shipping = productShippingFromRow(product);
    const price = priceFromSupplierCost(cost, currency, config, shipping);
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
    cost_currency: string | null;
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
      p.cost_currency,
      p.china_shipping_yuan,
      p.international_shipping_ngn,
      p.local_delivery_ngn,
      p.name
    FROM product_storage_options o
    JOIN products p ON p.id = o.product_id
  `;

  for (const option of options) {
    const baseCost =
      option.product_yuan_cost != null ? Number(option.product_yuan_cost) : null;
    const cost = storageOptionYuanCost(
      option.product_id,
      option.storage,
      option.yuan_cost,
      baseCost
    );
    if (cost == null) continue;

    const currency = resolveCostCurrency(option.cost_currency);
    const shipping = productShippingFromRow(option);
    const price = priceFromSupplierCost(cost, currency, config, shipping);
    await sql.query(`UPDATE product_storage_options SET price = $1, yuan_cost = $2 WHERE id = $3`, [
      price,
      cost,
      option.id,
    ]);
  }
}

import type { ProductShippingCosts } from "@/lib/product-shipping";
import {
  DEFAULT_PRODUCT_SHIPPING,
  internationalShippingAmountNgn,
  totalShippingNgn,
} from "@/lib/product-shipping";

export type SupplierCostCurrency = "cny" | "gbp" | "usd";

export const SUPPLIER_COST_CURRENCIES: SupplierCostCurrency[] = ["cny", "gbp", "usd"];

export interface PricingConfig {
  yuanToNaira: number;
  gbpToNaira: number;
  usdToNaira: number;
  sellingMarkup: number;
  /** When CNY cost is at or above this, use expensiveSellingMarkup instead. */
  expensiveYuanThreshold?: number | null;
  /** When GBP/USD wholesale (cost x rate, before shipping) is at or above this, use expensive markup. */
  expensiveWholesaleNgnThreshold?: number | null;
  /** Markup multiplier for expensive items (default 1.15 = 15% markup). */
  expensiveSellingMarkup?: number | null;
}

export const DEFAULT_GBP_TO_NAIRA = 1850;
export const DEFAULT_USD_TO_NAIRA = 1650;
export const DEFAULT_EXPENSIVE_WHOLESALE_NGN_THRESHOLD = 724_500;

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  /** Fallback when pricing_config row is missing; admin Pricing tab is the source of truth. */
  yuanToNaira: 207,
  gbpToNaira: DEFAULT_GBP_TO_NAIRA,
  usdToNaira: DEFAULT_USD_TO_NAIRA,
  sellingMarkup: 1.2,
  expensiveYuanThreshold: 3500,
  expensiveWholesaleNgnThreshold: DEFAULT_EXPENSIVE_WHOLESALE_NGN_THRESHOLD,
  expensiveSellingMarkup: 1.15,
};

export function parseCostCurrency(value: unknown): SupplierCostCurrency {
  const raw = String(value ?? "cny").trim().toLowerCase();
  if (raw === "cny" || raw === "gbp" || raw === "usd") {
    return raw;
  }
  throw new Error("INVALID_COST_CURRENCY");
}

export function formatSupplierCost(amount: number, currency: SupplierCostCurrency): string {
  if (currency === "gbp") return `£${amount}`;
  if (currency === "usd") return `$${amount}`;
  return `${amount}¥`;
}

export function costCurrencyLabel(currency: SupplierCostCurrency): string {
  if (currency === "gbp") return "GBP (£)";
  if (currency === "usd") return "USD ($)";
  return "CNY (¥)";
}

export function fxRateForCurrency(
  currency: SupplierCostCurrency,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  if (currency === "gbp") return config.gbpToNaira;
  if (currency === "usd") return config.usdToNaira;
  return config.yuanToNaira;
}

/** Shipping included in cost-before-markup. CNY includes china shipping; GBP/USD do not. */
export function shippingNgnForCostCurrency(
  shipping: ProductShippingCosts,
  config: PricingConfig,
  currency: SupplierCostCurrency
): number {
  if (currency === "cny") {
    return totalShippingNgn(shipping, config.yuanToNaira, config.usdToNaira);
  }
  return internationalShippingAmountNgn(shipping, config.usdToNaira) + shipping.localDeliveryNgn;
}

/** Wholesale NGN used for expensive-item tier (GBP/USD: cost x rate only; CNY: yuan x rate). */
export function wholesaleNgnForTier(
  cost: number,
  currency: SupplierCostCurrency,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return cost * fxRateForCurrency(currency, config);
}

export function costBeforeMarkupNgn(
  cost: number,
  currency: SupplierCostCurrency,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  shipping: ProductShippingCosts = DEFAULT_PRODUCT_SHIPPING
): number {
  return (
    wholesaleNgnForTier(cost, currency, config) +
    shippingNgnForCostCurrency(shipping, config, currency)
  );
}

/** Pick markup multiplier based on supplier cost tier. */
export function sellingMarkupForSupplierCost(
  cost: number,
  currency: SupplierCostCurrency,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  const threshold = config.expensiveYuanThreshold;
  const wholesaleThreshold = config.expensiveWholesaleNgnThreshold;
  const expensiveMarkup = config.expensiveSellingMarkup;

  if (expensiveMarkup == null || expensiveMarkup <= 0) {
    return config.sellingMarkup;
  }

  if (currency === "cny") {
    if (threshold != null && threshold > 0 && cost >= threshold) {
      return expensiveMarkup;
    }
  } else if (wholesaleThreshold != null && wholesaleThreshold > 0) {
    if (wholesaleNgnForTier(cost, currency, config) >= wholesaleThreshold) {
      return expensiveMarkup;
    }
  }

  return config.sellingMarkup;
}

/** @deprecated Use sellingMarkupForSupplierCost with currency "cny". */
export function sellingMarkupForYuan(
  yuan: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG
): number {
  return sellingMarkupForSupplierCost(yuan, "cny", config);
}

/**
 * Selling price in NGN from supplier cost in CNY, GBP, or USD.
 * CNY: markup x (yuan x rate + china + intl + local), charm pricing.
 * GBP/USD: markup x (amount x rate + intl + local), charm pricing (no china shipping).
 */
export function priceFromSupplierCost(
  cost: number,
  currency: SupplierCostCurrency,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  shipping: ProductShippingCosts = DEFAULT_PRODUCT_SHIPPING
): number {
  const costPrice = costBeforeMarkupNgn(cost, currency, config, shipping);
  const markup = sellingMarkupForSupplierCost(cost, currency, config);
  const sellingPrice = Math.round(costPrice * markup);
  return toCharmPrice(sellingPrice);
}

/**
 * Selling price in NGN from yuan cost (CNY supplier currency).
 * @deprecated Prefer priceFromSupplierCost with currency "cny".
 */
export function priceFromYuan(
  yuan: number,
  config: PricingConfig = DEFAULT_PRICING_CONFIG,
  shipping: ProductShippingCosts = DEFAULT_PRODUCT_SHIPPING
): number {
  return priceFromSupplierCost(yuan, "cny", config, shipping);
}

/**
 * Charm pricing: nearest amount ending in 9999 (ties round down).
 */
export function toCharmPrice(price: number): number {
  if (price < 9999) return price;
  const lower = Math.floor((price - 9999) / 10_000) * 10_000 + 9999;
  const upper = lower + 10_000;
  return price - lower <= upper - price ? lower : upper;
}

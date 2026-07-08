export const CHINA_SHIPPING_YUAN_OPTIONS = [0, 10, 30] as const;
export const INTERNATIONAL_SHIPPING_NGN_OPTIONS = [0, 25_000, 40_000, 50_000] as const;
export const INTERNATIONAL_SHIPPING_USD_OPTIONS = [0, 15, 25, 30] as const;
export const LOCAL_DELIVERY_NGN_OPTIONS = [0, 10_000, 15_000, 20_000] as const;

export const DEFAULT_CHINA_SHIPPING_YUAN = 10;
export const DEFAULT_INTERNATIONAL_SHIPPING_NGN = 25_000;
export const DEFAULT_INTERNATIONAL_SHIPPING_USD = 15;
export const DEFAULT_LOCAL_DELIVERY_NGN = 10_000;
export const LAPTOP_CHINA_SHIPPING_YUAN = 30;
export const LAPTOP_INTERNATIONAL_SHIPPING_NGN = 50_000;
export const LAPTOP_INTERNATIONAL_SHIPPING_USD = 30;

export type ChinaShippingYuan = (typeof CHINA_SHIPPING_YUAN_OPTIONS)[number];
export type InternationalShippingNgn = (typeof INTERNATIONAL_SHIPPING_NGN_OPTIONS)[number];
export type InternationalShippingUsd = (typeof INTERNATIONAL_SHIPPING_USD_OPTIONS)[number];
export type LocalDeliveryNgn = (typeof LOCAL_DELIVERY_NGN_OPTIONS)[number];
export type InternationalShippingCurrency = "ngn" | "usd";

export interface ProductShippingCosts {
  chinaShippingYuan: ChinaShippingYuan;
  internationalShippingCurrency: InternationalShippingCurrency;
  internationalShippingNgn: InternationalShippingNgn;
  internationalShippingUsd: InternationalShippingUsd;
  localDeliveryNgn: LocalDeliveryNgn;
}

export const DEFAULT_PRODUCT_SHIPPING: ProductShippingCosts = {
  chinaShippingYuan: DEFAULT_CHINA_SHIPPING_YUAN,
  internationalShippingCurrency: "ngn",
  internationalShippingNgn: DEFAULT_INTERNATIONAL_SHIPPING_NGN,
  internationalShippingUsd: DEFAULT_INTERNATIONAL_SHIPPING_USD,
  localDeliveryNgn: DEFAULT_LOCAL_DELIVERY_NGN,
};

export function isLaptopProductName(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes("macbook") || normalized.includes("laptop");
}

export function defaultShippingForProductName(name: string): ProductShippingCosts {
  if (isLaptopProductName(name)) {
    return {
      chinaShippingYuan: LAPTOP_CHINA_SHIPPING_YUAN,
      internationalShippingCurrency: "ngn",
      internationalShippingNgn: LAPTOP_INTERNATIONAL_SHIPPING_NGN,
      internationalShippingUsd: LAPTOP_INTERNATIONAL_SHIPPING_USD,
      localDeliveryNgn: DEFAULT_LOCAL_DELIVERY_NGN,
    };
  }
  return DEFAULT_PRODUCT_SHIPPING;
}

export function parseChinaShippingYuan(value: unknown): ChinaShippingYuan {
  const yuan = Number(value);
  if (!CHINA_SHIPPING_YUAN_OPTIONS.includes(yuan as ChinaShippingYuan)) {
    throw new Error("INVALID_CHINA_SHIPPING");
  }
  return yuan as ChinaShippingYuan;
}

export function parseInternationalShippingCurrency(value: unknown): InternationalShippingCurrency {
  const raw = String(value ?? "ngn").trim().toLowerCase();
  if (raw === "ngn" || raw === "usd") {
    return raw;
  }
  throw new Error("INVALID_INTERNATIONAL_SHIPPING_CURRENCY");
}

export function parseInternationalShippingNgn(value: unknown): InternationalShippingNgn {
  const ngn = Number(value);
  if (!INTERNATIONAL_SHIPPING_NGN_OPTIONS.includes(ngn as InternationalShippingNgn)) {
    throw new Error("INVALID_INTERNATIONAL_SHIPPING");
  }
  return ngn as InternationalShippingNgn;
}

export function parseInternationalShippingUsd(value: unknown): InternationalShippingUsd {
  const usd = Number(value);
  if (!INTERNATIONAL_SHIPPING_USD_OPTIONS.includes(usd as InternationalShippingUsd)) {
    throw new Error("INVALID_INTERNATIONAL_SHIPPING_USD");
  }
  return usd as InternationalShippingUsd;
}

export function parseLocalDeliveryNgn(value: unknown): LocalDeliveryNgn {
  const ngn = Number(value);
  if (!LOCAL_DELIVERY_NGN_OPTIONS.includes(ngn as LocalDeliveryNgn)) {
    throw new Error("INVALID_LOCAL_DELIVERY");
  }
  return ngn as LocalDeliveryNgn;
}

export function parseProductShippingCosts(
  input: {
    chinaShippingYuan?: unknown;
    internationalShippingCurrency?: unknown;
    internationalShippingNgn?: unknown;
    internationalShippingUsd?: unknown;
    localDeliveryNgn?: unknown;
  },
  productName: string
): ProductShippingCosts {
  const defaults = defaultShippingForProductName(productName);

  return {
    chinaShippingYuan: parseChinaShippingYuan(input.chinaShippingYuan ?? defaults.chinaShippingYuan),
    internationalShippingCurrency: parseInternationalShippingCurrency(
      input.internationalShippingCurrency ?? defaults.internationalShippingCurrency
    ),
    internationalShippingNgn: parseInternationalShippingNgn(
      input.internationalShippingNgn ?? defaults.internationalShippingNgn
    ),
    internationalShippingUsd: parseInternationalShippingUsd(
      input.internationalShippingUsd ?? defaults.internationalShippingUsd
    ),
    localDeliveryNgn: parseLocalDeliveryNgn(input.localDeliveryNgn ?? defaults.localDeliveryNgn),
  };
}

export function productShippingFromRow(row: {
  china_shipping_yuan?: number | null;
  international_shipping_currency?: string | null;
  international_shipping_ngn?: number | null;
  international_shipping_usd?: number | null;
  local_delivery_ngn?: number | null;
  name?: string | null;
}): ProductShippingCosts {
  const fallback = row.name?.trim()
    ? defaultShippingForProductName(row.name)
    : DEFAULT_PRODUCT_SHIPPING;
  const china = row.china_shipping_yuan ?? fallback.chinaShippingYuan;
  const currency =
    row.international_shipping_currency?.trim().toLowerCase() === "usd" ? "usd" : "ngn";
  const internationalNgn = row.international_shipping_ngn ?? fallback.internationalShippingNgn;
  const internationalUsd = row.international_shipping_usd ?? fallback.internationalShippingUsd;
  const localDelivery = row.local_delivery_ngn ?? fallback.localDeliveryNgn;

  const chinaValid = CHINA_SHIPPING_YUAN_OPTIONS.includes(china as ChinaShippingYuan);
  const internationalNgnValid = INTERNATIONAL_SHIPPING_NGN_OPTIONS.includes(
    internationalNgn as InternationalShippingNgn
  );
  const internationalUsdValid = INTERNATIONAL_SHIPPING_USD_OPTIONS.includes(
    internationalUsd as InternationalShippingUsd
  );
  const localValid = LOCAL_DELIVERY_NGN_OPTIONS.includes(localDelivery as LocalDeliveryNgn);

  if (chinaValid && internationalNgnValid && internationalUsdValid && localValid) {
    return {
      chinaShippingYuan: china as ChinaShippingYuan,
      internationalShippingCurrency: currency,
      internationalShippingNgn: internationalNgn as InternationalShippingNgn,
      internationalShippingUsd: internationalUsd as InternationalShippingUsd,
      localDeliveryNgn: localDelivery as LocalDeliveryNgn,
    };
  }

  return fallback;
}

export function formatChinaShippingYuan(value: ChinaShippingYuan): string {
  return String(value);
}

export function formatInternationalShippingCurrency(
  value: InternationalShippingCurrency
): string {
  return value;
}

export function formatInternationalShippingNgn(value: InternationalShippingNgn): string {
  return String(value);
}

export function formatInternationalShippingUsd(value: InternationalShippingUsd): string {
  return String(value);
}

export function formatLocalDeliveryNgn(value: LocalDeliveryNgn): string {
  return String(value);
}

/** International shipping converted to NGN based on the selected currency. */
export function internationalShippingAmountNgn(
  shipping: Pick<
    ProductShippingCosts,
    "internationalShippingCurrency" | "internationalShippingNgn" | "internationalShippingUsd"
  >,
  usdToNaira: number
): number {
  if (shipping.internationalShippingCurrency === "usd") {
    return shipping.internationalShippingUsd * usdToNaira;
  }
  return shipping.internationalShippingNgn;
}

/** Total shipping in NGN: china shipping (yuan x rate) + international + local delivery. */
export function totalShippingNgn(
  shipping: ProductShippingCosts,
  yuanToNaira: number,
  usdToNaira: number
): number {
  return (
    shipping.chinaShippingYuan * yuanToNaira +
    internationalShippingAmountNgn(shipping, usdToNaira) +
    shipping.localDeliveryNgn
  );
}

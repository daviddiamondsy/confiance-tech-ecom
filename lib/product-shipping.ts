export const CHINA_SHIPPING_YUAN_OPTIONS = [0, 10, 30] as const;
export const INTERNATIONAL_SHIPPING_NGN_OPTIONS = [30_000, 40_000, 50_000] as const;

export const DEFAULT_CHINA_SHIPPING_YUAN = 10;
export const DEFAULT_INTERNATIONAL_SHIPPING_NGN = 30_000;
export const LAPTOP_CHINA_SHIPPING_YUAN = 30;
export const LAPTOP_INTERNATIONAL_SHIPPING_NGN = 50_000;

export type ChinaShippingYuan = (typeof CHINA_SHIPPING_YUAN_OPTIONS)[number];
export type InternationalShippingNgn = (typeof INTERNATIONAL_SHIPPING_NGN_OPTIONS)[number];

export interface ProductShippingCosts {
  chinaShippingYuan: ChinaShippingYuan;
  internationalShippingNgn: InternationalShippingNgn;
}

export const DEFAULT_PRODUCT_SHIPPING: ProductShippingCosts = {
  chinaShippingYuan: DEFAULT_CHINA_SHIPPING_YUAN,
  internationalShippingNgn: DEFAULT_INTERNATIONAL_SHIPPING_NGN,
};

export function isLaptopProductName(name: string): boolean {
  const normalized = name.toLowerCase();
  return normalized.includes("macbook") || normalized.includes("laptop");
}

export function defaultShippingForProductName(name: string): ProductShippingCosts {
  if (isLaptopProductName(name)) {
    return {
      chinaShippingYuan: LAPTOP_CHINA_SHIPPING_YUAN,
      internationalShippingNgn: LAPTOP_INTERNATIONAL_SHIPPING_NGN,
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

export function parseInternationalShippingNgn(value: unknown): InternationalShippingNgn {
  const ngn = Number(value);
  if (!INTERNATIONAL_SHIPPING_NGN_OPTIONS.includes(ngn as InternationalShippingNgn)) {
    throw new Error("INVALID_INTERNATIONAL_SHIPPING");
  }
  return ngn as InternationalShippingNgn;
}

export function productShippingFromRow(row: {
  china_shipping_yuan?: number | null;
  international_shipping_ngn?: number | null;
}): ProductShippingCosts {
  const china = row.china_shipping_yuan ?? DEFAULT_CHINA_SHIPPING_YUAN;
  const international = row.international_shipping_ngn ?? DEFAULT_INTERNATIONAL_SHIPPING_NGN;

  if (CHINA_SHIPPING_YUAN_OPTIONS.includes(china as ChinaShippingYuan)) {
    if (INTERNATIONAL_SHIPPING_NGN_OPTIONS.includes(international as InternationalShippingNgn)) {
      return {
        chinaShippingYuan: china as ChinaShippingYuan,
        internationalShippingNgn: international as InternationalShippingNgn,
      };
    }
  }

  return DEFAULT_PRODUCT_SHIPPING;
}

export function formatChinaShippingYuan(value: ChinaShippingYuan): string {
  return String(value);
}

export function formatInternationalShippingNgn(value: InternationalShippingNgn): string {
  return String(value);
}

/** Total shipping in NGN: china shipping (yuan × rate) + international shipping. */
export function totalShippingNgn(
  shipping: ProductShippingCosts,
  yuanToNaira: number
): number {
  return shipping.chinaShippingYuan * yuanToNaira + shipping.internationalShippingNgn;
}

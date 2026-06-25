/** Legacy seed metadata. Product pricing and filters are stored in Postgres. */
export const CATALOG_YUAN: Record<
  string,
  { yuan: number; storageYuan?: Record<string, number> }
> = {};

export const CATALOG_FILTERS: Record<string, string> = {};

export const DEFAULT_PRODUCT_COLORS: Record<string, string[]> = {};

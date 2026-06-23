/** Yuan cost per product (base) and per storage variant. */
export const CATALOG_YUAN: Record<
  string,
  { yuan: number; storageYuan?: Record<string, number> }
> = {
  "6": { yuan: 1700 },
  "7": { yuan: 3000 },
  "8": { yuan: 4600, storageYuan: { "256GB": 4600, "512GB": 5100 } },
  "9": { yuan: 2000, storageYuan: { "256GB": 2000, "512GB": 2200 } },
  "10": { yuan: 3500, storageYuan: { "256GB": 3500, "512GB": 3900 } },
  "11": { yuan: 10500 },
  "12": { yuan: 3000 },
  "13": { yuan: 2550 },
};

/** Catalog filter tag slug per product id. */
export const CATALOG_FILTERS: Record<string, string> = {
  "6": "iphone",
  "7": "iphone",
  "8": "iphone",
  "9": "iphone",
  "10": "iphone",
  "11": "macbook",
  "12": "iphone",
  "13": "iphone",
};

/** Default colors shown on product pages (display only). */
export const DEFAULT_PRODUCT_COLORS: Record<string, string[]> = {
  "6": ["Midnight", "Starlight", "Blue", "Pink", "Red"],
  "7": ["Space Black", "Silver", "Gold", "Deep Purple"],
  "8": ["Natural Titanium", "Blue Titanium", "White Titanium", "Black Titanium"],
  "9": ["Graphite", "Silver", "Gold", "Pacific Blue"],
  "10": ["Space Black", "Silver", "Gold", "Deep Purple"],
  "11": ["Space Black", "Silver"],
  "12": ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"],
  "13": ["Graphite", "Gold", "Silver", "Sierra Blue", "Alpine Green"],
};

/** Yuan cost per product (base) and per storage variant. */
export const CATALOG_YUAN: Record<
  string,
  { yuan: number; storageYuan?: Record<string, number> }
> = {
  "6": { yuan: 1500, storageYuan: { "128GB": 1500, "256GB": 1700 } },
  "7": { yuan: 3000 },
  "8": { yuan: 4600, storageYuan: { "256GB": 4600, "512GB": 5100 } },
  "9": { yuan: 2000, storageYuan: { "256GB": 2000, "512GB": 2200 } },
  "10": { yuan: 3500, storageYuan: { "256GB": 3500, "512GB": 3900 } },
  "11": { yuan: 10500 },
  "12": { yuan: 2550, storageYuan: { "256GB": 2550, "512GB": 3000 } },
  "13": { yuan: 4200, storageYuan: { "256GB": 4200, "512GB": 4400 } },
  "14": { yuan: 5300, storageYuan: { "256GB": 5300, "512GB": 5400 } },
};

/** Catalog filter tag slug per product id (New vs Clean). */
export const CATALOG_FILTERS: Record<string, string> = {
  "6": "clean",
  "7": "clean",
  "8": "clean",
  "9": "clean",
  "10": "clean",
  "11": "new",
  "12": "clean",
  "13": "clean",
  "14": "clean",
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
  "13": ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"],
  "14": ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Silver"],
};

import type { Product } from "@/lib/product-utils";
export type { Product, StorageOption } from "@/lib/product-utils";
export { getSelectedVariant, getDisplaySpecs } from "@/lib/product-utils";
export { priceFromYuan, sellingMarkupForYuan, toCharmPrice } from "@/lib/pricing";

import { buildCatalogProducts } from "@/lib/catalog-seed";
import { DEFAULT_PRODUCT_COLORS } from "@/lib/catalog-yuan";
import { isPostgresConfigured } from "@/lib/db/client";
import {
  fetchProductByIdFromDb,
  fetchProductsFromDb,
} from "@/lib/db/products-repository";

const staticProducts = buildCatalogProducts().map((product) => ({
  ...product,
  colorOptions: DEFAULT_PRODUCT_COLORS[product.id],
}));

/** @deprecated Use getProducts() for server components. */
export const products: Product[] = staticProducts;

export async function getProducts(): Promise<Product[]> {
  if (!isPostgresConfigured()) {
    return staticProducts;
  }

  try {
    const rows = await fetchProductsFromDb();
    return rows.length > 0 ? rows : staticProducts;
  } catch (error) {
    console.error("[products] Postgres fetch failed, using static catalog", error);
    return staticProducts;
  }
}

export async function getProductById(id: string): Promise<Product | undefined> {
  if (!isPostgresConfigured()) {
    return staticProducts.find((product) => product.id === id);
  }

  try {
    const product = await fetchProductByIdFromDb(id);
    if (product) return product;
    return staticProducts.find((item) => item.id === id);
  } catch (error) {
    console.error("[products] Postgres fetch failed, using static catalog", error);
    return staticProducts.find((product) => product.id === id);
  }
}

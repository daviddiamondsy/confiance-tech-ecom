import { buildCatalogProducts } from "@/lib/catalog-seed";
import { upsertCatalogProducts } from "@/lib/db/products-repository";

export async function seedCatalog(): Promise<number> {
  const products = buildCatalogProducts();
  await upsertCatalogProducts(products);
  return products.length;
}

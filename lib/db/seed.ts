import { DEFAULT_PRODUCT_COLORS, CATALOG_YUAN } from "@/lib/catalog-yuan";
import { buildCatalogProducts } from "@/lib/catalog-seed";
import { seedDefaultColors } from "@/lib/db/colors-repository";
import {
  upsertCatalogProducts,
  type SeedProductInput,
} from "@/lib/db/products-repository";

export async function seedCatalog(): Promise<number> {
  const catalog = buildCatalogProducts();

  const products: SeedProductInput[] = catalog.map((product) => {
    const yuanMeta = CATALOG_YUAN[product.id];
    return {
      ...product,
      yuanCost: yuanMeta?.yuan,
      storageYuan: yuanMeta?.storageYuan,
    };
  });

  await upsertCatalogProducts(products);

  for (const product of products) {
    const colors = DEFAULT_PRODUCT_COLORS[product.id] ?? [];
    if (colors.length > 0) {
      await seedDefaultColors(product.id, colors);
    }
  }

  return products.length;
}

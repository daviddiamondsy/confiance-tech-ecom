import { config } from "dotenv";
import { isPostgresConfigured } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { seedDefaultColors } from "@/lib/db/colors-repository";
import { seedDefaultProductFilters } from "@/lib/db/filters-repository";
import { buildIphone17CatalogProducts } from "@/lib/iphone-17-catalog";
import { CATALOG_FILTERS, CATALOG_YUAN, DEFAULT_PRODUCT_COLORS } from "@/lib/catalog-yuan";
import { DEFAULT_PRODUCT_FILTER_TAGS } from "@/lib/product-filter-tags";
import {
  upsertCatalogProducts,
  type SeedProductInput,
} from "@/lib/db/products-repository";

config({ path: ".env.local" });

async function main() {
  if (!isPostgresConfigured()) {
    console.error(
      "No database URL found. Set POSTGRES_URL or DATABASE_URL in .env.local (or pass inline for production)."
    );
    process.exit(1);
  }

  await runMigrations();
  await seedDefaultProductFilters(DEFAULT_PRODUCT_FILTER_TAGS);

  const catalog = buildIphone17CatalogProducts();
  const products: SeedProductInput[] = catalog.map((product) => {
    const yuanMeta = CATALOG_YUAN[product.id];
    return {
      ...product,
      filterSlug: CATALOG_FILTERS[product.id],
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

  console.log(`Upserted ${products.length} iPhone 17 products:`);
  for (const product of products) {
    console.log(`  - ${product.name} (${product.id}) @ ${product.price.toLocaleString()} NGN`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

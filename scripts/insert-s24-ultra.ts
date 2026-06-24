import { config } from "dotenv";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { createProductFilter, ensureProductFiltersSchema } from "@/lib/db/filters-repository";
import { createAdminProduct } from "@/lib/db/products-repository";

config({ path: ".env.local" });

const S24_ULTRA = {
  name: "Samsung Galaxy S24 Ultra",
  image: "/product-images/galaxy-s24.png",
  description:
    "Samsung Galaxy S24 Ultra with a 6.8-inch QHD+ Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, " +
    "200MP adaptive camera, and built-in S Pen. Clean condition. Inspected, tested, and certified.",
  filterSlug: "samsung",
  badge: "Popular",
  storageVariants: [
    { storage: "256GB", yuan: 4200 },
    { storage: "512GB", yuan: 4400 },
  ],
  colors: ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"],
  features: [
    "6.8-inch QHD+ Dynamic AMOLED 2X Display",
    "Snapdragon 8 Gen 3 for Galaxy",
    "200MP Adaptive Camera with AI zoom",
    "Built-in S Pen",
    "Titanium frame",
    "Galaxy AI features",
    "Clean condition with accessories included",
    "Inspected, tested, and certified",
  ],
};

async function main() {
  if (!isPostgresConfigured()) {
    console.error(
      "No database URL found. Add POSTGRES_URL to .env.local (copy from Vercel → Storage → Neon)."
    );
    process.exit(1);
  }

  await ensureCatalogSchema();
  await ensureProductFiltersSchema();

  try {
    await createProductFilter({ slug: "samsung", label: "Samsung" });
  } catch {
    // already exists
  }

  const created = await createAdminProduct(S24_ULTRA);
  console.log(
    `Inserted ${created.name} (id ${created.id}) at ₦${created.price.toLocaleString()} with 256GB/512GB variants.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

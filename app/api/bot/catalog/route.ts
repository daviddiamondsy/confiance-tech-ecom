import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";
import type { Product } from "@/lib/product-utils";

function deriveBrand(name: string): "apple" | "samsung" | "other" {
  const lower = name.toLowerCase();
  if (/\b(iphone|ipad|macbook|apple)\b/.test(lower)) return "apple";
  if (/\b(samsung|galaxy)\b/.test(lower)) return "samsung";
  return "other";
}

function minPriceFor(product: Product): number {
  if (product.storageOptions?.length) {
    return Math.min(...product.storageOptions.map((o) => o.price));
  }
  return product.price;
}

/** Public catalog summary for WhatsApp bot and other integrations. */
export async function GET() {
  const products = await getProducts();
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "https://confiance-tech.vercel.app";

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      minPrice: minPriceFor(p),
      brand: deriveBrand(p.name),
      features: (p.features ?? []).slice(0, 5),
      filterSlug: p.filterSlug,
      filterSlugs: p.filterSlugs ?? [],
      productUrl: `${baseUrl}/products/${p.slug}`,
      storageOptions: p.storageOptions?.map((o) => ({
        storage: o.storage,
        price: o.price,
      })),
      colorOptions: p.colorOptions ?? [],
    })),
  });
}

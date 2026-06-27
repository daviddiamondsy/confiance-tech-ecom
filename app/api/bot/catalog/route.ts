import { NextResponse } from "next/server";
import { getProducts } from "@/lib/products";

/** Public catalog summary for WhatsApp bot and other integrations. */
export async function GET() {
  const products = await getProducts();

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      storageOptions: p.storageOptions?.map((o) => ({
        storage: o.storage,
        price: o.price,
      })),
      colorOptions: p.colorOptions ?? [],
    })),
  });
}

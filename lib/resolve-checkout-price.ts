import { getProductById, getProductBySlug } from "@/lib/products";

export interface ResolvedCheckoutPrice {
  price: number;
  productId: string;
  productSlug: string;
  productName: string;
}

function resolveVariantPrice(
  product: Awaited<ReturnType<typeof getProductBySlug>>,
  storage?: string
): number | null {
  if (!product) return null;

  if (storage && product.storageOptions?.length) {
    const normalized = storage.trim().toLowerCase();
    const option = product.storageOptions.find(
      (entry) => entry.storage.trim().toLowerCase() === normalized
    );
    if (option) return option.price;
  }

  if (product.storageOptions?.length === 1) {
    return product.storageOptions[0].price;
  }

  return product.price;
}

/** Authoritative selling price from catalog (DB or static dev seed) + current pricing config. */
export async function resolveCheckoutPrice(input: {
  productId?: string;
  productSlug?: string;
  storage?: string;
}): Promise<ResolvedCheckoutPrice | null> {
  const byId = input.productId ? await getProductById(input.productId) : undefined;
  const bySlug = input.productSlug ? await getProductBySlug(input.productSlug) : undefined;

  // Prefer productId: bot and checkout forms select by id; slug can be stale or duplicated in DB.
  let product = byId ?? bySlug;

  if (byId && bySlug && byId.id !== bySlug.id) {
    console.warn("[resolveCheckoutPrice] productId/slug mismatch; using productId", {
      productId: byId.id,
      productIdName: byId.name,
      productSlug: input.productSlug,
      slugResolvedId: bySlug.id,
      slugResolvedName: bySlug.name,
    });
    product = byId;
  }

  const price = resolveVariantPrice(product, input.storage);
  if (!product || price == null) return null;

  return {
    price,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
  };
}

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

/** Authoritative selling price from catalog DB + current pricing config. */
export async function resolveCheckoutPrice(input: {
  productId?: string;
  productSlug?: string;
  storage?: string;
}): Promise<ResolvedCheckoutPrice | null> {
  const product =
    (input.productSlug ? await getProductBySlug(input.productSlug) : undefined) ??
    (input.productId ? await getProductById(input.productId) : undefined);

  const price = resolveVariantPrice(product, input.storage);
  if (!product || price == null) return null;

  return {
    price,
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
  };
}

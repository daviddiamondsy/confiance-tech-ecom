import type { PriceMode } from "@/lib/variant-dimension";

/**
 * Door delivery fee added at checkout when local delivery is not already in the
 * catalog price (e.g. direct-naira accessories).
 */
export const STOREFRONT_DOOR_DELIVERY_FEE_NGN = 10_000;

export interface StorefrontDeliveryPricing {
  priceMode?: PriceMode;
  localDeliveryNgn?: number;
}

/** Local delivery already included in catalog price (calculated products only). */
export function bundledLocalDeliveryNgn(
  product: StorefrontDeliveryPricing
): number {
  if (product.priceMode === "direct_ngn") return 0;
  if (product.localDeliveryNgn === 0) return 0;
  return product.localDeliveryNgn ?? STOREFRONT_DOOR_DELIVERY_FEE_NGN;
}

export function storefrontCatalogIncludesLocalDelivery(
  product: StorefrontDeliveryPricing
): boolean {
  return bundledLocalDeliveryNgn(product) > 0;
}

/**
 * Display price for product listing and detail pages.
 * Strips bundled local delivery only when that amount is in the catalog price.
 */
export function storefrontDisplayPrice(
  catalogPrice: number,
  product: StorefrontDeliveryPricing
): number {
  return catalogPrice - bundledLocalDeliveryNgn(product);
}

/** Door delivery amount shown on the checkout line (and added to total when selected). */
export function storefrontDoorDeliveryLineFee(
  product: StorefrontDeliveryPricing,
  doorDelivery: boolean
): number {
  if (!doorDelivery) return 0;
  const bundled = bundledLocalDeliveryNgn(product);
  if (bundled > 0) return bundled;
  return STOREFRONT_DOOR_DELIVERY_FEE_NGN;
}

/**
 * Extra door fee to send to create-holdam-deal.
 * Zero when local delivery is already inside the catalog price.
 */
export function storefrontCheckoutDoorFeeNgn(
  product: StorefrontDeliveryPricing,
  doorDelivery: boolean
): number {
  if (!doorDelivery) return 0;
  if (bundledLocalDeliveryNgn(product) > 0) return 0;
  return STOREFRONT_DOOR_DELIVERY_FEE_NGN;
}

export function storefrontOrderTotal(
  catalogPrice: number,
  product: StorefrontDeliveryPricing,
  doorDelivery: boolean
): number {
  return (
    storefrontDisplayPrice(catalogPrice, product) +
    storefrontDoorDeliveryLineFee(product, doorDelivery)
  );
}

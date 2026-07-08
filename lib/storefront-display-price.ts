/**
 * Door delivery fee shown as a separate line item on the order page.
 *
 * Product listing and detail pages display (catalog price - this fee) so the
 * initial price looks more competitive. The full catalog price is always
 * charged at checkout because it already includes local delivery in its cost
 * structure.
 */
export const STOREFRONT_DOOR_DELIVERY_FEE_NGN = 10_000;

/**
 * Display price for product listing and detail pages.
 * Subtracts the door delivery fee so the advertised price appears lower.
 * Door delivery is presented as a separate add-on on the order page.
 *
 * Because catalog prices end in ...999 or ...9999, subtracting 10,000 always
 * produces another charm price (e.g. 149,999 - 10,000 = 139,999).
 */
export function storefrontDisplayPrice(catalogPrice: number): number {
  return Math.max(0, catalogPrice - STOREFRONT_DOOR_DELIVERY_FEE_NGN);
}

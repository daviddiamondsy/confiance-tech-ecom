const STORE_ORDER_REFERENCE_PREFIX = "CT";

/** Buyer-facing order reference (e.g. CT-42). */
export function formatStoreOrderReference(orderId: number): string {
  return `${STORE_ORDER_REFERENCE_PREFIX}-${orderId}`;
}

/** Parse CT-42 or legacy bare numeric id from bot input. */
export function parseStoreOrderReference(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const prefixed = trimmed.match(/^CT-(\d+)$/i);
  if (prefixed) {
    const id = Number(prefixed[1]);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  if (/^\d+$/.test(trimmed)) {
    const id = Number(trimmed);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  return null;
}

const LAST_ORDER_PHONE_KEY = "confiance_last_order_phone";

/** Remember the buyer phone from the last storefront order (localStorage). */
export function persistLastOrderPhone(phone: string): void {
  if (typeof window === "undefined") return;
  const trimmed = phone.trim();
  if (!trimmed) return;
  localStorage.setItem(LAST_ORDER_PHONE_KEY, trimmed);
}

export function readLastOrderPhone(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(LAST_ORDER_PHONE_KEY) || "";
}

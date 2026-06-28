import type { OrderFulfillmentStatus } from "@/lib/orders/types";

const TERMINAL_STATUSES: OrderFulfillmentStatus[] = ["disputed", "cancelled", "refunded"];

export function mapWebhookEventToStatus(eventName: string): OrderFulfillmentStatus | null {
  switch (eventName) {
    case "deal.funded":
      return "secured";
    case "deal.released":
      return "complete";
    case "deal.disputed":
      return "disputed";
    case "deal.cancelled":
      return "cancelled";
    case "deal.refunded":
      return "refunded";
    default:
      return null;
  }
}

/** Apply Holdam webhook status without downgrading ops progress (e.g. shipped). */
export function resolveStatusAfterWebhook(
  current: OrderFulfillmentStatus,
  fromWebhook: OrderFulfillmentStatus
): OrderFulfillmentStatus {
  if (TERMINAL_STATUSES.includes(fromWebhook)) {
    return fromWebhook;
  }

  if (fromWebhook === "complete") {
    return "complete";
  }

  if (fromWebhook === "secured") {
    if (current === "pending_payment") {
      return "secured";
    }
    return current;
  }

  return current;
}

export function isValidManualStatus(status: OrderFulfillmentStatus): boolean {
  return status !== "disputed";
}

export function statusLabel(status: OrderFulfillmentStatus): string {
  switch (status) {
    case "pending_payment":
      return "Pending payment";
    case "secured":
      return "Payment secured";
    case "shipped":
      return "Shipped";
    case "complete":
      return "Complete";
    case "disputed":
      return "Disputed";
    case "cancelled":
      return "Cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export function statusBadgeClass(status: OrderFulfillmentStatus): string {
  switch (status) {
    case "pending_payment":
      return "bg-amber-50 text-amber-800 border-amber-200";
    case "secured":
      return "bg-sky-50 text-sky-800 border-sky-200";
    case "shipped":
      return "bg-violet-50 text-violet-800 border-violet-200";
    case "complete":
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    case "disputed":
      return "bg-orange-50 text-orange-800 border-orange-200";
    case "cancelled":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "refunded":
      return "bg-red-50 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

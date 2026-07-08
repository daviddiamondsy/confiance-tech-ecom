import type { OrderStatusSnapshot } from "@/lib/bot/order-status-types";
import {
  getStoreOrderByDealId,
  getStoreOrderById,
  listStoreOrdersByCustomerPhone,
} from "@/lib/db/orders-repository";
import type { OrderFulfillmentStatus, StoreOrderRecord } from "@/lib/orders/types";
import { formatStoreOrderReference, parseStoreOrderReference } from "@/lib/orders/reference-id";
import { isCompleteNigerianPhone, normalizeNigerianPhone } from "@/lib/referral/phone";

function coerceIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

function mapStatusCode(status: OrderFulfillmentStatus): string {
  switch (status) {
    case "pending_payment":
      return "payment_pending";
    case "secured":
      return "escrow_secured";
    case "shipped":
      return "dispatched";
    case "complete":
      return "delivered";
    case "disputed":
      return "disputed";
    case "cancelled":
    case "refunded":
      return "closed";
    default:
      return "unknown";
  }
}

function mapBuyerStatus(status: OrderFulfillmentStatus, row: StoreOrderRecord): string {
  switch (status) {
    case "pending_payment":
      return "Order received — our team will contact you about payment";
    case "secured":
      return "Payment confirmed — preparing your order";
    case "shipped": {
      const courier = row.shipping_courier?.trim();
      const tracking = row.shipping_tracking?.trim();
      if (courier && tracking) {
        return `Shipped via ${courier} (tracking: ${tracking})`;
      }
      return "Shipped";
    }
    case "complete":
      return "Delivered";
    case "disputed":
      return "Dispute open";
    case "cancelled":
      return "Order cancelled";
    case "refunded":
      return "Refunded";
    default:
      return status;
  }
}

export function storeOrderToBotSnapshot(row: StoreOrderRecord): OrderStatusSnapshot {
  const referenceId = row.deal_id?.trim() || formatStoreOrderReference(row.id);
  const fulfillmentStatus = row.fulfillment_status;
  const shippedAt = coerceIso(row.shipped_at);

  return {
    referenceId,
    status: mapBuyerStatus(fulfillmentStatus, row),
    statusCode: mapStatusCode(fulfillmentStatus),
    escrowSecured: fulfillmentStatus !== "pending_payment" && Boolean(row.deal_id),
    dispatchEta:
      fulfillmentStatus === "secured" && !shippedAt
        ? "Our team will confirm dispatch timing when they contact you"
        : undefined,
    productName: row.product_name,
    lastUpdatedAt: coerceIso(row.updated_at) ?? undefined,
    isDeliveryOverdue: false,
  };
}

function phonesMatch(storedPhone: string, buyerPhone?: string): boolean {
  if (!buyerPhone?.trim()) return true;
  const normalizedBuyer = normalizeNigerianPhone(buyerPhone);
  if (!normalizedBuyer) return false;
  const normalizedStored = normalizeNigerianPhone(storedPhone) || storedPhone.trim();
  return normalizedStored === normalizedBuyer;
}

async function resolveOrderByReference(referenceId: string): Promise<StoreOrderRecord | null> {
  const storeOrderId = parseStoreOrderReference(referenceId);
  if (storeOrderId != null) {
    return getStoreOrderById(storeOrderId);
  }
  return getStoreOrderByDealId(referenceId);
}

export async function lookupBotOrderStatus(params: {
  referenceId: string;
  buyerPhone?: string;
}): Promise<
  | { ok: true; snapshot: OrderStatusSnapshot }
  | { ok: false; error: "not_found" | "phone_mismatch" }
> {
  const referenceId = params.referenceId.trim();
  if (!referenceId) {
    return { ok: false, error: "not_found" };
  }

  const row = await resolveOrderByReference(referenceId);
  if (!row) {
    return { ok: false, error: "not_found" };
  }

  if (!phonesMatch(row.customer_phone, params.buyerPhone)) {
    return { ok: false, error: "phone_mismatch" };
  }

  return { ok: true, snapshot: storeOrderToBotSnapshot(row) };
}

export async function listBotOrdersByPhone(params: {
  buyerPhone: string;
  limit?: number;
}): Promise<OrderStatusSnapshot[]> {
  const buyerPhone = params.buyerPhone.trim();
  if (!isCompleteNigerianPhone(buyerPhone)) {
    return [];
  }

  const limit = Math.min(Math.max(params.limit ?? 3, 1), 10);
  const rows = await listStoreOrdersByCustomerPhone(buyerPhone, limit);
  return rows.map(storeOrderToBotSnapshot);
}

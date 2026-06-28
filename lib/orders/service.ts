import {
  getStoreOrderByDealId,
  getStoreOrderById,
  insertHoldamOrder,
  insertManualOrder,
  listStoreOrders,
  patchStoreOrder,
  updateStoreOrderFromWebhook,
} from "@/lib/db/orders-repository";
import { sendOrderEmail } from "@/lib/order-email";
import { ensureOrdersReady } from "@/lib/orders/db-ready";
import {
  isValidManualStatus,
  mapWebhookEventToStatus,
  resolveStatusAfterWebhook,
} from "@/lib/orders/status";
import type {
  AdminOrderRow,
  CreateHoldamOrderParams,
  CreateManualOrderParams,
  OrderFulfillmentStatus,
  StoreOrderRecord,
  UpdateOrderParams,
} from "@/lib/orders/types";
import { HOLDAM_OPS_STATUSES } from "@/lib/orders/types";
import { isCompleteNigerianPhone } from "@/lib/referral/phone";

function merchantDealUrl(dealId: string | null): string | null {
  if (!dealId) return null;
  const base =
    process.env.NEXT_PUBLIC_MERCHANT_DASHBOARD_URL?.trim().replace(/\/$/, "") ||
    "http://localhost:3003";
  return `${base}/merchant/deals?search=${encodeURIComponent(dealId)}`;
}

function coerceIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export function toAdminOrderRow(row: StoreOrderRecord): AdminOrderRow {
  return {
    id: row.id,
    dealId: row.deal_id,
    source: row.source,
    fulfillmentStatus: row.fulfillment_status,
    productId: row.product_id,
    productName: row.product_name,
    productPriceNgn: row.product_price_ngn,
    productStorage: row.product_storage,
    productColor: row.product_color,
    catalogPriceNgn: row.catalog_price_ngn,
    checkoutAmountNgn: row.checkout_amount_ngn,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address,
    customerState: row.customer_state,
    referralCode: row.referral_code,
    refereeDiscountNgn: row.referee_discount_ngn,
    storeCreditAppliedNgn: row.store_credit_applied_ngn,
    notes: row.notes,
    adminNote: row.admin_note,
    holdamEvent: row.holdam_event,
    createdAt: coerceIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: coerceIso(row.updated_at) ?? new Date().toISOString(),
    securedAt: coerceIso(row.secured_at),
    completedAt: coerceIso(row.completed_at),
    merchantDealUrl: merchantDealUrl(row.deal_id),
  };
}

export async function recordHoldamOrder(params: CreateHoldamOrderParams): Promise<void> {
  await ensureOrdersReady();
  await insertHoldamOrder(params);
}

export async function processOrderWebhook(params: {
  eventName: string;
  dealId: string;
}): Promise<void> {
  const mapped = mapWebhookEventToStatus(params.eventName);
  if (!mapped) return;

  await ensureOrdersReady();

  const existing = await getStoreOrderByDealId(params.dealId);
  if (!existing) return;

  const nextStatus = resolveStatusAfterWebhook(existing.fulfillment_status, mapped);
  if (nextStatus === existing.fulfillment_status && existing.holdam_event === params.eventName) {
    return;
  }

  await updateStoreOrderFromWebhook({
    dealId: params.dealId,
    fulfillmentStatus: nextStatus,
    holdamEvent: params.eventName,
  });
}

export async function listAdminOrders(limit = 100): Promise<AdminOrderRow[]> {
  await ensureOrdersReady();
  const rows = await listStoreOrders(limit);
  return rows.map(toAdminOrderRow);
}

export async function createManualOrder(params: CreateManualOrderParams): Promise<AdminOrderRow> {
  if (!params.productName?.trim()) {
    throw new Error("Product name is required.");
  }
  if (!params.customerName?.trim()) {
    throw new Error("Customer name is required.");
  }
  if (!params.customerPhone?.trim()) {
    throw new Error("Customer phone is required.");
  }
  if (!isCompleteNigerianPhone(params.customerPhone)) {
    throw new Error("Enter a complete Nigerian mobile number.");
  }
  if (!params.customerAddress?.trim()) {
    throw new Error("Customer address is required.");
  }
  if (!params.customerState?.trim()) {
    throw new Error("Customer state is required.");
  }

  const status = params.fulfillmentStatus ?? "pending_payment";
  if (!isValidManualStatus(status)) {
    throw new Error("Invalid status for a manual order.");
  }

  if (
    params.productPriceNgn !== undefined &&
    (!Number.isFinite(params.productPriceNgn) || params.productPriceNgn <= 0)
  ) {
    throw new Error("Product price must be a positive number.");
  }

  await ensureOrdersReady();
  const row = await insertManualOrder(params);

  if (params.sendNotificationEmail) {
    const paymentStatus =
      status === "secured" || status === "shipped" || status === "complete" ? "paid" : "pending";

    try {
      await sendOrderEmail({
        productName: params.productName,
        productPrice: params.productPriceNgn,
        productStorage: params.productStorage,
        productColor: params.productColor,
        customerName: params.customerName,
        customerPhone: params.customerPhone,
        customerAddress: params.customerAddress,
        customerState: params.customerState,
        paymentStatus,
      });
    } catch (error) {
      console.error("[orders] manual order notification email failed", error);
    }
  }

  return toAdminOrderRow(row);
}

export async function updateAdminOrder(id: number, params: UpdateOrderParams): Promise<AdminOrderRow> {
  await ensureOrdersReady();

  const existing = await getStoreOrderById(id);
  if (!existing) {
    throw new Error("Order not found.");
  }

  if (!params.fulfillmentStatus && params.adminNote === undefined) {
    throw new Error("No changes to save.");
  }

  if (params.fulfillmentStatus) {
    if (existing.source === "manual") {
      if (!isValidManualStatus(params.fulfillmentStatus)) {
        throw new Error("Invalid status for a manual order.");
      }
    } else if (!HOLDAM_OPS_STATUSES.includes(params.fulfillmentStatus)) {
      throw new Error(
        "Holdam checkout orders can only be marked shipped from admin. Payment status updates from webhooks."
      );
    } else if (
      params.fulfillmentStatus === "shipped" &&
      !["secured", "shipped", "complete"].includes(existing.fulfillment_status)
    ) {
      throw new Error("Mark payment secured before shipping a Holdam order.");
    }
  }

  const updated = await patchStoreOrder({
    id,
    fulfillmentStatus: params.fulfillmentStatus,
    adminNote: params.adminNote,
  });

  if (!updated) {
    throw new Error("Order not found.");
  }

  return toAdminOrderRow(updated);
}

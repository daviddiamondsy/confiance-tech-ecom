export type OrderSource = "website" | "manual" | "chatbot";

export const ORDER_SOURCES: OrderSource[] = ["website", "manual", "chatbot"];

/** Legacy rows may still store holdam until schema migration runs. */
export type StoredOrderSource = OrderSource | "holdam";

export function normalizeOrderSource(source: string): OrderSource {
  if (source === "holdam") return "website";
  if (source === "website" || source === "manual" || source === "chatbot") {
    return source;
  }
  return "website";
}

export function sourceLabel(source: StoredOrderSource): string {
  switch (normalizeOrderSource(source)) {
    case "website":
      return "Website";
    case "manual":
      return "Manual";
    case "chatbot":
      return "Chatbot";
    default:
      return "Website";
  }
}

export type OrderFulfillmentStatus =
  | "pending_payment"
  | "secured"
  | "shipped"
  | "complete"
  | "disputed"
  | "cancelled"
  | "refunded";

export const ORDER_FULFILLMENT_STATUSES: OrderFulfillmentStatus[] = [
  "pending_payment",
  "secured",
  "shipped",
  "complete",
  "disputed",
  "cancelled",
  "refunded",
];

/** Statuses ops can set from the admin orders panel. */
export const ADMIN_EDITABLE_ORDER_STATUSES: OrderFulfillmentStatus[] = ORDER_FULFILLMENT_STATUSES;

/** @deprecated Use ADMIN_EDITABLE_ORDER_STATUSES */
export const MANUAL_ORDER_STATUSES = ADMIN_EDITABLE_ORDER_STATUSES;

export interface StoreOrderRecord {
  id: number;
  deal_id: string | null;
  source: OrderSource;
  fulfillment_status: OrderFulfillmentStatus;
  product_id: string | null;
  product_name: string;
  product_price_ngn: number | null;
  product_storage: string | null;
  product_color: string | null;
  catalog_price_ngn: number | null;
  checkout_amount_ngn: number | null;
  customer_name: string;
  customer_phone: string;
  customer_address: string;
  customer_state: string;
  referral_code: string | null;
  referee_discount_ngn: number;
  store_credit_applied_ngn: number;
  notes: string | null;
  admin_note: string | null;
  holdam_event: string | null;
  holdam_escrow_id: string | null;
  created_at: Date | string;
  updated_at: Date | string;
  secured_at: Date | string | null;
  completed_at: Date | string | null;
}

export interface AdminOrderRow {
  id: number;
  dealId: string | null;
  source: OrderSource;
  fulfillmentStatus: OrderFulfillmentStatus;
  productId: string | null;
  productName: string;
  productPriceNgn: number | null;
  productStorage: string | null;
  productColor: string | null;
  catalogPriceNgn: number | null;
  checkoutAmountNgn: number | null;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerState: string;
  referralCode: string | null;
  refereeDiscountNgn: number;
  storeCreditAppliedNgn: number;
  notes: string | null;
  adminNote: string | null;
  holdamEvent: string | null;
  createdAt: string;
  updatedAt: string;
  securedAt: string | null;
  completedAt: string | null;
  merchantDealUrl: string | null;
}

export interface CreateHoldamOrderParams {
  dealId: string;
  /** Checkout channel; defaults to website. */
  source?: Extract<OrderSource, "website" | "chatbot">;
  productId?: string;
  productName: string;
  catalogPriceNgn: number;
  checkoutAmountNgn: number;
  productStorage?: string;
  productColor?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerState: string;
  referralCode?: string;
  refereeDiscountNgn?: number;
  storeCreditAppliedNgn?: number;
}

export interface CreateManualOrderParams {
  productName: string;
  productPriceNgn?: number;
  productStorage?: string;
  productColor?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerState: string;
  fulfillmentStatus?: OrderFulfillmentStatus;
  notes?: string;
  adminNote?: string;
  sendNotificationEmail?: boolean;
}

export interface UpdateOrderParams {
  fulfillmentStatus?: OrderFulfillmentStatus;
  adminNote?: string;
}

import { describe, expect, it } from "vitest";
import {
  applyTaskToggle,
  buildPaymentTimeline,
  canMarkShipped,
  orderNeedsFulfillmentAction,
  validateAdminStatusChange,
  validateTaskChange,
} from "@/lib/orders/fulfillment-workflow";
import type { AdminOrderRow } from "@/lib/orders/types";

function sampleOrder(overrides: Partial<AdminOrderRow> = {}): AdminOrderRow {
  return {
    id: 1,
    dealId: null,
    source: "website",
    fulfillmentStatus: "secured",
    productId: null,
    productName: "iPhone 16",
    productPriceNgn: 1_200_000,
    productStorage: "256GB",
    productColor: null,
    catalogPriceNgn: 1_200_000,
    checkoutAmountNgn: 1_200_000,
    customerName: "Ada",
    customerPhone: "08012345678",
    customerAddress: "Lekki",
    customerState: "Lagos",
    referralCode: null,
    refereeDiscountNgn: 0,
    storeCreditAppliedNgn: 0,
    notes: null,
    adminNote: null,
    holdamEvent: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    securedAt: "2026-07-01T11:00:00.000Z",
    completedAt: null,
    fulfillmentTasks: {},
    shippingCourier: null,
    shippingTracking: null,
    shippedAt: null,
    receiptSentAt: null,
    merchantDealUrl: null,
    ...overrides,
  };
}

describe("fulfillment-workflow", () => {
  it("blocks shipping before payment is secured", () => {
    const order = sampleOrder({ fulfillmentStatus: "pending_payment" });
    expect(validateAdminStatusChange(order, "shipped")).toMatch(/secured/i);
    expect(canMarkShipped(order)).toBe(false);
  });

  it("locks Holdam payment statuses when deal is linked", () => {
    const order = sampleOrder({ dealId: "deal_123", fulfillmentStatus: "pending_payment" });
    expect(validateAdminStatusChange(order, "secured")).toMatch(/Holdam webhooks/i);
    expect(validateAdminStatusChange(order, "complete")).toMatch(/Holdam webhooks/i);
    expect(validateAdminStatusChange(order, "shipped")).toMatch(/secured/i);

    const secured = sampleOrder({ dealId: "deal_123", fulfillmentStatus: "secured" });
    expect(validateAdminStatusChange(secured, "shipped")).toBeNull();
  });

  it("requires payment before pre-ship checklist", () => {
    const order = sampleOrder({ fulfillmentStatus: "pending_payment" });
    expect(validateTaskChange(order, "device_sourced", true)).toMatch(/payment/i);
  });

  it("requires delivery complete before receipt task", () => {
    const order = sampleOrder({ fulfillmentStatus: "shipped" });
    expect(validateTaskChange(order, "receipt_sent", true)).toMatch(/delivery is complete/i);
  });

  it("builds payment timeline with Holdam-locked payment steps", () => {
    const order = sampleOrder({
      dealId: "deal_123",
      fulfillmentStatus: "secured",
    });
    const timeline = buildPaymentTimeline(order);
    expect(timeline[1]?.locked).toBe(true);
    expect(timeline[1]?.done).toBe(true);
    expect(timeline[2]?.active).toBe(true);
  });

  it("flags secured orders with open pre-ship tasks", () => {
    const order = sampleOrder({
      fulfillmentStatus: "secured",
      fulfillmentTasks: applyTaskToggle({}, "customer_contacted", true),
    });
    expect(orderNeedsFulfillmentAction(order)).toBe(true);
  });
});

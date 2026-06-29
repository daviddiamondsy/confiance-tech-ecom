import { describe, expect, it } from "vitest";
import { parseHoldamWebhookData, resolveWebhookDealId } from "@/lib/holdam/webhook-payload";

// BDD: e-com.md › Feature: Merchant Webhook Handling › deal.funded secures order
describe("e-com.md › Merchant webhooks › deal id resolution", () => {
  it("reads dealId from API-PUBLIC payload shape", () => {
    const data = {
      dealId: "esc_abc123",
      deal: {
        id: "esc_abc123",
        title: "iPhone 14",
        amount: "500000",
        status: "funded",
      },
      buyer: { phone: "+2348012345678" },
    };

    expect(resolveWebhookDealId(data)).toBe("esc_abc123");
    expect(parseHoldamWebhookData(data)).toMatchObject({
      dealId: "esc_abc123",
      status: "funded",
      amount: "500000",
    });
  });

  it("reads id from SDK README flat payload shape", () => {
    const data = {
      id: "deal_abc123",
      status: "funded",
      amount: 500000,
      currency: "NGN",
      metadata: { orderId: "1042" },
    };

    expect(resolveWebhookDealId(data)).toBe("deal_abc123");
    expect(parseHoldamWebhookData(data)).toMatchObject({
      dealId: "deal_abc123",
      status: "funded",
      amount: 500000,
      metadata: { orderId: "1042" },
    });
  });

  it("prefers dealId over nested deal.id when both present", () => {
    const data = {
      dealId: "esc_primary",
      deal: { id: "esc_nested", status: "released" },
    };

    expect(resolveWebhookDealId(data)).toBe("esc_primary");
  });

  it("returns null when no deal identifier is present", () => {
    expect(resolveWebhookDealId(null)).toBeNull();
    expect(resolveWebhookDealId({ status: "funded" })).toBeNull();
    expect(parseHoldamWebhookData({})).toMatchObject({ dealId: null });
  });
});

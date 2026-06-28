import { describe, expect, it } from "vitest";
import {
  isValidManualStatus,
  mapWebhookEventToStatus,
  resolveStatusAfterWebhook,
  statusLabel,
} from "@/lib/orders/status";

// BDD: e-com.md › Feature: Order fulfillment (admin) › deal.funded secures Holdam order
describe("e-com.md › Order fulfillment › webhook status mapping", () => {
  it("maps deal.funded to secured", () => {
    expect(mapWebhookEventToStatus("deal.funded")).toBe("secured");
  });

  it("maps deal.released to complete", () => {
    expect(mapWebhookEventToStatus("deal.released")).toBe("complete");
  });

  it("maps terminal Holdam events", () => {
    expect(mapWebhookEventToStatus("deal.disputed")).toBe("disputed");
    expect(mapWebhookEventToStatus("deal.cancelled")).toBe("cancelled");
    expect(mapWebhookEventToStatus("deal.refunded")).toBe("refunded");
  });

  it("does not downgrade shipped when deal.funded arrives late", () => {
    expect(resolveStatusAfterWebhook("shipped", "secured")).toBe("shipped");
  });

  it("promotes pending payment to secured on deal.funded", () => {
    expect(resolveStatusAfterWebhook("pending_payment", "secured")).toBe("secured");
  });

  it("promotes shipped to complete on deal.released", () => {
    expect(resolveStatusAfterWebhook("shipped", "complete")).toBe("complete");
  });

  it("applies disputed over shipped", () => {
    expect(resolveStatusAfterWebhook("shipped", "disputed")).toBe("disputed");
  });
});

describe("e-com.md › Order fulfillment › manual order statuses", () => {
  it("allows manual ops statuses except disputed", () => {
    expect(isValidManualStatus("secured")).toBe(true);
    expect(isValidManualStatus("shipped")).toBe(true);
    expect(isValidManualStatus("refunded")).toBe(true);
    expect(isValidManualStatus("disputed")).toBe(false);
  });

  it("labels statuses for admin UI", () => {
    expect(statusLabel("pending_payment")).toBe("Pending payment");
    expect(statusLabel("shipped")).toBe("Shipped");
  });
});

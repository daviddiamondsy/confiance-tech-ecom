import { describe, expect, it } from "vitest";
import {
  isValidAdminOrderStatus,
  mapWebhookEventToStatus,
  resolveStatusAfterWebhook,
  statusLabel,
} from "@/lib/orders/status";
import { normalizeOrderSource, sourceLabel } from "@/lib/orders/types";

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

describe("e-com.md › Order fulfillment › admin order statuses", () => {
  it("allows all fulfillment statuses from admin", () => {
    expect(isValidAdminOrderStatus("secured")).toBe(true);
    expect(isValidAdminOrderStatus("shipped")).toBe(true);
    expect(isValidAdminOrderStatus("disputed")).toBe(true);
    expect(isValidAdminOrderStatus("refunded")).toBe(true);
  });

  it("labels statuses for admin UI", () => {
    expect(statusLabel("pending_payment")).toBe("Pending payment");
    expect(statusLabel("shipped")).toBe("Shipped");
  });

  it("normalizes legacy holdam source to website", () => {
    expect(normalizeOrderSource("holdam")).toBe("website");
    expect(sourceLabel("holdam")).toBe("Website");
  });

  it("labels chatbot orders for admin UI", () => {
    expect(normalizeOrderSource("chatbot")).toBe("chatbot");
    expect(sourceLabel("chatbot")).toBe("Chatbot");
  });
});

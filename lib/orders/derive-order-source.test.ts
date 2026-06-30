import { describe, expect, it } from "vitest";
import { deriveOrderSource } from "@/lib/orders/derive-order-source";

describe("deriveOrderSource", () => {
  it("defaults to website when source is omitted", () => {
    expect(deriveOrderSource({})).toBe("website");
  });

  it("uses chatbot when body source is chatbot and no store key is configured", () => {
    expect(deriveOrderSource({ bodySource: "chatbot" })).toBe("chatbot");
  });

  it("uses chatbot when bot store API key matches", () => {
    expect(
      deriveOrderSource({
        botStoreApiKey: "secret-key",
        requestBotKey: "secret-key",
      })
    ).toBe("chatbot");
  });

  it("requires matching key when BOT_STORE_API_KEY is configured", () => {
    expect(
      deriveOrderSource({
        bodySource: "chatbot",
        botStoreApiKey: "secret-key",
        requestBotKey: "wrong",
      })
    ).toBe("website");
  });
});

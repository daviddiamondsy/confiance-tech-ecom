import { describe, expect, it } from "vitest";
import {
  extractAnthropicMessageText,
  parseGeneratedProductCopy,
} from "@/lib/admin-product-copy-ai";

describe("admin-product-copy-ai", () => {
  it("extractAnthropicMessageText returns the first text block", () => {
    expect(
      extractAnthropicMessageText({
        content: [
          { type: "text", text: '{"description":"Hello"}' },
        ],
      })
    ).toBe('{"description":"Hello"}');
  });

  it("parseGeneratedProductCopy rejects incomplete payloads", () => {
    try {
      parseGeneratedProductCopy({
        description: "Short copy",
        features: [],
        specifications: { Display: "6.1-inch" },
      });
      expect.fail("expected parseGeneratedProductCopy to throw");
    } catch (error) {
      expect(error).toMatchObject({
        userMessage: "AI returned incomplete copy. Try again.",
      });
    }
  });

  it("parseGeneratedProductCopy drops Storage from specifications", () => {
    const copy = parseGeneratedProductCopy({
      description: "A great phone.",
      features: ["5G Capable", "Face ID"],
      specifications: {
        Display: "6.1-inch",
        Storage: "128GB",
        Processor: "A14 Bionic",
      },
    });

    expect(copy.specifications).toEqual({
      Display: "6.1-inch",
      Processor: "A14 Bionic",
    });
  });
});

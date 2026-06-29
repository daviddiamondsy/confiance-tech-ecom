import { describe, expect, it } from "vitest";
import {
  extractAnthropicMessageText,
  parseAiJsonContent,
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

  it("parseAiJsonContent strips markdown fences", () => {
    expect(
      parseAiJsonContent(
        '```json\n{"description":"Hello","features":["5G"],"specifications":[{"label":"Display","value":"6.1-inch"}]}\n```'
      )
    ).toMatchObject({
      description: "Hello",
    });
  });

  it("parseGeneratedProductCopy accepts specification label/value rows", () => {
    const copy = parseGeneratedProductCopy({
      description: "A great phone.",
      features: ["5G Capable", "Face ID", "MagSafe", "Night Mode", "Ceramic Shield", "Dual camera"],
      specifications: [
        { label: "Display", value: "6.1-inch" },
        { label: "Processor", value: "A14 Bionic" },
        { label: "Camera", value: "Dual 12MP" },
        { label: "Battery", value: "Up to 17 hours" },
        { label: "Connectivity", value: "5G" },
      ],
    });

    expect(copy.specifications.Processor).toBe("A14 Bionic");
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

import { describe, expect, it } from "vitest";
import {
  extractAnthropicMessageText,
  finalizeGeneratedProductCopy,
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

  it("finalizeGeneratedProductCopy adds Unlocked for iPhones", () => {
    const copy = finalizeGeneratedProductCopy(
      {
        description: "The iPhone 14 Pro introduces Dynamic Island.",
        features: ["90+ Battery Health", "A16 Bionic Chip", "Face ID Security"],
        specifications: {
          Display: "6.1-inch Super Retina XDR",
          Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
        },
      },
      {
        productName: "Apple iPhone 14 Pro 256GB (Clean)",
        filterSlugs: ["clean"],
      }
    );

    expect(copy.features).toContain("Unlocked");
    expect(copy.specifications.Connectivity).toBe("Unlocked, 5G, Wi-Fi 6, Bluetooth 5.3");
    expect(copy.description).toContain("90+ battery health");
  });
});

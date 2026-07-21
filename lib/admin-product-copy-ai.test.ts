import { describe, expect, it } from "vitest";
import {
  extractGroqChatContent,
  finalizeGeneratedProductCopy,
  parseAiJsonContent,
  parseGeneratedProductCopy,
  stripConditionFromDescription,
} from "@/lib/admin-product-copy-ai";

describe("admin-product-copy-ai", () => {
  it("stripConditionFromDescription removes condition claims", () => {
    expect(
      stripConditionFromDescription(
        "Get the brand new Apple iPhone 17e. This factory-fresh device is Grade A. Inspected and tested."
      )
    ).toBe("Get the Apple iPhone 17e. Inspected and tested.");
  });
  it("extractGroqChatContent returns the assistant message content", () => {
    expect(
      extractGroqChatContent({
        choices: [{ message: { content: '{"description":"Hello"}' } }],
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
        productName: "Apple iPhone 14 Pro 256GB (Like New)",
        filterSlugs: ["clean"],
      }
    );

    expect(copy.features).toContain("Unlocked");
    expect(copy.specifications.Connectivity).toBe("Unlocked, 5G, Wi-Fi 6, Bluetooth 5.3");
    expect(copy.specifications["Battery health"]).toBe("90%+");
  });

  it("finalizeGeneratedProductCopy keeps condition out of the description", () => {
    const description =
      "Get the Apple iPhone 17e with a stunning 6.1-inch Super Retina XDR display, powered by the advanced A19 chip.";

    const likeNew = finalizeGeneratedProductCopy(
      {
        description,
        features: ["A19 Chip", "48MP Fusion Camera"],
        specifications: {
          Display: "6.1-inch Super Retina XDR",
          Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
        },
      },
      {
        productName: "Apple iPhone 17e (Like New)",
        filterSlugs: ["clean"],
      }
    );

    expect(likeNew.description).toBe(description);
    expect(likeNew.description).not.toMatch(/grade a|brand new|factory.?fresh|like new|accessories included/i);
    expect(likeNew.features).toContain("90+ Battery Health");
    expect(likeNew.specifications["Battery health"]).toBe("90%+");

    const brandNew = finalizeGeneratedProductCopy(
      {
        description,
        features: ["A19 Chip", "48MP Fusion Camera"],
        specifications: {
          Display: "6.1-inch Super Retina XDR",
          Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
        },
      },
      {
        productName: "Apple iPhone 17e (New)",
        filterSlugs: ["new"],
      }
    );

    expect(brandNew.description).toBe(description);
    expect(brandNew.description).not.toMatch(/grade a|brand new|factory.?fresh|like new/i);
  });
});

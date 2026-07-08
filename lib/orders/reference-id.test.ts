import { describe, expect, it } from "vitest";
import {
  formatStoreOrderReference,
  parseStoreOrderReference,
} from "@/lib/orders/reference-id";

describe("store order reference", () => {
  it("formats CT-prefixed buyer references", () => {
    expect(formatStoreOrderReference(42)).toBe("CT-42");
  });

  it("parses CT references and bare numeric ids", () => {
    expect(parseStoreOrderReference("CT-42")).toBe(42);
    expect(parseStoreOrderReference("ct-99")).toBe(99);
    expect(parseStoreOrderReference("42")).toBe(42);
    expect(parseStoreOrderReference("HDM-12345-ABCDE")).toBeNull();
  });
});

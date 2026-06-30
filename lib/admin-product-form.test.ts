import { describe, expect, it } from "vitest";

import { badgeValueForProductUpdate } from "@/lib/admin-product-form";

describe("badgeValueForProductUpdate", () => {
  it("returns null when badge is cleared", () => {
    expect(badgeValueForProductUpdate("")).toBeNull();
    expect(badgeValueForProductUpdate(null)).toBeNull();
    expect(badgeValueForProductUpdate("   ")).toBeNull();
  });

  it("returns trimmed badge text", () => {
    expect(badgeValueForProductUpdate(" Popular ")).toBe("Popular");
  });
});

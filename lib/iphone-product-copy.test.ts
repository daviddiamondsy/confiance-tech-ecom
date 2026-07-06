import { describe, expect, it } from "vitest";

import { BATTERY_HEALTH_FEATURE } from "@/lib/device-quality-copy";
import {
  ensureIphoneProductCopy,
  ensureIphoneUnlockedFeature,
  ensureIphoneUnlockedSpec,
} from "@/lib/iphone-product-copy";

describe("iphone-product-copy", () => {
  it("inserts Unlocked after battery health in features", () => {
    expect(
      ensureIphoneUnlockedFeature([
        BATTERY_HEALTH_FEATURE,
        "A16 Bionic Chip",
        "Face ID Security",
      ])
    ).toEqual([BATTERY_HEALTH_FEATURE, "Unlocked", "A16 Bionic Chip", "Face ID Security"]);
  });

  it("prefixes Unlocked on Connectivity specs", () => {
    expect(
      ensureIphoneUnlockedSpec({
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
      })
    ).toEqual({
      Connectivity: "Unlocked, 5G, Wi-Fi 6, Bluetooth 5.3",
    });
  });

  it("leaves non-iPhone products unchanged", () => {
    const copy = ensureIphoneProductCopy({
      name: "Samsung Galaxy S24 Ultra (Like New)",
      features: ["200MP Camera"],
      specifications: { Connectivity: "5G" },
    });

    expect(copy.features).toEqual(["200MP Camera"]);
    expect(copy.specifications).toEqual({ Connectivity: "5G" });
  });
});

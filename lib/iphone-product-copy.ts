import { IPHONE_UNLOCKED_FEATURE } from "@/lib/device-quality-copy";

export function isIphoneProductName(name: string): boolean {
  return /iphone/i.test(name);
}

export function hasUnlockedFeature(features: readonly string[]): boolean {
  return features.some((feature) => /\bunlocked\b/i.test(feature));
}

/** Insert "Unlocked" after battery health when present, otherwise at the start. */
export function ensureIphoneUnlockedFeature(features: string[]): string[] {
  if (hasUnlockedFeature(features)) return features;

  const batteryIndex = features.findIndex((feature) => /battery health/i.test(feature));
  const insertAt = batteryIndex >= 0 ? batteryIndex + 1 : 0;
  const next = [...features];
  next.splice(insertAt, 0, IPHONE_UNLOCKED_FEATURE);
  return next;
}

export function ensureIphoneUnlockedSpec(
  specifications: Record<string, string>
): Record<string, string> {
  const next = { ...specifications };
  const connectivityKey =
    next.Connectivity !== undefined
      ? "Connectivity"
      : next.connectivity !== undefined
        ? "connectivity"
        : "Connectivity";
  const connectivity = next[connectivityKey] ?? next.Connectivity ?? next.connectivity;

  if (connectivity && !/\bunlocked\b/i.test(connectivity)) {
    next[connectivityKey] = `Unlocked, ${connectivity}`;
    if (connectivityKey === "Connectivity" && next.connectivity !== undefined) {
      delete next.connectivity;
    }
    return next;
  }

  if (!connectivity) {
    next.Connectivity = IPHONE_UNLOCKED_FEATURE;
  }

  return next;
}

export function ensureIphoneProductCopy(input: {
  name: string;
  features: string[];
  specifications: Record<string, string>;
}): { features: string[]; specifications: Record<string, string> } {
  if (!isIphoneProductName(input.name)) {
    return { features: input.features, specifications: input.specifications };
  }

  return {
    features: ensureIphoneUnlockedFeature(input.features),
    specifications: ensureIphoneUnlockedSpec(input.specifications),
  };
}

import { stripConditionSuffix } from "@/lib/product-condition-suffix";

import {
  formatChinaShippingYuan,
  formatInternationalShippingNgn,
  parseChinaShippingYuan,
  parseInternationalShippingNgn,
  DEFAULT_CHINA_SHIPPING_YUAN,
  DEFAULT_INTERNATIONAL_SHIPPING_NGN,
  type ChinaShippingYuan,
  type InternationalShippingNgn,
} from "@/lib/product-shipping";
import { priceFromYuan, sellingMarkupForYuan, type PricingConfig } from "@/lib/pricing";

export interface ProductFormState {
  name: string;
  yuanCost: string;
  image: string;
  description: string;
  filterSlugs: string[];
  badge: string;
  storage: string;
  storageVariants: string;
  colors: string;
  features: string;
  specifications: string;
  chinaShippingYuan: string;
  internationalShippingNgn: string;
}

export function parseFilterSlugsInput(raw: unknown, legacyFilterSlug?: unknown): string[] {
  if (Array.isArray(raw)) {
    return Array.from(new Set(raw.map((slug) => String(slug).trim()).filter(Boolean)));
  }
  if (typeof raw === "string" && raw.trim()) {
    return Array.from(new Set(raw.split(",").map((slug) => slug.trim()).filter(Boolean)));
  }
  if (typeof legacyFilterSlug === "string" && legacyFilterSlug.trim()) {
    return [legacyFilterSlug.trim()];
  }
  return [];
}

export function toggleProductFilterSlug(filterSlugs: string[], slug: string): string[] {
  return filterSlugs.includes(slug)
    ? filterSlugs.filter((value) => value !== slug)
    : [...filterSlugs, slug];
}

export function hasProductFilterSlugs(form: Pick<ProductFormState, "filterSlugs">): boolean {
  return form.filterSlugs.length > 0;
}

export function normalizeStorageLabel(storage: string): string {
  return storage
    .replace(/\s+/g, "")
    .replace(/\bgb\b/gi, "GB")
    .replace(/\btb\b/gi, "TB");
}

export function splitStorageVariantLines(raw: string): string[] {
  return raw
    .split(/\r?\n|,/)
    .map((part) => part.trim())
    .filter(Boolean);
}

function parseStorageVariantPart(part: string): { storage: string; yuan: number } | null {
  const trimmed = part.trim();
  if (!trimmed) return null;

  let storage = "";
  let yuanRaw = "";

  for (const separator of [":", "\t"]) {
    const index = trimmed.indexOf(separator);
    if (index !== -1) {
      storage = trimmed.slice(0, index).trim();
      yuanRaw = trimmed.slice(index + 1).trim();
      break;
    }
  }

  if (!storage) {
    const spaced = trimmed.match(/^(.+?)[\s-]+(\d+(?:\.\d+)?)$/);
    if (spaced) {
      storage = spaced[1].trim();
      yuanRaw = spaced[2];
    }
  }

  if (!storage || !yuanRaw) return null;

  const yuan = Number(yuanRaw);
  if (!Number.isFinite(yuan) || yuan <= 0) return null;

  return { storage: normalizeStorageLabel(storage), yuan };
}

export function parseStorageVariants(raw: unknown): Array<{ storage: string; yuan: number }> | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  const parts = splitStorageVariantLines(raw);

  const variants = parts
    .map((part) => parseStorageVariantPart(part))
    .filter((variant): variant is { storage: string; yuan: number } => variant != null);

  return variants.length > 0 ? variants : undefined;
}

/** Normalize, dedupe, and validate variant rows before persisting. */
export function finalizeStorageVariantsForSave(
  variants: Array<{ storage: string; yuan: number }>
): Array<{ storage: string; yuan: number }> {
  const seen = new Set<string>();
  const normalized: Array<{ storage: string; yuan: number }> = [];

  for (const variant of variants) {
    const storage = normalizeStorageLabel(variant.storage);
    if (!storage) {
      throw new Error("INVALID_STORAGE_VARIANTS");
    }
    if (seen.has(storage)) {
      throw new Error("DUPLICATE_STORAGE_VARIANT");
    }
    seen.add(storage);
    normalized.push({ storage, yuan: variant.yuan });
  }

  return normalized;
}

export function storageVariantsFieldError(raw: string): string | null {
  if (!raw.trim()) return null;

  const parts = splitStorageVariantLines(raw);
  const variants = parseStorageVariants(raw);

  if (!variants?.length) {
    return "Use one variant per line with storage:yuan (e.g. 128GB:1500 and 256GB:1700).";
  }

  if (variants.length !== parts.length) {
    return `Could not parse ${parts.length - variants.length} line(s). Each line needs storage:yuan (e.g. 256GB:1700).`;
  }

  try {
    finalizeStorageVariantsForSave(variants);
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_STORAGE_VARIANT") {
      return "Each storage size must be unique (e.g. 128GB and 256GB, not 128GB twice).";
    }
    return "Use one variant per line with storage:yuan (e.g. 128GB:1500 and 256GB:1700).";
  }

  return null;
}

/** Parse storage variants from admin form; rejects non-empty invalid input. */
export function parseStorageVariantsField(raw: unknown): Array<{ storage: string; yuan: number }> | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") {
    throw new Error("INVALID_STORAGE_VARIANTS");
  }
  if (!raw.trim()) return [];
  const variants = parseStorageVariants(raw);
  if (!variants?.length) {
    throw new Error("INVALID_STORAGE_VARIANTS");
  }
  return finalizeStorageVariantsForSave(variants);
}

export function usesStorageVariantsField(form: Pick<ProductFormState, "storageVariants">): boolean {
  return form.storageVariants.trim().length > 0;
}

export function primaryYuanFromForm(form: Pick<ProductFormState, "yuanCost" | "storageVariants">): number | null {
  const variants = parseStorageVariants(form.storageVariants);
  if (variants?.[0]?.yuan) return variants[0].yuan;
  const yuan = Number(form.yuanCost);
  return Number.isFinite(yuan) && yuan > 0 ? yuan : null;
}

export interface VariantPricePreview {
  storage: string;
  yuan: number;
  price: number;
  markup: number;
}

/** Live NGN estimates for each storage:yuan line (or single yuan cost). */
export function previewVariantPricesFromForm(
  form: ProductFormState,
  pricing: PricingConfig
): VariantPricePreview[] {
  let shipping;
  try {
    shipping = {
      chinaShippingYuan: parseChinaShippingYuan(form.chinaShippingYuan),
      internationalShippingNgn: parseInternationalShippingNgn(form.internationalShippingNgn),
    };
  } catch {
    return [];
  }

  const variants = parseStorageVariants(form.storageVariants);
  if (variants?.length) {
    return variants.map((variant) => ({
      storage: variant.storage,
      yuan: variant.yuan,
      price: priceFromYuan(variant.yuan, pricing, shipping),
      markup: sellingMarkupForYuan(variant.yuan, pricing),
    }));
  }

  const yuan = Number(form.yuanCost);
  if (!Number.isFinite(yuan) || yuan <= 0) {
    return [];
  }

  return [
    {
      storage: form.storage.trim() || "Default",
      yuan,
      price: priceFromYuan(yuan, pricing, shipping),
      markup: sellingMarkupForYuan(yuan, pricing),
    },
  ];
}

/** Strip single-price fields when storage variants drive pricing. */
export function productFormPayloadForSave(form: ProductFormState): ProductFormState {
  if (!usesStorageVariantsField(form)) return form;
  return { ...form, yuanCost: "", storage: "" };
}

export function formatStorageVariants(
  variants: Array<{ storage: string; yuan: number }> | undefined
): string {
  if (!variants?.length) return "";
  return variants.map((variant) => `${variant.storage}:${variant.yuan}`).join("\n");
}

export function parseColorsInput(raw: unknown): string[] | undefined {
  if (Array.isArray(raw)) {
    return raw.map((color) => String(color).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);
  }
  return undefined;
}

export function parseFeaturesInput(raw: unknown): string[] | undefined {
  if (typeof raw !== "string") return undefined;
  const features = raw
    .split("\n")
    .map((feature) => feature.trim())
    .filter(Boolean);
  return features.length > 0 ? features : undefined;
}

/** One spec per line as `Label: value`. Storage is set from the storage field when present. */
export function parseSpecificationsInput(raw: unknown): Record<string, string> | undefined {
  if (typeof raw !== "string") return undefined;

  const specs: Record<string, string> = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();
    if (key && key !== "Storage") {
      specs[key] = value;
    }
  }

  return Object.keys(specs).length > 0 ? specs : undefined;
}

export function formatSpecificationsInput(
  specs: Record<string, string> | undefined | null
): string {
  if (!specs) return "";

  return Object.entries(specs)
    .filter(([key]) => key !== "Storage")
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}

export function applyGeneratedProductCopyToForm(copy: {
  description: string;
  features: string[];
  specifications: Record<string, string>;
}): Pick<ProductFormState, "description" | "features" | "specifications"> {
  return {
    description: copy.description,
    features: copy.features.join("\n"),
    specifications: formatSpecificationsInput(copy.specifications),
  };
}

export function mergeSpecificationsWithStorage(
  specs: Record<string, string> | undefined,
  storage: string | undefined
): Record<string, string> {
  const merged = { ...(specs ?? {}) };
  if (storage?.trim()) {
    merged.Storage = storage.trim();
  }
  return merged;
}

export function adminProductToForm(product: {
  name: string;
  yuanCost: number | null;
  image: string;
  description: string;
  filterSlug: string | null;
  filterSlugs: string[];
  badge: string | null;
  storage: string | null;
  storageVariants: Array<{ storage: string; yuan: number }>;
  colors: string[];
  features: string[];
  specifications: Record<string, string>;
  chinaShippingYuan: number;
  internationalShippingNgn: number;
}): ProductFormState {
  const hasVariants = product.storageVariants.length > 0;

  return {
    name: stripConditionSuffix(product.name),
    yuanCost: hasVariants ? "" : String(product.yuanCost ?? ""),
    image: product.image,
    description: product.description,
    filterSlugs: product.filterSlugs?.length
      ? product.filterSlugs
      : product.filterSlug
        ? [product.filterSlug]
        : [],
    badge: product.badge ?? "",
    storage: hasVariants ? "" : product.storage ?? "",
    storageVariants: formatStorageVariants(
      hasVariants ? product.storageVariants : undefined
    ),
    colors: product.colors.join(", "),
    features: product.features.join("\n"),
    specifications: formatSpecificationsInput(product.specifications),
    chinaShippingYuan: formatChinaShippingYuan(product.chinaShippingYuan as ChinaShippingYuan),
    internationalShippingNgn: formatInternationalShippingNgn(
      product.internationalShippingNgn as InternationalShippingNgn
    ),
  };
}

export const emptyProductForm: ProductFormState = {
  name: "",
  yuanCost: "",
  image: "/product-images/",
  description: "",
  filterSlugs: [],
  badge: "",
  storage: "",
  storageVariants: "",
  colors: "",
  features: "",
  specifications: "",
  chinaShippingYuan: String(DEFAULT_CHINA_SHIPPING_YUAN),
  internationalShippingNgn: String(DEFAULT_INTERNATIONAL_SHIPPING_NGN),
};

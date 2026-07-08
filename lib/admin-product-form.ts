import { stripConditionSuffix } from "@/lib/product-condition-suffix";

import {
  formatChinaShippingYuan,
  formatInternationalShippingCurrency,
  formatInternationalShippingNgn,
  formatInternationalShippingUsd,
  formatLocalDeliveryNgn,
  parseChinaShippingYuan,
  parseInternationalShippingCurrency,
  parseInternationalShippingNgn,
  parseInternationalShippingUsd,
  parseLocalDeliveryNgn,
  DEFAULT_CHINA_SHIPPING_YUAN,
  DEFAULT_INTERNATIONAL_SHIPPING_NGN,
  DEFAULT_INTERNATIONAL_SHIPPING_USD,
  DEFAULT_LOCAL_DELIVERY_NGN,
  type ChinaShippingYuan,
  type InternationalShippingCurrency,
  type InternationalShippingNgn,
  type InternationalShippingUsd,
  type LocalDeliveryNgn,
} from "@/lib/product-shipping";
import {
  parseCostCurrency,
  priceFromSupplierCost,
  sellingMarkupForSupplierCost,
  sellingPriceFromDirectNaira,
  type PricingConfig,
  type SupplierCostCurrency,
} from "@/lib/pricing";
import {
  variantSpecKey,
  type PriceMode,
  type VariantDimension,
} from "@/lib/variant-dimension";

export interface ProductFormState {
  name: string;
  costCurrency: SupplierCostCurrency;
  yuanCost: string;
  useDirectNairaPrice: boolean;
  directNairaPrice: string;
  variantDimension: VariantDimension;
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
  internationalShippingCurrency: InternationalShippingCurrency;
  internationalShippingNgn: string;
  internationalShippingUsd: string;
  localDeliveryNgn: string;
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

function parseStorageVariantPart(
  part: string,
  valueKind: "cost" | "naira"
): { storage: string; value: number } | null {
  const trimmed = part.trim();
  if (!trimmed) return null;

  let storage = "";
  let valueRaw = "";

  for (const separator of [":", "\t"]) {
    const index = trimmed.indexOf(separator);
    if (index !== -1) {
      storage = trimmed.slice(0, index).trim();
      valueRaw = trimmed.slice(index + 1).trim();
      break;
    }
  }

  if (!storage) {
    const spaced = trimmed.match(/^(.+?)[\s-]+(\d+(?:\.\d+)?)$/);
    if (spaced) {
      storage = spaced[1].trim();
      valueRaw = spaced[2];
    }
  }

  if (!storage || !valueRaw) return null;

  const value = Number(valueRaw.replace(/,/g, ""));
  if (!Number.isFinite(value) || value <= 0) return null;
  if (valueKind === "naira" && value < 1000) return null;

  return { storage: normalizeStorageLabel(storage), value };
}

export function parseStorageVariants(
  raw: unknown,
  valueKind: "cost" | "naira" = "cost"
): Array<{ storage: string; yuan: number }> | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  const parts = splitStorageVariantLines(raw);

  const variants = parts
    .map((part) => parseStorageVariantPart(part, valueKind))
    .filter((variant): variant is { storage: string; value: number } => variant != null)
    .map((variant) => ({ storage: variant.storage, yuan: variant.value }));

  return variants.length > 0 ? variants : undefined;
}

export function variantValueKindForForm(form: Pick<ProductFormState, "useDirectNairaPrice">): "cost" | "naira" {
  return form.useDirectNairaPrice ? "naira" : "cost";
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

export function storageVariantsFieldError(
  raw: string,
  valueKind: "cost" | "naira" = "cost"
): string | null {
  if (!raw.trim()) return null;

  const parts = splitStorageVariantLines(raw);
  const variants = parseStorageVariants(raw, valueKind);

  const example =
    valueKind === "naira"
      ? "128GB:850000 and 256GB:950000"
      : "128GB:1500 and 256GB:1700";
  const formatHint =
    valueKind === "naira"
      ? "variant:price in naira"
      : "storage:yuan";

  if (!variants?.length) {
    return `Use one variant per line with ${formatHint} (e.g. ${example}).`;
  }

  if (variants.length !== parts.length) {
    return `Could not parse ${parts.length - variants.length} line(s). Each line needs ${formatHint} (e.g. ${example}).`;
  }

  try {
    finalizeStorageVariantsForSave(variants);
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_STORAGE_VARIANT") {
      return "Each variant must be unique (e.g. 128GB and 256GB, not 128GB twice).";
    }
    return `Use one variant per line with ${formatHint} (e.g. ${example}).`;
  }

  return null;
}

/** Parse storage variants from admin form; rejects non-empty invalid input. */
export function parseStorageVariantsField(
  raw: unknown,
  valueKind: "cost" | "naira" = "cost"
): Array<{ storage: string; yuan: number }> | undefined {
  if (raw === undefined) return undefined;
  if (typeof raw !== "string") {
    throw new Error("INVALID_STORAGE_VARIANTS");
  }
  if (!raw.trim()) return [];
  const variants = parseStorageVariants(raw, valueKind);
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
  cost: number;
  currency: SupplierCostCurrency;
  price: number;
  markup: number;
}

/** Live NGN estimates for each storage:cost line (or single supplier cost). */
export function previewVariantPricesFromForm(
  form: ProductFormState,
  pricing: PricingConfig
): VariantPricePreview[] {
  const valueKind = variantValueKindForForm(form);

  if (form.useDirectNairaPrice) {
    const variants = parseStorageVariants(form.storageVariants, "naira");
    if (variants?.length) {
      return variants.map((variant) => ({
        storage: variant.storage,
        cost: variant.yuan,
        currency: form.costCurrency,
        price: sellingPriceFromDirectNaira(variant.yuan),
        markup: 0,
      }));
    }

    const naira = Number(form.directNairaPrice.replace(/,/g, ""));
    if (!Number.isFinite(naira) || naira <= 0) return [];

    return [
      {
        storage: form.storage.trim() || "Default",
        cost: naira,
        currency: form.costCurrency,
        price: sellingPriceFromDirectNaira(naira),
        markup: 0,
      },
    ];
  }

  let currency: SupplierCostCurrency;
  try {
    currency = parseCostCurrency(form.costCurrency);
  } catch {
    return [];
  }

  let shipping;
  try {
    shipping = {
      chinaShippingYuan: parseChinaShippingYuan(form.chinaShippingYuan),
      internationalShippingCurrency: parseInternationalShippingCurrency(
        form.internationalShippingCurrency
      ),
      internationalShippingNgn: parseInternationalShippingNgn(form.internationalShippingNgn),
      internationalShippingUsd: parseInternationalShippingUsd(form.internationalShippingUsd),
      localDeliveryNgn: parseLocalDeliveryNgn(form.localDeliveryNgn),
    };
  } catch {
    return [];
  }

  const variants = parseStorageVariants(form.storageVariants, "cost");
  if (variants?.length) {
    return variants.map((variant) => ({
      storage: variant.storage,
      cost: variant.yuan,
      currency,
      price: priceFromSupplierCost(variant.yuan, currency, pricing, shipping),
      markup: sellingMarkupForSupplierCost(variant.yuan, currency, pricing),
    }));
  }

  const cost = Number(form.yuanCost);
  if (!Number.isFinite(cost) || cost <= 0) {
    return [];
  }

  return [
    {
      storage: form.storage.trim() || "Default",
      cost,
      currency,
      price: priceFromSupplierCost(cost, currency, pricing, shipping),
      markup: sellingMarkupForSupplierCost(cost, currency, pricing),
    },
  ];
}

/** Maps admin form badge to a DB update (null clears an existing badge). */
export function badgeValueForProductUpdate(raw: unknown): string | null {
  if (raw === "" || raw == null) return null;
  return String(raw).trim() || null;
}

/** Strip single-price fields when storage variants drive pricing. */
export function productFormPayloadForSave(form: ProductFormState): ProductFormState {
  if (!usesStorageVariantsField(form)) {
    if (form.useDirectNairaPrice) {
      return { ...form, yuanCost: "" };
    }
    return form;
  }
  return { ...form, yuanCost: "", storage: "", directNairaPrice: "" };
}

export function formatStorageVariants(
  variants: Array<{ storage: string; yuan: number }> | undefined,
  priceMode: PriceMode = "calculated"
): string {
  if (!variants?.length) return "";
  if (priceMode === "direct_ngn") {
    return variants.map((variant) => `${variant.storage}:${variant.yuan}`).join("\n");
  }
  return variants.map((variant) => `${variant.storage}:${variant.yuan}`).join("\n");
}

export function parseDirectNairaPrice(raw: unknown): number | undefined {
  if (raw === undefined || raw === null || raw === "") return undefined;
  const naira = Number(String(raw).replace(/,/g, "").trim());
  if (!Number.isFinite(naira) || naira <= 0) return undefined;
  return Math.round(naira);
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
    if (key && key !== "Storage" && key !== "Size") {
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
    .filter(([key]) => key !== "Storage" && key !== "Size")
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
  storage: string | undefined,
  dimension: VariantDimension = "storage"
): Record<string, string> {
  return mergeSpecificationsWithVariant(specs, storage, dimension);
}

export function mergeSpecificationsWithVariant(
  specs: Record<string, string> | undefined,
  variantValue: string | undefined,
  dimension: VariantDimension = "storage"
): Record<string, string> {
  const merged = { ...(specs ?? {}) };
  const key = variantSpecKey(dimension);
  delete merged.Storage;
  delete merged.Size;
  if (variantValue?.trim()) {
    merged[key] = variantValue.trim();
  }
  return merged;
}

export function adminProductToForm(product: {
  name: string;
  yuanCost: number | null;
  costCurrency?: SupplierCostCurrency;
  priceMode?: PriceMode;
  variantDimension?: VariantDimension;
  price: number;
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
  internationalShippingCurrency: InternationalShippingCurrency;
  internationalShippingNgn: number;
  internationalShippingUsd: number;
  localDeliveryNgn: number;
}): ProductFormState {
  const hasVariants = product.storageVariants.length > 0;
  const priceMode = product.priceMode ?? "calculated";
  const useDirectNairaPrice = priceMode === "direct_ngn";
  const variantDimension = product.variantDimension ?? "storage";

  return {
    name: stripConditionSuffix(product.name),
    costCurrency: product.costCurrency ?? "cny",
    yuanCost: hasVariants || useDirectNairaPrice ? "" : String(product.yuanCost ?? ""),
    useDirectNairaPrice,
    directNairaPrice:
      useDirectNairaPrice && !hasVariants
        ? String(product.yuanCost ?? product.price)
        : "",
    variantDimension,
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
      hasVariants ? product.storageVariants : undefined,
      priceMode
    ),
    colors: product.colors.join(", "),
    features: product.features.join("\n"),
    specifications: formatSpecificationsInput(product.specifications),
    chinaShippingYuan: formatChinaShippingYuan(product.chinaShippingYuan as ChinaShippingYuan),
    internationalShippingCurrency: formatInternationalShippingCurrency(
      product.internationalShippingCurrency ?? "ngn"
    ) as InternationalShippingCurrency,
    internationalShippingNgn: formatInternationalShippingNgn(
      product.internationalShippingNgn as InternationalShippingNgn
    ),
    internationalShippingUsd: formatInternationalShippingUsd(
      product.internationalShippingUsd as InternationalShippingUsd
    ),
    localDeliveryNgn: formatLocalDeliveryNgn(product.localDeliveryNgn as LocalDeliveryNgn),
  };
}

export const emptyProductForm: ProductFormState = {
  name: "",
  costCurrency: "cny",
  yuanCost: "",
  useDirectNairaPrice: false,
  directNairaPrice: "",
  variantDimension: "storage",
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
  internationalShippingCurrency: "ngn",
  internationalShippingNgn: String(DEFAULT_INTERNATIONAL_SHIPPING_NGN),
  internationalShippingUsd: String(DEFAULT_INTERNATIONAL_SHIPPING_USD),
  localDeliveryNgn: String(DEFAULT_LOCAL_DELIVERY_NGN),
};

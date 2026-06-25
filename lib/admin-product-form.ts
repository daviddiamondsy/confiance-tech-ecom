import { stripConditionSuffix } from "@/lib/product-condition-suffix";

export interface ProductFormState {
  name: string;
  yuanCost: string;
  image: string;
  description: string;
  filterSlug: string;
  badge: string;
  storage: string;
  storageVariants: string;
  colors: string;
  features: string;
}

export function normalizeStorageLabel(storage: string): string {
  return storage
    .replace(/\s+/g, "")
    .replace(/\bgb\b/gi, "GB")
    .replace(/\btb\b/gi, "TB");
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

  const parts = raw
    .split(/[\n,]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  const variants = parts
    .map((part) => parseStorageVariantPart(part))
    .filter((variant): variant is { storage: string; yuan: number } => variant != null);

  return variants.length > 0 ? variants : undefined;
}

export function storageVariantsFieldError(raw: string): string | null {
  if (!raw.trim()) return null;
  const variants = parseStorageVariants(raw);
  if (!variants?.length) {
    return "Use one variant per line with storage:yuan (e.g. 128GB:1400 and 256GB:1500).";
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
  return variants;
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

export function adminProductToForm(product: {
  name: string;
  yuanCost: number | null;
  image: string;
  description: string;
  filterSlug: string | null;
  badge: string | null;
  storage: string | null;
  storageVariants: Array<{ storage: string; yuan: number }>;
  colors: string[];
  features: string[];
}): ProductFormState {
  const hasVariants = product.storageVariants.length > 0;

  return {
    name: stripConditionSuffix(product.name),
    yuanCost: hasVariants ? "" : String(product.yuanCost ?? ""),
    image: product.image,
    description: product.description,
    filterSlug: product.filterSlug ?? "",
    badge: product.badge ?? "",
    storage: hasVariants ? "" : product.storage ?? "",
    storageVariants: formatStorageVariants(
      hasVariants ? product.storageVariants : undefined
    ),
    colors: product.colors.join(", "),
    features: product.features.join("\n"),
  };
}

export const emptyProductForm: ProductFormState = {
  name: "",
  yuanCost: "",
  image: "/product-images/",
  description: "",
  filterSlug: "",
  badge: "",
  storage: "",
  storageVariants: "",
  colors: "",
  features: "",
};

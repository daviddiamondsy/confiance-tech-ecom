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

export function parseStorageVariants(raw: unknown): Array<{ storage: string; yuan: number }> | undefined {
  if (typeof raw !== "string" || !raw.trim()) return undefined;

  const variants = raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [storage, yuanText] = part.split(":").map((value) => value.trim());
      const yuan = Number(yuanText);
      if (!storage || !Number.isFinite(yuan) || yuan <= 0) return null;
      return { storage, yuan };
    })
    .filter((variant): variant is { storage: string; yuan: number } => variant != null);

  return variants.length > 0 ? variants : undefined;
}

export function formatStorageVariants(
  variants: Array<{ storage: string; yuan: number }> | undefined
): string {
  if (!variants?.length) return "";
  return variants.map((variant) => `${variant.storage}:${variant.yuan}`).join(", ");
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
  return {
    name: product.name.replace(/\s*\(Clean\)\s*$/i, ""),
    yuanCost: product.yuanCost?.toString() ?? "",
    image: product.image,
    description: product.description,
    filterSlug: product.filterSlug ?? "",
    badge: product.badge ?? "",
    storage: product.storage ?? "",
    storageVariants: formatStorageVariants(product.storageVariants),
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

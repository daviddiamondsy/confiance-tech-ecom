import {
  buildVariantDisplayName,
} from "@/lib/product-condition-suffix";
import {
  variantPickerLabel,
  type PriceMode,
  type VariantDimension,
} from "@/lib/variant-dimension";

export interface StorageOption {
  storage: string;
  price: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  storageOptions?: StorageOption[];
  colorOptions?: string[];
  filterSlug?: string;
  filterSlugs?: string[];
  images?: string[];
  video?: string;
  variantDimension?: VariantDimension;
  priceMode?: PriceMode;
  localDeliveryNgn?: number;
}

export function getVariantPickerLabel(product: Product): string {
  return variantPickerLabel(product.variantDimension ?? "storage");
}

export function getSelectedVariant(
  product: Product,
  storageIndex = 0,
  colorIndex = 0
) {
  const option = product.storageOptions?.[storageIndex] ?? product.storageOptions?.[0];
  const storage = option?.storage;
  const price = option?.price ?? product.price;
  const color = product.colorOptions?.[colorIndex] ?? product.colorOptions?.[0];

  const displayName = buildVariantDisplayName({
    name: product.name,
    filterSlug: product.filterSlug,
    filterSlugs: product.filterSlugs,
    storage,
    color,
    multipleStorageOptions: (product.storageOptions?.length ?? 0) > 1,
    multipleColorOptions: (product.colorOptions?.length ?? 0) > 1,
  });

  return {
    storage: storage ?? product.specifications.Storage ?? product.specifications.Size,
    color,
    price,
    displayName,
  };
}

export function getDisplaySpecs(product: Product, storage: string) {
  const specKey = product.variantDimension === "size" ? "Size" : "Storage";
  if (!product.storageOptions) {
    if (product.specifications[specKey]) return product.specifications;
    return { ...product.specifications, [specKey]: storage };
  }
  return { ...product.specifications, [specKey]: storage };
}

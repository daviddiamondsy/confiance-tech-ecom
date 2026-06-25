import {
  conditionSuffixInName,
  replaceConditionSuffix,
} from "@/lib/product-condition-suffix";

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
  images?: string[];
  video?: string;
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

  const suffix = conditionSuffixInName(product.name) ?? " (Clean)";

  let displayName =
    storage && product.storageOptions
      ? replaceConditionSuffix(product.name, ` ${storage}${suffix}`)
      : product.name;

  if (color) {
    displayName = replaceConditionSuffix(displayName, ` - ${color}${suffix}`);
  }

  return {
    storage: storage ?? product.specifications.Storage,
    color,
    price,
    displayName,
  };
}

export function getDisplaySpecs(product: Product, storage: string) {
  if (!product.storageOptions) return product.specifications;
  return { ...product.specifications, Storage: storage };
}

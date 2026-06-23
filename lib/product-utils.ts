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

  let displayName =
    storage && product.storageOptions
      ? product.name.replace(" (Clean)", ` ${storage} (Clean)`)
      : product.name;

  if (color) {
    displayName = displayName.replace(" (Clean)", ` - ${color} (Clean)`);
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

export interface StorageOption {
  storage: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  image: string;
  badge?: string;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  storageOptions?: StorageOption[];
  images?: string[];
  video?: string;
}

export function getSelectedVariant(product: Product, storageIndex = 0) {
  const option = product.storageOptions?.[storageIndex] ?? product.storageOptions?.[0];
  const storage = option?.storage;
  const price = option?.price ?? product.price;
  const displayName =
    storage && product.storageOptions
      ? product.name.replace(" (Clean)", ` ${storage} (Clean)`)
      : product.name;

  return { storage: storage ?? product.specifications.Storage, price, displayName };
}

export function getDisplaySpecs(product: Product, storage: string) {
  if (!product.storageOptions) return product.specifications;
  return { ...product.specifications, Storage: storage };
}

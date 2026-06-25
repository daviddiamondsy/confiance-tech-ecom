import type { CreateProductInput } from "@/lib/db/products-repository";
import {
  DEFAULT_CHINA_SHIPPING_YUAN,
  DEFAULT_INTERNATIONAL_SHIPPING_NGN,
} from "@/lib/product-shipping";

export const SAMSUNG_GALAXY_S24_ULTRA_SLUG = "samsung-galaxy-s24-ultra";

export const samsungGalaxyS24UltraInput: CreateProductInput = {
  name: "Samsung Galaxy S24 Ultra",
  slug: SAMSUNG_GALAXY_S24_ULTRA_SLUG,
  image: "/product-images/galaxy-s24.png",
  description:
    "Samsung Galaxy S24 Ultra with a 6.8-inch QHD+ Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, " +
    "200MP adaptive camera, and built-in S Pen. Clean condition. Inspected, tested, and certified.",
  filterSlugs: ["clean"],
  badge: "Popular",
  storageVariants: [
    { storage: "256GB", yuan: 4200 },
    { storage: "512GB", yuan: 4400 },
  ],
  colors: ["Titanium Black", "Titanium Gray", "Titanium Violet", "Titanium Yellow"],
  features: [
    "6.8-inch QHD+ Dynamic AMOLED 2X Display",
    "Snapdragon 8 Gen 3 for Galaxy",
    "200MP Adaptive Camera with AI zoom",
    "Built-in S Pen",
    "Titanium frame",
    "Galaxy AI features",
    "Clean condition with accessories included",
    "Inspected, tested, and certified",
  ],
  chinaShippingYuan: DEFAULT_CHINA_SHIPPING_YUAN,
  internationalShippingNgn: DEFAULT_INTERNATIONAL_SHIPPING_NGN,
};

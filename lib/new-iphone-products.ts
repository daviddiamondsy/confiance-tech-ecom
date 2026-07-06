import { priceFromYuan as computePriceFromYuan, DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import { defaultShippingForProductName } from "@/lib/product-shipping";
import {
  BATTERY_HEALTH_FEATURE,
  BATTERY_HEALTH_SPEC,
  IPHONE_QUALITY_TAIL,
  IPHONE_UNLOCKED_FEATURE,
} from "@/lib/device-quality-copy";
import type { Product } from "@/lib/product-utils";

export type NewIphoneProduct = Omit<Product, "slug"> & { id: string };

export interface NewIphoneProductMeta {
  yuan: number;
  filterSlug: string;
  colors: string[];
  slug: string;
}

function catalogPrice(productName: string, yuan: number): number {
  return computePriceFromYuan(
    yuan,
    DEFAULT_PRICING_CONFIG,
    defaultShippingForProductName(productName)
  );
}

/** iPhone 15 + iPhone 17 products to add to Postgres (ids 16-20). */
export function buildNewIphoneProducts(): NewIphoneProduct[] {
  const iphone15Name = "Apple iPhone 15 256GB (Like New)";
  const iphone17CleanName = "Apple iPhone 17 (Like New)";
  const iphone17NewName = "Apple iPhone 17 (New)";
  const iphone17ProName = "Apple iPhone 17 Pro (Like New)";
  const iphone17ProMaxName = "Apple iPhone 17 Pro Max (Like New)";

  return [
    {
      id: "20",
      name: iphone15Name,
      price: catalogPrice(iphone15Name, 3100),
      image: "/product-images/iphone-15.png",
      badge: "Popular",
      description:
        "The iPhone 15 features a 6.1-inch Super Retina XDR display with Dynamic Island, A16 Bionic chip, and a 48MP Main camera with 2x optical zoom. " +
        "USB-C charging, MagSafe support, and all-day battery life. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        IPHONE_UNLOCKED_FEATURE,
        "6.1-inch Super Retina XDR Display",
        "A16 Bionic Chip",
        "48MP Main Camera with 2x Zoom",
        "Dynamic Island",
        "USB-C and MagSafe",
        "5G Capable",
        "Face ID Security",
      ],
      specifications: {
        Display: "6.1-inch Super Retina XDR",
        Processor: "A16 Bionic chip",
        Storage: "256GB",
        Camera: "48MP Main + 12MP Ultra Wide",
        Battery: "Up to 26 hours video playback",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3, USB-C",
      },
    },
    {
      id: "16",
      name: iphone17CleanName,
      price: catalogPrice(iphone17CleanName, 4750),
      image: "/product-images/iphone-17.png",
      badge: "New Arrival",
      description:
        "The iPhone 17 features a 6.3-inch Super Retina XDR display with ProMotion up to 120Hz, A19 chip, and a 48MP Dual Fusion camera with 2x optical zoom. " +
        "Dynamic Island, Always-On display, Action button, and Camera Control. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        IPHONE_UNLOCKED_FEATURE,
        "6.3-inch Super Retina XDR with ProMotion 120Hz",
        "A19 Chip with Apple Intelligence",
        "48MP Dual Fusion Camera with 2x Zoom",
        "18MP Center Stage Front Camera",
        "Action Button and Camera Control",
        "Ceramic Shield 2 Front Glass",
        "MagSafe and Qi2 Wireless Charging",
      ],
      specifications: {
        Display: "6.3-inch Super Retina XDR with ProMotion",
        Processor: "A19 chip",
        Storage: "256GB",
        Camera: "48MP Fusion Main + 48MP Ultra Wide",
        Battery: "Up to 30 hours video playback",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 7, Bluetooth 6, USB-C",
      },
    },
    {
      id: "17",
      name: iphone17NewName,
      price: catalogPrice(iphone17NewName, 5600),
      image: "/product-images/iphone-17.png",
      badge: "Brand New",
      description:
        "The iPhone 17 features a 6.3-inch Super Retina XDR display with ProMotion up to 120Hz, A19 chip, and a 48MP Dual Fusion camera with 2x optical zoom. " +
        "Dynamic Island, Always-On display, Action button, and Camera Control. Brand new product. Inspected, tested, and certified.",
      features: [
        IPHONE_UNLOCKED_FEATURE,
        "6.3-inch Super Retina XDR with ProMotion 120Hz",
        "A19 Chip with Apple Intelligence",
        "48MP Dual Fusion Camera with 2x Zoom",
        "18MP Center Stage Front Camera",
        "Action Button and Camera Control",
        "Ceramic Shield 2 Front Glass",
        "MagSafe and Qi2 Wireless Charging",
        "Brand new with accessories included",
      ],
      specifications: {
        Display: "6.3-inch Super Retina XDR with ProMotion",
        Processor: "A19 chip",
        Storage: "256GB",
        Camera: "48MP Fusion Main + 48MP Ultra Wide",
        Battery: "Up to 30 hours video playback",
        Connectivity: "5G, Wi-Fi 7, Bluetooth 6, USB-C",
      },
    },
    {
      id: "18",
      name: iphone17ProName,
      price: catalogPrice(iphone17ProName, 7000),
      image: "/product-images/iphone-17-pro.png",
      badge: "Pro",
      description:
        "The iPhone 17 Pro features a 6.3-inch Super Retina XDR display, A19 Pro chip, and a 48MP Pro Fusion camera with 4x telephoto and up to 8x optical-quality zoom. " +
        "Aluminum unibody design with Ceramic Shield 2 and vapor chamber cooling. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        IPHONE_UNLOCKED_FEATURE,
        "6.3-inch Super Retina XDR with ProMotion 120Hz",
        "A19 Pro Chip with Apple Intelligence",
        "48MP Pro Fusion Camera with 4x Telephoto",
        "18MP Center Stage Front Camera",
        "Aluminum Unibody with Ceramic Shield 2",
        "Action Button and Camera Control",
        "USB-C with USB 3 speeds up to 10Gb/s",
      ],
      specifications: {
        Display: "6.3-inch Super Retina XDR with ProMotion",
        Processor: "A19 Pro chip",
        Storage: "256GB",
        Camera: "48MP Main + 48MP Ultra Wide + 48MP 4x Telephoto",
        Battery: "Up to 33 hours video playback",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 7, Bluetooth 6, USB-C 3",
      },
    },
    {
      id: "19",
      name: iphone17ProMaxName,
      price: catalogPrice(iphone17ProMaxName, 7800),
      image: "/product-images/iphone-17-pro-max.png",
      badge: "Pro Max",
      description:
        "The iPhone 17 Pro Max features a 6.9-inch Super Retina XDR display, A19 Pro chip, and the most advanced 48MP Pro Fusion camera on iPhone with 4x telephoto. " +
        "Aluminum unibody design with Ceramic Shield 2 and the longest Pro Max battery life yet. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        IPHONE_UNLOCKED_FEATURE,
        "6.9-inch Super Retina XDR with ProMotion 120Hz",
        "A19 Pro Chip with Apple Intelligence",
        "48MP Pro Fusion Camera with 4x Telephoto",
        "18MP Center Stage Front Camera",
        "Aluminum Unibody with Ceramic Shield 2",
        "Up to 39 Hours Video Playback",
        "USB-C with USB 3 speeds up to 10Gb/s",
      ],
      specifications: {
        Display: "6.9-inch Super Retina XDR with ProMotion",
        Processor: "A19 Pro chip",
        Storage: "256GB",
        Camera: "48MP Main + 48MP Ultra Wide + 48MP 4x Telephoto",
        Battery: "Up to 39 hours video playback",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 7, Bluetooth 6, USB-C 3",
      },
    },
  ];
}

export const NEW_IPHONE_PRODUCT_META: Record<string, NewIphoneProductMeta> = {
  "20": {
    yuan: 3100,
    filterSlug: "clean",
    colors: ["Black", "Blue", "Green", "Yellow", "Pink"],
    slug: "apple-iphone-15-256gb",
  },
  "16": {
    yuan: 4750,
    filterSlug: "clean",
    colors: ["Black", "White", "Mist Blue", "Sage", "Lavender"],
    slug: "apple-iphone-17",
  },
  "17": {
    yuan: 5600,
    filterSlug: "new",
    colors: ["Black", "White", "Mist Blue", "Sage", "Lavender"],
    slug: "apple-iphone-17-new",
  },
  "18": {
    yuan: 7000,
    filterSlug: "clean",
    colors: ["Silver", "Cosmic Orange", "Deep Blue"],
    slug: "apple-iphone-17-pro",
  },
  "19": {
    yuan: 7800,
    filterSlug: "clean",
    colors: ["Silver", "Cosmic Orange", "Deep Blue"],
    slug: "apple-iphone-17-pro-max",
  },
};

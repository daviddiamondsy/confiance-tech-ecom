import { priceFromYuan as computePriceFromYuan, DEFAULT_PRICING_CONFIG } from "@/lib/pricing";
import { defaultShippingForProductName } from "@/lib/product-shipping";
import {
  BATTERY_HEALTH_FEATURE,
  BATTERY_HEALTH_SPEC,
  IPHONE_QUALITY_TAIL,
} from "@/lib/device-quality-copy";
import type { Product } from "@/lib/product-utils";

type Iphone17CatalogProduct = Omit<Product, "slug"> & { id: string };

function catalogPrice(productName: string, yuan: number): number {
  return computePriceFromYuan(
    yuan,
    DEFAULT_PRICING_CONFIG,
    defaultShippingForProductName(productName)
  );
}

const IPHONE_17_IMAGES = {
  base: "/product-images/iphone-17.png",
  pro: "/product-images/iphone-17-pro.png",
  proMax: "/product-images/iphone-17-pro-max.png",
} as const;

/** Yuan costs from supplier (256GB). */
export const IPHONE_17_YUAN = {
  clean: 4750,
  new: 5600,
  proClean: 7000,
  proMaxClean: 7800,
} as const;

export const IPHONE_17_CATALOG_IDS = {
  clean: "16",
  new: "17",
  proClean: "18",
  proMaxClean: "19",
} as const;

export const IPHONE_17_FILTER_SLUGS = {
  clean: "clean",
  new: "new",
  proClean: "clean",
  proMaxClean: "clean",
} as const;

/** iPhone 17 lineup for catalog seed and targeted DB upserts. */
export function buildIphone17CatalogProducts(): Iphone17CatalogProduct[] {
  const cleanName = "Apple iPhone 17 (Clean)";
  const newName = "Apple iPhone 17 (New)";
  const proName = "Apple iPhone 17 Pro (Clean)";
  const proMaxName = "Apple iPhone 17 Pro Max (Clean)";

  return [
    {
      id: IPHONE_17_CATALOG_IDS.clean,
      name: cleanName,
      price: catalogPrice(cleanName, IPHONE_17_YUAN.clean),
      image: IPHONE_17_IMAGES.base,
      badge: "New Arrival",
      description:
        "The iPhone 17 features a 6.3-inch Super Retina XDR display with ProMotion up to 120Hz, A19 chip, and a 48MP Dual Fusion camera with 2x optical zoom. " +
        "Dynamic Island, Always-On display, Action button, and Camera Control. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
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
      id: IPHONE_17_CATALOG_IDS.new,
      name: newName,
      price: catalogPrice(newName, IPHONE_17_YUAN.new),
      image: IPHONE_17_IMAGES.base,
      badge: "Brand New",
      description:
        "The iPhone 17 features a 6.3-inch Super Retina XDR display with ProMotion up to 120Hz, A19 chip, and a 48MP Dual Fusion camera with 2x optical zoom. " +
        "Dynamic Island, Always-On display, Action button, and Camera Control. Brand new product. Inspected, tested, and certified.",
      features: [
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
      id: IPHONE_17_CATALOG_IDS.proClean,
      name: proName,
      price: catalogPrice(proName, IPHONE_17_YUAN.proClean),
      image: IPHONE_17_IMAGES.pro,
      badge: "Pro",
      description:
        "The iPhone 17 Pro features a 6.3-inch Super Retina XDR display, A19 Pro chip, and a 48MP Pro Fusion camera with 4x telephoto and up to 8x optical-quality zoom. " +
        "Aluminum unibody design with Ceramic Shield 2 and vapor chamber cooling. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
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
      id: IPHONE_17_CATALOG_IDS.proMaxClean,
      name: proMaxName,
      price: catalogPrice(proMaxName, IPHONE_17_YUAN.proMaxClean),
      image: IPHONE_17_IMAGES.proMax,
      badge: "Pro Max",
      description:
        "The iPhone 17 Pro Max features a 6.9-inch Super Retina XDR display, A19 Pro chip, and the most advanced 48MP Pro Fusion camera on iPhone with 4x telephoto. " +
        "Aluminum unibody design with Ceramic Shield 2 and the longest Pro Max battery life yet. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
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

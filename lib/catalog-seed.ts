import { priceFromYuan } from "@/lib/pricing";
import { BATTERY_HEALTH_FEATURE, BATTERY_HEALTH_SPEC, IPHONE_QUALITY_TAIL } from "@/lib/device-quality-copy";
import type { Product } from "@/lib/product-utils";

type CatalogProductSeed = Omit<Product, "slug">;

const PRODUCT_IMAGES = {
  iphone13: "/product-images/iphone-13.png",
  iphone13ProMax: "/product-images/iphone-13-pro-max.png",
  iphone14Pro: "/product-images/iphone-14-pro.png",
  iphone15ProMax: "/product-images/iphone-15-pro-max.jpg",
  iphone12ProMax: "/product-images/iphone-12-pro-max.png",
  iphone14ProMax: "/product-images/iphone-14-pro-max.png",
  macbookPro: "/product-images/macbook-pro-m4.png",
  galaxyS24Ultra: "/product-images/galaxy-s24.png",
} as const;

/** Canonical catalog used for static fallback and Postgres seeding. */
export function buildCatalogProducts(): CatalogProductSeed[] {
  return [
    {
      id: "6",
      name: "Apple iPhone 13 (Clean)",
      price: priceFromYuan(1400),
      image: PRODUCT_IMAGES.iphone13,
      badge: "Popular",
      description:
        "The iPhone 13 features a brighter Super Retina XDR display, A15 Bionic chip, and advanced dual-camera system with Cinematic mode. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        "6.1-inch Super Retina XDR Display",
        "A15 Bionic Chip",
        "5G Capable",
        "Dual 12MP Camera with Cinematic Mode",
        "MagSafe Compatible",
        "Face ID Security",
      ],
      specifications: {
        Display: "6.1-inch Super Retina XDR",
        Processor: "A15 Bionic chip",
        Storage: "128GB",
        Camera: "Dual 12MP Wide + Ultra Wide",
        Battery: "Up to 19 hours video",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.0",
      },
      storageOptions: [
        { storage: "128GB", price: priceFromYuan(1400) },
        { storage: "256GB", price: priceFromYuan(1700) },
      ],
    },
    {
      id: "7",
      name: "Apple iPhone 14 Pro 256GB (Clean)",
      price: priceFromYuan(3000),
      image: PRODUCT_IMAGES.iphone14Pro,
      description:
        "The iPhone 14 Pro introduces Dynamic Island, Always-On display, A16 Bionic chip, and a 48MP Pro camera system. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        "6.1-inch Super Retina XDR with Dynamic Island",
        "A16 Bionic Chip",
        "Always-On Display",
        "48MP Pro Camera System",
        "ProMotion 120Hz",
        "Face ID Security",
      ],
      specifications: {
        Display: "6.1-inch Super Retina XDR with ProMotion",
        Processor: "A16 Bionic chip",
        Storage: "256GB",
        Camera: "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
        Battery: "Up to 23 hours video",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
      },
    },
    {
      id: "8",
      name: "Apple iPhone 15 Pro Max (Clean)",
      price: priceFromYuan(4600),
      image: PRODUCT_IMAGES.iphone15ProMax,
      description:
        "The iPhone 15 Pro Max features a titanium design, A17 Pro chip, Action button, and the most advanced camera system on iPhone. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        "6.7-inch Super Retina XDR Display",
        "A17 Pro Chip",
        "Titanium Design",
        "48MP Pro Camera with 5x Telephoto",
        "Action Button",
        "USB-C with USB 3 speeds",
      ],
      specifications: {
        Display: "6.7-inch Super Retina XDR with ProMotion",
        Processor: "A17 Pro chip",
        Storage: "256GB",
        Camera: "48MP Main + 12MP Ultra Wide + 12MP 5x Telephoto",
        Battery: "Up to 29 hours video",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6E, Bluetooth 5.3",
      },
      storageOptions: [
        { storage: "256GB", price: priceFromYuan(4600) },
        { storage: "512GB", price: priceFromYuan(5100) },
      ],
    },
    {
      id: "9",
      name: "Apple iPhone 12 Pro Max (Clean)",
      price: priceFromYuan(2000),
      image: PRODUCT_IMAGES.iphone12ProMax,
      description:
        "The iPhone 12 Pro Max features a 6.7-inch Super Retina XDR display, A14 Bionic chip, and a pro camera system with LiDAR. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        "6.7-inch Super Retina XDR Display",
        "A14 Bionic Chip",
        "5G Capable",
        "Pro 12MP Camera System with LiDAR",
        "MagSafe Compatible",
        "Face ID Security",
      ],
      specifications: {
        Display: "6.7-inch Super Retina XDR",
        Processor: "A14 Bionic chip",
        Storage: "256GB",
        Camera: "12MP Wide + 12MP Ultra Wide + 12MP Telephoto",
        Battery: "Up to 20 hours video",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.0",
      },
      storageOptions: [
        { storage: "256GB", price: priceFromYuan(2000) },
        { storage: "512GB", price: priceFromYuan(2200) },
      ],
    },
    {
      id: "10",
      name: "Apple iPhone 14 Pro Max (Clean)",
      price: priceFromYuan(3500),
      image: PRODUCT_IMAGES.iphone14ProMax,
      badge: "Popular",
      description:
        "The iPhone 14 Pro Max features Dynamic Island, Always-On display, A16 Bionic chip, and a 48MP Pro camera system on a 6.7-inch display. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        "6.7-inch Super Retina XDR with Dynamic Island",
        "A16 Bionic Chip",
        "Always-On Display",
        "48MP Pro Camera System",
        "ProMotion 120Hz",
        "Face ID Security",
      ],
      specifications: {
        Display: "6.7-inch Super Retina XDR with ProMotion",
        Processor: "A16 Bionic chip",
        Storage: "256GB",
        Camera: "48MP Main + 12MP Ultra Wide + 12MP Telephoto",
        Battery: "Up to 29 hours video",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
      },
      storageOptions: [
        { storage: "256GB", price: priceFromYuan(3500) },
        { storage: "512GB", price: priceFromYuan(3900) },
      ],
    },
    {
      id: "12",
      name: "Apple iPhone 13 Pro Max (Clean)",
      price: priceFromYuan(2550),
      image: PRODUCT_IMAGES.iphone13ProMax,
      badge: "Popular",
      description:
        "The iPhone 13 Pro Max features a 6.7-inch Super Retina XDR display with ProMotion, A15 Bionic chip, and a pro camera system with 3x telephoto. " +
        IPHONE_QUALITY_TAIL,
      features: [
        BATTERY_HEALTH_FEATURE,
        "6.7-inch Super Retina XDR with ProMotion",
        "A15 Bionic Chip",
        "Pro 12MP Camera System",
        "Cinematic Mode",
        "MagSafe Compatible",
        "Face ID Security",
      ],
      specifications: {
        Display: "6.7-inch Super Retina XDR with ProMotion",
        Processor: "A15 Bionic chip",
        Storage: "256GB",
        Camera: "12MP Wide + 12MP Ultra Wide + 12MP Telephoto",
        Battery: "Up to 28 hours video",
        "Battery health": BATTERY_HEALTH_SPEC,
        Connectivity: "5G, Wi-Fi 6, Bluetooth 5.0",
      },
      storageOptions: [
        { storage: "256GB", price: priceFromYuan(2550) },
        { storage: "512GB", price: priceFromYuan(3000) },
      ],
    },
    {
      id: "11",
      name: "Apple MacBook Pro M4 24GB 512GB (New)",
      price: priceFromYuan(10500),
      image: PRODUCT_IMAGES.macbookPro,
      badge: "New",
      description:
        "MacBook Pro with Apple M4 chip, 24GB unified memory, and 512GB SSD. Brand new product. Inspected, tested, and certified.",
      features: [
        "Apple M4 Chip",
        "24GB Unified Memory",
        "512GB SSD Storage",
        "Liquid Retina XDR Display",
        "All-day Battery Life",
        "MagSafe 3 Charging",
      ],
      specifications: {
        Processor: "Apple M4 chip",
        Memory: "24GB unified memory",
        Storage: "512GB SSD",
        Display: "Liquid Retina XDR",
        Battery: "Up to 22 hours",
        Connectivity: "Wi-Fi 6E, Bluetooth 5.3, Thunderbolt 4",
      },
    },
    {
      id: "13",
      name: "Samsung Galaxy S24 Ultra (Clean)",
      price: priceFromYuan(4200),
      image: PRODUCT_IMAGES.galaxyS24Ultra,
      badge: "Popular",
      description:
        "Samsung Galaxy S24 Ultra with a 6.8-inch QHD+ Dynamic AMOLED 2X display, Snapdragon 8 Gen 3 for Galaxy, " +
        "200MP adaptive camera, and built-in S Pen. Clean condition. Inspected, tested, and certified.",
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
      specifications: {
        Display: "6.8-inch QHD+ Dynamic AMOLED 2X",
        Processor: "Snapdragon 8 Gen 3 for Galaxy",
        Storage: "256GB",
        Camera: "200MP Wide + 12MP Ultra Wide + 10MP Telephoto",
        Battery: "5000mAh",
        Connectivity: "5G, Wi-Fi 7, Bluetooth 5.3",
      },
      storageOptions: [
        { storage: "256GB", price: priceFromYuan(4200) },
        { storage: "512GB", price: priceFromYuan(4400) },
      ],
    },
  ];
}

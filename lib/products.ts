import type { Product } from "@/lib/product-utils";

export type { Product, StorageOption } from "@/lib/product-utils";
export { getSelectedVariant, getDisplaySpecs } from "@/lib/product-utils";

export const products: Product[] = [
  {
    id: "6",
    name: "Apple iPhone 13 256GB (Grade A)",
    price: 480000,
    rating: 4.8,
    reviews: 654,
    image: "/iphone-images/iphone-13.jpg",
    badge: "Popular",
    description:
      "The iPhone 13 features a brighter Super Retina XDR display, A15 Bionic chip, and advanced dual-camera system with Cinematic mode. Clean Grade A condition with accessories included. Inspected, tested, and certified.",
    features: [
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
      Storage: "256GB",
      Camera: "Dual 12MP Wide + Ultra Wide",
      Battery: "Up to 19 hours video",
      Connectivity: "5G, Wi-Fi 6, Bluetooth 5.0",
    },
  },
  {
    id: "7",
    name: "Apple iPhone 14 Pro 256GB (Grade A)",
    price: 770000,
    rating: 4.9,
    reviews: 421,
    image: "/iphone-images/iphone-14-pro.jpg",
    description:
      "The iPhone 14 Pro introduces Dynamic Island, Always-On display, A16 Bionic chip, and a 48MP Pro camera system. Clean Grade A condition with accessories included. Inspected, tested, and certified.",
    features: [
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
      Connectivity: "5G, Wi-Fi 6, Bluetooth 5.3",
    },
  },
  {
    id: "8",
    name: "Apple iPhone 15 Pro Max (Grade A)",
    price: 1150000,
    rating: 4.9,
    reviews: 312,
    image: "/iphone-images/iphone-15-pro-max.jpg",
    badge: "New",
    description:
      "The iPhone 15 Pro Max features a titanium design, A17 Pro chip, Action button, and the most advanced camera system on iPhone. Clean Grade A condition with accessories included. Inspected, tested, and certified.",
    features: [
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
      Connectivity: "5G, Wi-Fi 6E, Bluetooth 5.3",
    },
    storageOptions: [
      { storage: "256GB", price: 1150000 },
      { storage: "512GB", price: 1300000 },
    ],
  },
];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

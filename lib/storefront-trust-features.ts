import { Headphones, Package, Shield, Truck, type LucideIcon } from "lucide-react";
import { DELIVERY_ESTIMATE_COPY } from "@/lib/delivery-deadline";

export interface StorefrontTrustFeature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const STOREFRONT_TRUST_FEATURES: StorefrontTrustFeature[] = [
  {
    icon: Truck,
    title: "Fast Delivery",
    description: DELIVERY_ESTIMATE_COPY,
  },
  {
    icon: Package,
    title: "With Accessories",
    description: "Comes with charger",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round the clock help",
  },
  {
    icon: Shield,
    title: "Clean Devices",
    description: "Inspected before every shipment",
  },
];

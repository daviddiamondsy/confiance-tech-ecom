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
    title: "Free & Fast Delivery",
    description: DELIVERY_ESTIMATE_COPY,
  },
  {
    icon: Package,
    title: "With Accessories",
    description: "Add-ons for a better experience",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round the clock help",
  },
  {
    icon: Shield,
    title: "Brand New & UK Grade A",
    description: "Computing devices inspected before every shipment",
  },
];

/** Product detail pages list included accessories explicitly. */
export const PRODUCT_DETAIL_TRUST_FEATURES: StorefrontTrustFeature[] =
  STOREFRONT_TRUST_FEATURES.map((feature) =>
    feature.title === "With Accessories"
      ? {
          ...feature,
          description: "Charger, screen guard, and protective case included",
        }
      : feature
  );

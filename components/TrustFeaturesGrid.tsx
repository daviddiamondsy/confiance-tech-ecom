import { cn } from "@/lib/utils";
import {
  PRODUCT_DETAIL_TRUST_FEATURES,
  STOREFRONT_TRUST_FEATURES,
  type StorefrontTrustFeature,
} from "@/lib/storefront-trust-features";

interface TrustFeaturesGridProps {
  variant?: "homepage" | "compact" | "product-detail";
  className?: string;
}

function featuresForVariant(variant: TrustFeaturesGridProps["variant"]): StorefrontTrustFeature[] {
  return variant === "product-detail" ? PRODUCT_DETAIL_TRUST_FEATURES : STOREFRONT_TRUST_FEATURES;
}

export default function TrustFeaturesGrid({ variant = "homepage", className }: TrustFeaturesGridProps) {
  const features = featuresForVariant(variant);

  if (variant === "compact" || variant === "product-detail") {
    return (
      <div
        className={cn(
          "grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft",
          className
        )}
      >
        {features.map((feature) => (
          <div key={feature.title} className="text-center">
            <feature.icon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">{feature.title}</p>
            {feature.description ? (
              <p className="text-xs text-slate-500 mt-1 leading-snug">{feature.description}</p>
            ) : null}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {features.map((feature) => (
        <div
          key={feature.title}
          className="group card-elevated p-5 flex flex-col sm:flex-row sm:items-start gap-4 hover:-translate-y-1 hover:border-primary-100 hover:shadow-card-hover transition-all duration-300"
        >
          <div className="h-12 w-12 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow group-hover:scale-110 transition-transform duration-300">
            <feature.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-sm leading-snug">{feature.title}</h3>
            {feature.description ? (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{feature.description}</p>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

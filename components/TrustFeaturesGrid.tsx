import { cn } from "@/lib/utils";
import { STOREFRONT_TRUST_FEATURES } from "@/lib/storefront-trust-features";

interface TrustFeaturesGridProps {
  variant?: "homepage" | "compact";
  className?: string;
}

export default function TrustFeaturesGrid({ variant = "homepage", className }: TrustFeaturesGridProps) {
  if (variant === "compact") {
    return (
      <div
        className={cn(
          "grid grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft",
          className
        )}
      >
        {STOREFRONT_TRUST_FEATURES.map((feature) => (
          <div key={feature.title} className="text-center">
            <feature.icon className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-900">{feature.title}</p>
            <p className="text-xs text-slate-500 mt-1 leading-snug">{feature.description}</p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {STOREFRONT_TRUST_FEATURES.map((feature) => (
        <div
          key={feature.title}
          className="card-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-0.5"
        >
          <div className="h-11 w-11 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
            <feature.icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-slate-900 text-sm">{feature.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

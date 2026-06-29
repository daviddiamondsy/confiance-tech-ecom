import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type StatCardVariant = "indigo" | "emerald" | "amber" | "rose";

interface AdminStatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  variant?: StatCardVariant;
}

const variantStyles: Record<StatCardVariant, { icon: string; accent: string }> = {
  indigo: {
    icon: "bg-primary-50 text-primary-600",
    accent: "border-l-primary-400",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-600",
    accent: "border-l-emerald-400",
  },
  amber: {
    icon: "bg-amber-50 text-amber-600",
    accent: "border-l-amber-400",
  },
  rose: {
    icon: "bg-rose-50 text-rose-600",
    accent: "border-l-rose-400",
  },
};

export default function AdminStatCard({
  label,
  value,
  hint,
  icon: Icon,
  variant = "indigo",
}: AdminStatCardProps) {
  const styles = variantStyles[variant];
  return (
    <div
      className={cn(
        "card-elevated p-5 flex items-start gap-4 border-l-4",
        styles.accent
      )}
    >
      <div className={cn("rounded-xl p-3 shrink-0", styles.icon)}>
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="font-display text-2xl font-bold text-slate-900 mt-0.5 truncate">{value}</p>
        {hint && <p className="text-xs text-slate-500 mt-1 leading-relaxed">{hint}</p>}
      </div>
    </div>
  );
}

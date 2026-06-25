import type { LucideIcon } from "lucide-react";

interface AdminStatCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
}

export default function AdminStatCard({ label, value, hint, icon: Icon }: AdminStatCardProps) {
  return (
    <div className="card-elevated p-5 flex items-start gap-4">
      <div className="rounded-xl bg-primary-50 p-3 text-primary-700">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        <p className="font-display text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {hint && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
    </div>
  );
}

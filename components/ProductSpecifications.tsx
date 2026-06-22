"use client";

interface ProductSpecificationsProps {
  specs: Record<string, string>;
  className?: string;
}

export default function ProductSpecifications({
  specs,
  className = "",
}: ProductSpecificationsProps) {
  return (
    <dl className={`divide-y divide-slate-100 ${className}`}>
      {Object.entries(specs).map(([key, value]) => (
        <div key={key} className="py-4 first:pt-0 last:pb-0">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1.5">
            {key}
          </dt>
          <dd className="text-sm font-medium text-slate-900 leading-relaxed">
            {value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

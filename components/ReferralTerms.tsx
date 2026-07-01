"use client";

import { useState } from "react";
import { ChevronDown, ScrollText } from "lucide-react";
import { buildReferralTermsSections } from "@/lib/referral/terms";
import { cn } from "@/lib/utils";

const TERMS_SECTIONS = buildReferralTermsSections();

export default function ReferralTerms() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="card-elevated p-8">
      <div className="flex items-center gap-2 mb-2">
        <ScrollText className="h-5 w-5 text-primary-600" />
        <h2 className="font-display text-xl font-bold text-slate-900">Terms &amp; conditions</h2>
      </div>
      <p className="text-sm text-slate-500 mb-6">
        Please read these rules before sharing your referral link or using a friend discount.
      </p>

      <div className="space-y-3">
        {TERMS_SECTIONS.map((section, index) => {
          const isOpen = openIndex === index;

          return (
            <div
              key={section.title}
              className={cn(
                "rounded-2xl border transition-all duration-300 overflow-hidden",
                isOpen
                  ? "border-primary-200 bg-primary-50/60"
                  : "border-slate-200 bg-white hover:border-primary-100 hover:bg-primary-50/20"
              )}
            >
              <button
                type="button"
                className="w-full flex items-center justify-between gap-4 p-4 text-left"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                aria-expanded={isOpen}
              >
                <span className="font-display font-semibold text-slate-900">{section.title}</span>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 text-slate-400 flex-shrink-0 transition-transform duration-300",
                    isOpen && "rotate-180 text-primary-600"
                  )}
                />
              </button>
              <div
                className={cn(
                  "grid transition-all duration-300 ease-in-out",
                  isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                )}
              >
                <div className="overflow-hidden">
                  <ul className="px-4 pb-4 space-y-2 text-sm text-slate-600 leading-relaxed list-disc list-inside">
                    {section.items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

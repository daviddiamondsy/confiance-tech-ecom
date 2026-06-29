"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { DELIVERY_ESTIMATE_COPY } from "@/lib/delivery-deadline";
import { GRADE_A_FAQ_ANSWER } from "@/lib/device-quality-copy";

const faqs = [
  {
    question: "What does brand new and UK Grade A mean?",
    answer: GRADE_A_FAQ_ANSWER,
  },
  {
    question: "How do I place an order?",
    answer:
      "Browse our products, select the one you want, and fill out the order form with your name, address, state, and phone number. We will contact you to confirm your order.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept bank transfers, mobile money, and cash on delivery. Payment details will be shared when we contact you to confirm your order.",
  },
  {
    question: "How long does delivery take?",
    answer:
      `Delivery typically takes ${DELIVERY_ESTIMATE_COPY} depending on your location. We will provide an estimated delivery date when confirming your order.`,
  },
  {
    question: "Can I return a product?",
    answer:
      "Yes, we offer a 7-day return policy for defective or damaged items. Please contact us immediately if you receive a faulty product.",
  },
  {
    question: "How can I contact you?",
    answer:
      "Reach us via WhatsApp or call at 07065093454.",
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-3">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className={cn(
              "rounded-2xl border transition-all duration-300 overflow-hidden",
              isOpen
                ? "border-primary-200 bg-primary-50/60 shadow-soft"
                : "border-slate-200 bg-white hover:border-primary-100 hover:bg-primary-50/20"
            )}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between gap-4 p-5 text-left"
              onClick={() => setOpenIndex(isOpen ? null : index)}
              aria-expanded={isOpen}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={cn(
                  "flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold transition-colors",
                  isOpen ? "bg-primary-600 text-white" : "bg-slate-100 text-slate-500"
                )}>
                  {index + 1}
                </span>
                <span className="font-display font-semibold text-slate-900">{faq.question}</span>
              </div>
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
                <p className="px-5 pb-5 pl-[60px] text-slate-600 leading-relaxed">{faq.answer}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

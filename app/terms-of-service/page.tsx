import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ScrollText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - Confiance Tech",
  description:
    "Terms of Service for the Confiance Tech WhatsApp chatbot and Meta app. Read the rules governing use of our WhatsApp shopping assistant.",
};

const EFFECTIVE_DATE = "4 July 2026";
const CONTACT_EMAIL = "support@confiance-tech.com";
const CONTACT_WHATSAPP = "+234 706 509 3454";

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: [
      "These Terms of Service ('Terms') govern your use of the Confiance Tech WhatsApp chatbot ('Chatbot') and any services accessed through it. By sending a message to our WhatsApp number or interacting with our Chatbot, you agree to these Terms.",
      "If you do not agree with any part of these Terms, please do not use the Chatbot.",
    ],
  },
  {
    title: "2. About the Chatbot",
    content: [
      "The Confiance Tech Chatbot is a WhatsApp-based shopping assistant that allows customers to browse products, place orders, track deliveries, and get support. It operates through the WhatsApp Business Platform provided by Meta Platforms, Inc.",
    ],
  },
  {
    title: "3. Eligibility",
    items: [
      "You must be at least 18 years old to use the Chatbot and place orders.",
      "You must have a valid WhatsApp account in good standing.",
      "You must provide accurate information, including your delivery address and contact details, when placing an order.",
    ],
  },
  {
    title: "4. Placing Orders",
    content: [
      "When you place an order through the Chatbot, you are making an offer to purchase a product at the stated price. An order is only confirmed once you receive an explicit confirmation message from the Chatbot or our team.",
    ],
    items: [
      "Prices shown are in Nigerian Naira (NGN) and are subject to change without notice.",
      "Product availability is not guaranteed and may change between the time you enquire and the time you confirm your order.",
      "We reserve the right to cancel any order at our discretion, in which case you will receive a full refund of any payment made.",
    ],
  },
  {
    title: "5. Payment",
    content: [
      "Payment is required before an order is dispatched. We accept bank transfer and any other payment methods communicated to you through the Chatbot. It is your responsibility to use the correct payment reference so your order can be matched to your payment.",
    ],
  },
  {
    title: "6. Delivery",
    content: [
      "We ship nationwide across Nigeria. Estimated delivery timelines are provided at the time of order and are indicative only. Delays caused by third-party logistics providers or circumstances beyond our control do not entitle you to cancel an already-dispatched order.",
    ],
  },
  {
    title: "7. Returns and Refunds",
    content: [
      "We offer a 7-day return window from the date of delivery for items that are faulty or materially different from what was ordered. Items must be returned in their original condition with all accessories.",
    ],
    items: [
      "Refunds are processed within 3-5 business days of receiving the returned item.",
      "Change-of-mind returns are not accepted.",
      "Damage caused by misuse is not covered.",
    ],
  },
  {
    title: "8. Referral Program",
    content: [
      "From time to time we operate a referral programme. Referral credits are subject to the referral terms displayed at confiance-tech.vercel.app/refer. We reserve the right to modify or discontinue the referral programme at any time.",
    ],
  },
  {
    title: "9. Acceptable Use",
    content: [
      "When using the Chatbot, you agree not to:",
    ],
    items: [
      "Send spam, abusive, threatening, or unlawful messages.",
      "Attempt to manipulate the Chatbot to obtain unauthorised discounts, credits, or information.",
      "Impersonate another person or provide false contact or delivery information.",
      "Attempt to reverse-engineer, scrape, or interfere with the Chatbot or its underlying systems.",
    ],
  },
  {
    title: "10. WhatsApp Platform Rules",
    content: [
      "Your use of the Chatbot is subject to WhatsApp's Terms of Service (whatsapp.com/legal/terms-of-service) and Meta's Platform Terms (developers.facebook.com/terms). We are not responsible for disruptions caused by changes to Meta's or WhatsApp's policies or platform.",
    ],
  },
  {
    title: "11. Intellectual Property",
    content: [
      "All content, branding, and Chatbot logic is the property of Confiance Tech. You may not reproduce, distribute, or create derivative works from our content without our prior written consent.",
    ],
  },
  {
    title: "12. Limitation of Liability",
    content: [
      "To the maximum extent permitted by applicable law, Confiance Tech is not liable for indirect, incidental, or consequential damages arising from your use of the Chatbot or any products purchased through it. Our liability for any claim arising from an order is limited to the purchase price of that order.",
    ],
  },
  {
    title: "13. Governing Law",
    content: [
      "These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes shall be resolved in the courts of Lagos State, Nigeria.",
    ],
  },
  {
    title: "14. Contact Us",
    content: [
      "If you have questions about these Terms or a dispute related to an order, please contact us:",
    ],
    items: [
      `Email: ${CONTACT_EMAIL}`,
      `WhatsApp: ${CONTACT_WHATSAPP}`,
      "Instagram: @confiance_tech",
    ],
  },
  {
    title: "15. Changes to These Terms",
    content: [
      "We may update these Terms from time to time. The effective date at the top of this page will reflect the latest version. Continued use of the Chatbot after updates are posted constitutes acceptance of the revised Terms.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      {/* Page header */}
      <section className="bg-slate-950 text-white py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-primary-300 text-sm font-medium rounded-full mb-6 border border-white/10">
            <ScrollText className="h-4 w-4" />
            Legal
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Terms of Service
          </h1>
          <p className="text-slate-400 text-base">
            Effective date: {EFFECTIVE_DATE}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            These terms apply to the Confiance Tech WhatsApp chatbot and Meta app.
          </p>
        </div>
      </section>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 md:py-20">
        <div className="bg-white rounded-3xl shadow-soft border border-slate-100 p-8 md:p-12 space-y-10">
          {sections.map((section) => (
            <div key={section.title}>
              <h2 className="font-display text-lg font-bold text-slate-900 mb-3">
                {section.title}
              </h2>
              {section.content?.map((para, i) => (
                <p key={i} className="text-slate-600 text-sm leading-relaxed mb-3">
                  {para}
                </p>
              ))}
              {section.items && (
                <ul className="mt-2 space-y-2 text-sm text-slate-600 list-disc list-inside leading-relaxed">
                  {section.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

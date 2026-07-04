import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - Confiance Tech",
  description:
    "Privacy Policy for the Confiance Tech WhatsApp chatbot and Meta app. Learn how we collect, use, and protect your personal data.",
};

const EFFECTIVE_DATE = "4 July 2026";
const CONTACT_EMAIL = "support@confiance-tech.com";
const CONTACT_WHATSAPP = "+234 706 509 3454";

const sections = [
  {
    title: "1. Introduction",
    content: [
      "Confiance Tech ('we', 'us', or 'our') operates a WhatsApp-based shopping assistant (the 'Chatbot') built on the WhatsApp Business Platform provided by Meta Platforms, Inc. This Privacy Policy explains how we collect, use, store, and protect information when you interact with our Chatbot.",
      "By messaging our WhatsApp number or interacting with our Chatbot, you agree to the practices described in this policy.",
    ],
  },
  {
    title: "2. Information We Collect",
    items: [
      "WhatsApp display name and phone number, provided automatically by the WhatsApp platform when you initiate a conversation.",
      "Messages you send to the Chatbot, including product enquiries, order requests, and support questions.",
      "Order details you provide during a purchase, such as delivery address, preferred device, and payment confirmation.",
      "Referral codes or discount codes you share or redeem through the Chatbot.",
      "Session state data (e.g. which step of an order you are on) stored temporarily to maintain conversation flow.",
    ],
  },
  {
    title: "3. How We Use Your Information",
    items: [
      "To process and fulfil your product orders placed via the Chatbot.",
      "To send you order confirmations, delivery updates, and support replies through WhatsApp.",
      "To manage referral and discount credits linked to your phone number.",
      "To improve the Chatbot's responses and identify common customer questions.",
      "To comply with applicable laws and resolve disputes.",
    ],
  },
  {
    title: "4. Data Storage and Retention",
    content: [
      "Conversation session data is stored in an encrypted Redis cache and expires automatically after a period of inactivity (typically 24 hours). Order records are retained in our database for as long as required to fulfil the order and meet legal obligations.",
      "We do not store the full content of every message indefinitely. Logs used for debugging are retained for a limited period and then deleted.",
    ],
  },
  {
    title: "5. Sharing Your Information",
    content: [
      "We do not sell, rent, or trade your personal data. We may share data only in the following circumstances:",
    ],
    items: [
      "With delivery partners and logistics providers strictly to fulfil your order.",
      "With payment processors to verify and complete transactions.",
      "With Meta Platforms, Inc. as required by the WhatsApp Business Platform terms (see Meta's Privacy Policy at facebook.com/privacy/policy).",
      "With law enforcement or regulators when required by applicable Nigerian law.",
    ],
  },
  {
    title: "6. WhatsApp and Meta",
    content: [
      "Our Chatbot operates through the WhatsApp Business API. When you message us on WhatsApp, your data is also subject to Meta's Privacy Policy and WhatsApp's Privacy Policy. We encourage you to review those policies. We access only the data Meta makes available to us through the API and use it solely for the purposes described in this policy.",
    ],
  },
  {
    title: "7. Data Security",
    content: [
      "We implement technical and organisational measures to protect your personal data, including encrypted data transmission (HTTPS/TLS), access controls, and secure credential management. No method of transmission over the internet is 100% secure, but we take reasonable steps to safeguard your information.",
    ],
  },
  {
    title: "8. Your Rights",
    content: [
      "You have the right to request access to, correction of, or deletion of your personal data held by us. To exercise any of these rights, contact us using the details in Section 10 below. We will respond within a reasonable timeframe.",
    ],
  },
  {
    title: "9. Children's Privacy",
    content: [
      "Our Chatbot and services are intended for users aged 18 and above. We do not knowingly collect personal data from anyone under 18. If you believe a minor has provided us with personal information, please contact us so we can delete it.",
    ],
  },
  {
    title: "10. Contact Us",
    content: [
      `If you have any questions about this Privacy Policy or wish to exercise your data rights, you can reach us at:`,
    ],
    items: [
      `Email: ${CONTACT_EMAIL}`,
      `WhatsApp: ${CONTACT_WHATSAPP}`,
      "Instagram: @confiance_tech",
    ],
  },
  {
    title: "11. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. When we do, we will update the effective date at the top of this page. Continued use of our Chatbot after changes are posted constitutes acceptance of the updated policy.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      {/* Page header */}
      <section className="bg-slate-950 text-white py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-primary-300 text-sm font-medium rounded-full mb-6 border border-white/10">
            <ShieldCheck className="h-4 w-4" />
            Legal
          </span>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-400 text-base">
            Effective date: {EFFECTIVE_DATE}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            This policy applies to the Confiance Tech WhatsApp chatbot and Meta app.
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

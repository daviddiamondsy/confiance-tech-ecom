import Link from "next/link";
import { ArrowRight, Gift, Share2, Sparkles, Wallet } from "lucide-react";
import {
  formatNgn,
  formatReferralTierRange,
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_MIN_CATALOG_PRICE_NGN,
  REFERRAL_TIERS,
  STORE_CREDIT_EXPIRY_MONTHS,
} from "@/lib/referral/config";

const STEPS = [
  {
    icon: Share2,
    title: "Share your link",
    description: "Send your personal link to a friend buying their first device from us.",
  },
  {
    icon: Sparkles,
    title: "They save at checkout",
    description: "Friends get an automatic discount on their first order.",
  },
  {
    icon: Wallet,
    title: "You earn store points",
    description: "Receive store points after their order completes and the return window closes.",
  },
] as const;

export default function HomeReferAndEarn() {
  return (
    <section id="refer" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white shadow-soft">
          <div className="absolute inset-0 bg-hero-mesh opacity-40 pointer-events-none" />
          <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl pointer-events-none" />

          <div className="relative p-8 md:p-12 lg:p-14">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-start">
              <div>
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-primary-200 text-xs font-medium uppercase tracking-wider mb-5">
                  <Gift className="h-3.5 w-3.5" />
                  Refer & Earn
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Share Confiance Tech. Earn store points.
                </h2>
                <p className="text-slate-300 leading-relaxed mb-8 max-w-xl">
                  Past buyers get a personal referral link. Friends save on their first order. You earn
                  store points to use on your next purchase within {STORE_CREDIT_EXPIRY_MONTHS} months.
                  Rewards are store points, not cash.
                </p>

                <div className="space-y-4 mb-8">
                  {STEPS.map((step) => (
                    <div key={step.title} className="flex gap-4">
                      <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <step.icon className="h-5 w-5 text-primary-300" />
                      </div>
                      <div>
                        <h3 className="font-display font-semibold text-white text-sm">{step.title}</h3>
                        <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/refer"
                  className="inline-flex items-center gap-2 rounded-xl bg-white text-slate-900 px-6 py-3.5 text-sm font-semibold hover:bg-primary-50 transition-colors"
                >
                  Get my referral link
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 md:p-8">
                <h3 className="font-display text-lg font-bold text-white mb-1">Reward tiers</h3>
                <p className="text-sm text-slate-400 mb-6">
                  Based on your friend&apos;s catalog price. Amounts are fixed per tier.
                  Links stay active for {REFERRAL_ATTRIBUTION_DAYS} days.
                  Referral discounts apply to device orders priced at least {formatNgn(REFERRAL_MIN_CATALOG_PRICE_NGN)}.
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-white/10 text-slate-400">
                        <th className="py-2 pr-4 font-medium">Price tier</th>
                        <th className="py-2 pr-4 font-medium">Friend saves</th>
                        <th className="py-2 font-medium">You earn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {REFERRAL_TIERS.map((tier) => (
                        <tr key={tier.id} className="border-b border-white/5 last:border-0">
                          <td className="py-3 pr-4">
                            <span className="block text-white">{tier.label}</span>
                            <span className="block text-xs text-slate-400 mt-0.5">
                              {formatReferralTierRange(tier)}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-primary-200">
                            {formatNgn(tier.refereeDiscountNgn)}
                          </td>
                          <td className="py-3 text-white">
                            {formatNgn(tier.referrerCreditNgn)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

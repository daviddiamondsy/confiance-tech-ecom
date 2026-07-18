"use client";

import { Gift } from "lucide-react";
import { formatNgn } from "@/lib/referral/config";
import { useReferralDiscount } from "@/components/useReferralDiscount";

export {
  REFERRAL_STORAGE_KEY,
  REFERRAL_CODE_EVENT,
  persistReferralCode,
  readPersistedReferralCode,
  clearPersistedReferralCode,
  captureReferralCodeFromUrl,
} from "@/components/useReferralDiscount";

interface ReferralDiscountBannerProps {
  catalogPriceNgn: number;
}

export default function ReferralDiscountBanner({ catalogPriceNgn }: ReferralDiscountBannerProps) {
  const { discountNgn, referrerName, loading } = useReferralDiscount(catalogPriceNgn);

  if (loading || !discountNgn) {
    return null;
  }

  const friendLine = referrerName
    ? `Your friend ${referrerName} sent you ${formatNgn(discountNgn)} off your first order.`
    : `You have ${formatNgn(discountNgn)} off your first order from a friend referral.`;

  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
      <Gift className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" />
      <div>
        <p className="font-semibold text-emerald-900">Referral discount applied</p>
        <p className="text-sm text-emerald-800 leading-relaxed">{friendLine}</p>
        <p className="mt-1 text-sm text-emerald-700">
          Prices below already include {formatNgn(discountNgn)} off.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Gift } from "lucide-react";
import { formatNgn } from "@/lib/referral/config";

const REFERRAL_STORAGE_KEY = "holdam_referral_code";

export function persistReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(REFERRAL_STORAGE_KEY, code.toUpperCase());
}

export function readPersistedReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearPersistedReferralCode(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
}

interface ReferralDiscountBannerProps {
  catalogPriceNgn: number;
}

export default function ReferralDiscountBanner({ catalogPriceNgn }: ReferralDiscountBannerProps) {
  const [discountNgn, setDiscountNgn] = useState<number | null>(null);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const code = readPersistedReferralCode();
    if (!code) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      try {
        const response = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: code, catalogPriceNgn }),
        });
        const data = await response.json();
        if (cancelled) return;

        if (data.valid && data.refereeDiscountNgn) {
          setDiscountNgn(data.refereeDiscountNgn);
          setReferrerName(data.referrerName ?? null);
        } else {
          clearPersistedReferralCode();
        }
      } catch {
        if (!cancelled) clearPersistedReferralCode();
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [catalogPriceNgn]);

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
          Your checkout total will reflect {formatNgn(discountNgn)} off automatically.
        </p>
      </div>
    </div>
  );
}

export { REFERRAL_STORAGE_KEY };

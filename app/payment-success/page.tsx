"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckCircle, Gift } from "lucide-react";
import Link from "next/link";
import {
  formatNgn,
  formatRefereeDiscountRange,
  formatReferrerCreditRange,
  maxReferrerCreditNgn,
  STORE_CREDIT_EXPIRY_MONTHS,
} from "@/lib/referral/config";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dealId = searchParams.get("deal_id");

  useEffect(() => {
    if (!dealId) {
      router.replace("/thank-you");
      return;
    }
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("holdam_checkout_")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
    } catch {
      /* ignore */
    }
  }, [dealId, router]);

  if (!dealId) {
    return (
      <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
        <p className="text-slate-500">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted flex items-center justify-center px-4">
      <div className="max-w-md w-full card-elevated p-10 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-emerald-500" />
        </div>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Payment Successful!</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Your payment has been secured. We will contact you shortly to confirm delivery details.
        </p>
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-5 mb-8 text-left">
          <div className="flex items-start gap-3">
            <Gift className="h-5 w-5 text-primary-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-slate-900 mb-1">
                Earn up to {formatNgn(maxReferrerCreditNgn())} in store credit
              </p>
              <p className="text-sm text-slate-600 leading-relaxed mb-3">
                Share your personal link. When a friend completes their first order, you get{" "}
                {formatReferrerCreditRange()} in store credit (based on what they buy). They save{" "}
                {formatRefereeDiscountRange()} at checkout. Build your credit to spend on your next
                purchase within {STORE_CREDIT_EXPIRY_MONTHS} months.
              </p>
              <Link href="/refer" className="text-sm font-semibold text-primary-600 hover:text-primary-700">
                Get your referral link
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-8">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Deal ID</p>
          <p className="text-sm font-mono font-medium text-slate-900">{dealId}</p>
        </div>
        <button onClick={() => router.push("/thank-you")} className="btn-primary w-full">
          Continue
        </button>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-muted flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}

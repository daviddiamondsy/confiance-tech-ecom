"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { CheckCircle } from "lucide-react";

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

"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { persistReferralCode } from "@/components/useReferralDiscount";

/** Persist ?ref=CODE from referral landing into sessionStorage for checkout. */
export default function ReferralCapture() {
  const searchParams = useSearchParams();
  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (refCode?.trim()) {
      persistReferralCode(refCode.trim());
    }
  }, [refCode]);

  return null;
}

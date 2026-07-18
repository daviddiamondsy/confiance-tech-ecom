"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { type ComponentProps, useMemo } from "react";
import { readPersistedReferralCode } from "@/components/useReferralDiscount";
import { appendReferralQuery } from "@/lib/referral/product-share-url";

/** Active referral code from the URL or sessionStorage. */
export function useReferralCodeForLinks(): string | null {
  const searchParams = useSearchParams();
  const refFromUrl = searchParams.get("ref");

  return useMemo(() => {
    if (refFromUrl?.trim()) return refFromUrl.trim().toUpperCase();
    return readPersistedReferralCode();
  }, [refFromUrl]);
}

export function hrefWithReferral(href: string, referralCode: string | null): string {
  if (!referralCode) return href;
  return appendReferralQuery(href, referralCode);
}

type ReferralLinkProps = ComponentProps<typeof Link>;

/** Next.js Link that keeps `?ref=` on internal navigation. */
export default function ReferralLink({ href, ...props }: ReferralLinkProps) {
  const referralCode = useReferralCodeForLinks();
  const target = typeof href === "string" ? hrefWithReferral(href, referralCode) : href;

  return <Link href={target} {...props} />;
}

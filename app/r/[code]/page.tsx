import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { isPostgresConfigured } from "@/lib/db/client";
import { getReferralCodeByCode } from "@/lib/db/referral-repository";
import { REFERRAL_ATTRIBUTION_DAYS, REFERRAL_COOKIE_NAME } from "@/lib/referral/config";

export const dynamic = "force-dynamic";

interface ReferralLandingProps {
  params: {
    code: string;
  };
}

/** Referral link landing: /r/CODE sets attribution cookie and sends shopper to catalog. */
export default async function ReferralLandingPage({ params }: ReferralLandingProps) {
  const code = params.code.trim().toUpperCase();

  if (!code || !isPostgresConfigured()) {
    notFound();
  }

  const referral = await getReferralCodeByCode(code);
  if (!referral) {
    notFound();
  }

  cookies().set(REFERRAL_COOKIE_NAME, referral.code, {
    maxAge: REFERRAL_ATTRIBUTION_DAYS * 24 * 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  redirect(`/products?ref=${encodeURIComponent(referral.code)}`);
}

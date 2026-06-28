import { NextRequest, NextResponse } from "next/server";
import { isPostgresConfigured } from "@/lib/db/client";
import { getReferralCodeByCode } from "@/lib/db/referral-repository";
import { REFERRAL_ATTRIBUTION_DAYS, REFERRAL_COOKIE_NAME } from "@/lib/referral/config";
import { ensureReferralReady } from "@/lib/referral/db-ready";

export const dynamic = "force-dynamic";

interface ReferralRouteContext {
  params: {
    code: string;
  };
}

/**
 * Referral link landing: GET /r/CODE sets attribution cookie and redirects to catalog.
 * Must be a Route Handler — cookies cannot be set from Server Component pages.
 */
export async function GET(request: NextRequest, context: ReferralRouteContext) {
  const code = context.params.code.trim().toUpperCase();

  if (!code) {
    return NextResponse.redirect(new URL("/products", request.url));
  }

  if (!isPostgresConfigured()) {
    console.error("[referral-landing] Postgres not configured");
    return NextResponse.redirect(new URL("/products", request.url));
  }

  try {
    await ensureReferralReady();
    const referral = await getReferralCodeByCode(code);
    if (!referral) {
      return new NextResponse("Referral link not found.", { status: 404 });
    }

    const destination = new URL("/products", request.url);
    destination.searchParams.set("ref", referral.code);

    const response = NextResponse.redirect(destination);
    response.cookies.set(REFERRAL_COOKIE_NAME, referral.code, {
      maxAge: REFERRAL_ATTRIBUTION_DAYS * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    });

    return response;
  } catch (error) {
    console.error("[referral-landing] Failed to resolve referral code", { code, error });
    return NextResponse.redirect(new URL("/products", request.url));
  }
}

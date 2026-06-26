import { NextRequest, NextResponse } from "next/server";
import { isPostgresConfigured } from "@/lib/db/client";
import { getOrCreateReferralCode, getReferrerDashboard, referralShareUrl } from "@/lib/referral/service";
import { isCompleteNigerianPhone } from "@/lib/referral/phone";

export async function POST(req: NextRequest) {
  if (!isPostgresConfigured()) {
    return NextResponse.json(
      { error: "Referral program requires database configuration." },
      { status: 503 }
    );
  }

  try {
    const { phone, name } = await req.json();
    if (!phone?.trim()) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    if (!isCompleteNigerianPhone(String(phone))) {
      return NextResponse.json(
        { error: "Enter a complete Nigerian phone number (e.g. 08012345678)." },
        { status: 400 }
      );
    }

    await getOrCreateReferralCode({
      phone: String(phone),
      name: name ? String(name) : undefined,
    });

    const dashboard = await getReferrerDashboard(String(phone));
    if (!dashboard) {
      return NextResponse.json({ error: "Could not load referral account." }, { status: 500 });
    }

    const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://confiance.tech";

    return NextResponse.json({
      ...dashboard,
      shareUrl: referralShareUrl(dashboard.code, siteBaseUrl),
    });
  } catch (error) {
    console.error("[API][referral/lookup]", error);
    return NextResponse.json({ error: "Could not load referral details." }, { status: 500 });
  }
}

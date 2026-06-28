import { NextRequest, NextResponse } from "next/server";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureReferralReady } from "@/lib/referral/db-ready";
import { previewReferralDiscount } from "@/lib/referral/service";

export async function POST(req: NextRequest) {
  if (!isPostgresConfigured()) {
    return NextResponse.json(
      { valid: false, reason: "Referral program is not available." },
      { status: 503 }
    );
  }

  try {
    await ensureReferralReady();

    const { referralCode, catalogPriceNgn, refereePhone } = await req.json();

    if (!referralCode || !catalogPriceNgn) {
      return NextResponse.json(
        { valid: false, reason: "Missing referral code or price." },
        { status: 400 }
      );
    }

    const preview = await previewReferralDiscount({
      referralCode: String(referralCode),
      catalogPriceNgn: Number(catalogPriceNgn),
      refereePhone: refereePhone ? String(refereePhone) : "00000000000",
    });

    return NextResponse.json(preview);
  } catch (error) {
    console.error("[API][referral/validate]", error);
    return NextResponse.json(
      { valid: false, reason: "Could not validate referral code." },
      { status: 500 }
    );
  }
}

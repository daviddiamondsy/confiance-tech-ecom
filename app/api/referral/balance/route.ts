import { NextRequest, NextResponse } from "next/server";
import { isPostgresConfigured } from "@/lib/db/client";
import { getStoreCreditBalance } from "@/lib/db/referral-repository";
import { isCompleteNigerianPhone } from "@/lib/referral/phone";

/** Read store credit balance only. Never creates referral codes. */
export async function POST(req: NextRequest) {
  if (!isPostgresConfigured()) {
    return NextResponse.json({ storeCreditBalanceNgn: 0 });
  }

  try {
    const { phone } = await req.json();
    if (!phone?.trim() || !isCompleteNigerianPhone(String(phone))) {
      return NextResponse.json({ storeCreditBalanceNgn: 0 });
    }

    const balance = await getStoreCreditBalance(String(phone));
    return NextResponse.json({ storeCreditBalanceNgn: balance });
  } catch (error) {
    console.error("[API][referral/balance]", error);
    return NextResponse.json({ storeCreditBalanceNgn: 0 });
  }
}

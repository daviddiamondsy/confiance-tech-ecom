import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { adminCreateOrGetReferralCode, listAdminReferrals } from "@/lib/referral/service";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required for referrals" },
    { status: 503 }
  );
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  try {
    const referrals = await listAdminReferrals();
    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("[admin/referrals] list failed", error);
    return NextResponse.json(
      { error: "Could not load referrals", detail: getPostgresErrorMessage(error) },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  try {
    const body = await req.json();
    const phone = String(body.phone ?? "").trim();
    const name = body.name ? String(body.name).trim() : undefined;
    const customCode = body.customCode ? String(body.customCode).trim() : undefined;

    if (!phone) {
      return NextResponse.json({ error: "Phone number is required." }, { status: 400 });
    }

    const result = await adminCreateOrGetReferralCode({ phone, name, customCode });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create referral link.";
    console.error("[admin/referrals] create failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

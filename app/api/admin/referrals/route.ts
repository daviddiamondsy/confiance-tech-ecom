import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { adminCreateOrGetReferralCode, adminDeleteReferral, listAdminReferrals } from "@/lib/referral/service";
import { isCompleteNigerianPhone } from "@/lib/referral/phone";

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

    if (!isCompleteNigerianPhone(phone)) {
      return NextResponse.json(
        { error: "Enter a complete Nigerian mobile number." },
        { status: 400 }
      );
    }

    const result = await adminCreateOrGetReferralCode({ phone, name, customCode });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create referral link.";
    console.error("[admin/referrals] create failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const idParam = req.nextUrl.searchParams.get("id")?.trim();
  const id = idParam ? Number(idParam) : NaN;
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "id query param is required" }, { status: 400 });
  }

  try {
    await adminDeleteReferral(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete referral link.";
    const status = message === "Referral link not found." ? 404 : 500;
    console.error("[admin/referrals] delete failed", error);
    return NextResponse.json(
      { error: message, detail: status === 500 ? getPostgresErrorMessage(error) : undefined },
      { status }
    );
  }
}

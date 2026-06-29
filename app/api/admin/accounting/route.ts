import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { fetchStoreAccountingSummary } from "@/lib/db/accounting-repository";
import { isPostgresConfigured } from "@/lib/db/client";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { ensureOrdersReady } from "@/lib/orders/db-ready";
import { ensureReferralReady } from "@/lib/referral/db-ready";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required for accounting" },
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
    await Promise.all([ensureOrdersReady(), ensureReferralReady()]);
    const summary = await fetchStoreAccountingSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("[admin/accounting] summary failed", error);
    return NextResponse.json(
      { error: "Could not load accounting summary", detail: getPostgresErrorMessage(error) },
      { status: 500 }
    );
  }
}

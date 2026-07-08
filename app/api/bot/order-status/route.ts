import { NextRequest, NextResponse } from "next/server";
import { isPostgresConfigured } from "@/lib/db/client";
import { readBotStoreKeyFromRequest } from "@/lib/orders/derive-order-source";
import {
  listBotOrdersByPhone,
  lookupBotOrderStatus,
} from "@/lib/orders/bot-order-status";

function authorizeBotRequest(req: NextRequest): boolean {
  const configured = process.env.BOT_STORE_API_KEY?.trim();
  if (!configured) {
    return process.env.NODE_ENV === "development";
  }
  return readBotStoreKeyFromRequest(req) === configured;
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** Bot order lookup and list-by-phone for post-purchase status. */
export async function GET(req: NextRequest) {
  if (!authorizeBotRequest(req)) {
    return unauthorized();
  }

  if (!isPostgresConfigured()) {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }

  const referenceId = req.nextUrl.searchParams.get("referenceId")?.trim() ?? "";
  const phone = req.nextUrl.searchParams.get("phone")?.trim() ?? "";

  if (referenceId) {
    const result = await lookupBotOrderStatus({ referenceId, buyerPhone: phone || undefined });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: 404 });
    }
    return NextResponse.json(result.snapshot);
  }

  if (!phone) {
    return NextResponse.json(
      { ok: false, error: "referenceId or phone is required" },
      { status: 400 }
    );
  }

  const orders = await listBotOrdersByPhone({ buyerPhone: phone, limit: 3 });
  return NextResponse.json(orders);
}

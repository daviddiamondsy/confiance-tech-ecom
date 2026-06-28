import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { createManualOrder, listAdminOrders } from "@/lib/orders/service";
import type { OrderFulfillmentStatus } from "@/lib/orders/types";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required for order tracking" },
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
    const orders = await listAdminOrders();
    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[admin/orders] list failed", error);
    return NextResponse.json(
      { error: "Could not load orders", detail: getPostgresErrorMessage(error) },
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
    const productPriceRaw = body.productPriceNgn;
    const productPriceNgn =
      productPriceRaw === undefined || productPriceRaw === null || productPriceRaw === ""
        ? undefined
        : Number(productPriceRaw);

    const order = await createManualOrder({
      productName: String(body.productName ?? ""),
      productPriceNgn,
      productStorage: body.productStorage ? String(body.productStorage) : undefined,
      productColor: body.productColor ? String(body.productColor) : undefined,
      customerName: String(body.customerName ?? ""),
      customerPhone: String(body.customerPhone ?? ""),
      customerAddress: String(body.customerAddress ?? ""),
      customerState: String(body.customerState ?? ""),
      fulfillmentStatus: body.fulfillmentStatus
        ? (String(body.fulfillmentStatus) as OrderFulfillmentStatus)
        : undefined,
      notes: body.notes ? String(body.notes) : undefined,
      adminNote: body.adminNote ? String(body.adminNote) : undefined,
      sendNotificationEmail: Boolean(body.sendNotificationEmail),
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create order.";
    console.error("[admin/orders] create failed", error);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

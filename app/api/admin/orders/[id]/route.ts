import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { updateAdminOrder } from "@/lib/orders/service";
import type { OrderFulfillmentStatus } from "@/lib/orders/types";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required for order tracking" },
    { status: 503 }
  );
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const order = await updateAdminOrder(id, {
      fulfillmentStatus: body.fulfillmentStatus
        ? (String(body.fulfillmentStatus) as OrderFulfillmentStatus)
        : undefined,
      adminNote: body.adminNote !== undefined ? String(body.adminNote) : undefined,
    });

    return NextResponse.json({ order });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update order.";
    const status = message === "Order not found." ? 404 : 400;
    console.error("[admin/orders] update failed", error);
    return NextResponse.json(
      { error: message, detail: status === 400 ? undefined : getPostgresErrorMessage(error) },
      { status }
    );
  }
}

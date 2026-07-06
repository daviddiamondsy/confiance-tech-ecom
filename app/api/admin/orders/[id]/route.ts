import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { getAdminOrder, updateAdminOrder } from "@/lib/orders/service";
import type { FulfillmentTasks, OrderFulfillmentStatus } from "@/lib/orders/types";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required for order tracking" },
    { status: 503 }
  );
}

function parseFulfillmentTasksBody(raw: unknown): FulfillmentTasks | undefined {
  if (raw === undefined) {
    return undefined;
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Invalid fulfillment checklist payload.");
  }

  const tasks: FulfillmentTasks = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      continue;
    }
    tasks[key as keyof FulfillmentTasks] = {
      done: Boolean((value as { done?: unknown }).done),
    };
  }

  return tasks;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
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
    const order = await getAdminOrder(id);
    if (!order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ order });
  } catch (error) {
    console.error("[admin/orders] fetch failed", error);
    return NextResponse.json({ error: "Could not load order." }, { status: 500 });
  }
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
    const fulfillmentTasks = parseFulfillmentTasksBody(body.fulfillmentTasks);
    const ship =
      body.ship && typeof body.ship === "object" && !Array.isArray(body.ship)
        ? {
            courier: String(body.ship.courier ?? ""),
            tracking: String(body.ship.tracking ?? ""),
          }
        : undefined;

    const order = await updateAdminOrder(id, {
      fulfillmentStatus: body.fulfillmentStatus
        ? (String(body.fulfillmentStatus) as OrderFulfillmentStatus)
        : undefined,
      adminNote: body.adminNote !== undefined ? String(body.adminNote) : undefined,
      fulfillmentTasks,
      ship,
      markReceiptSent: body.markReceiptSent === true,
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

import type { AdminOrderRow, FulfillmentTaskKey, FulfillmentTasks, OrderFulfillmentStatus } from "@/lib/orders/types";

export const FULFILLMENT_TASK_DEFINITIONS: {
  key: FulfillmentTaskKey;
  label: string;
  description: string;
  phase: "pre_ship" | "post_delivery";
}[] = [
  {
    key: "customer_contacted",
    label: "Customer contacted",
    description: "Confirm order details and delivery expectations.",
    phase: "pre_ship",
  },
  {
    key: "device_sourced",
    label: "Device sourced",
    description: "Inventory allocated or supplier confirmed.",
    phase: "pre_ship",
  },
  {
    key: "qc_passed",
    label: "QC passed",
    description: "Device inspected and ready to pack.",
    phase: "pre_ship",
  },
  {
    key: "payment_confirmation_sent",
    label: "Payment confirmation sent",
    description: "Customer received payment secured notice (WhatsApp or email).",
    phase: "pre_ship",
  },
  {
    key: "receipt_sent",
    label: "Receipt sent",
    description: "Final receipt sent after delivery is complete.",
    phase: "post_delivery",
  },
];

export type PaymentTimelineStepKey =
  | "order_placed"
  | "payment_secured"
  | "shipped"
  | "delivery_complete";

export interface PaymentTimelineStep {
  key: PaymentTimelineStepKey;
  label: string;
  done: boolean;
  active: boolean;
  at: string | null;
  locked: boolean;
}

const TERMINAL_STATUSES: OrderFulfillmentStatus[] = ["disputed", "cancelled", "refunded"];

const HOLDAM_LOCKED_STATUSES: OrderFulfillmentStatus[] = ["secured", "complete"];

export function parseFulfillmentTasks(raw: unknown): FulfillmentTasks {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }

  const parsed: FulfillmentTasks = {};
  for (const { key } of FULFILLMENT_TASK_DEFINITIONS) {
    const entry = (raw as Record<string, unknown>)[key];
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }
    const done = Boolean((entry as { done?: unknown }).done);
    const atRaw = (entry as { at?: unknown }).at;
    parsed[key] = {
      done,
      at: typeof atRaw === "string" && atRaw.trim() ? atRaw : done ? new Date().toISOString() : undefined,
    };
  }

  return parsed;
}

export function isTaskDone(tasks: FulfillmentTasks, key: FulfillmentTaskKey): boolean {
  return Boolean(tasks[key]?.done);
}

export function applyTaskToggle(
  tasks: FulfillmentTasks,
  key: FulfillmentTaskKey,
  done: boolean
): FulfillmentTasks {
  if (!done) {
    const next = { ...tasks };
    delete next[key];
    return next;
  }

  return {
    ...tasks,
    [key]: {
      done: true,
      at: new Date().toISOString(),
    },
  };
}

export function isFulfillmentWorkflowUnlocked(status: OrderFulfillmentStatus): boolean {
  return status === "secured" || status === "shipped" || status === "complete";
}

export function isPreShipPhase(status: OrderFulfillmentStatus): boolean {
  return status === "secured";
}

export function isPostDeliveryPhase(status: OrderFulfillmentStatus): boolean {
  return status === "complete";
}

export function isPaymentStatusLockedByHoldam(dealId: string | null, status: OrderFulfillmentStatus): boolean {
  return Boolean(dealId) && HOLDAM_LOCKED_STATUSES.includes(status);
}

export function adminEditableStatuses(order: Pick<AdminOrderRow, "dealId">): OrderFulfillmentStatus[] {
  const all: OrderFulfillmentStatus[] = [
    "pending_payment",
    "secured",
    "shipped",
    "complete",
    "disputed",
    "cancelled",
    "refunded",
  ];

  if (!order.dealId) {
    return all;
  }

  return all.filter((status) => !HOLDAM_LOCKED_STATUSES.includes(status));
}

export function validateAdminStatusChange(
  order: Pick<AdminOrderRow, "dealId" | "fulfillmentStatus">,
  nextStatus: OrderFulfillmentStatus
): string | null {
  if (nextStatus === order.fulfillmentStatus) {
    return null;
  }

  if (isPaymentStatusLockedByHoldam(order.dealId, nextStatus)) {
    return "This payment status is updated by Holdam webhooks when a deal is linked.";
  }

  if (nextStatus === "shipped" && order.fulfillmentStatus === "pending_payment") {
    return "Mark payment as secured before shipping.";
  }

  if (TERMINAL_STATUSES.includes(order.fulfillmentStatus) && !TERMINAL_STATUSES.includes(nextStatus)) {
    return "Cannot reopen an order after a terminal status.";
  }

  return null;
}

export function validateTaskChange(
  order: Pick<AdminOrderRow, "fulfillmentStatus">,
  key: FulfillmentTaskKey,
  done: boolean
): string | null {
  const definition = FULFILLMENT_TASK_DEFINITIONS.find((item) => item.key === key);
  if (!definition) {
    return "Unknown checklist item.";
  }

  if (!done) {
    return null;
  }

  if (definition.phase === "pre_ship") {
    if (!isFulfillmentWorkflowUnlocked(order.fulfillmentStatus)) {
      return "Complete payment before starting fulfillment checklist.";
    }
    if (order.fulfillmentStatus === "shipped" || order.fulfillmentStatus === "complete") {
      return "Pre-ship checklist is read-only after shipping.";
    }
  }

  if (definition.phase === "post_delivery" && !isPostDeliveryPhase(order.fulfillmentStatus)) {
    return "Send the receipt only after delivery is complete.";
  }

  return null;
}

export function canMarkShipped(order: Pick<AdminOrderRow, "fulfillmentStatus">): boolean {
  return order.fulfillmentStatus === "secured";
}

export function buildPaymentTimeline(order: AdminOrderRow): PaymentTimelineStep[] {
  const status = order.fulfillmentStatus;
  const securedDone =
    status === "secured" ||
    status === "shipped" ||
    status === "complete" ||
    Boolean(order.securedAt);
  const shippedDone = status === "shipped" || status === "complete" || Boolean(order.shippedAt);
  const completeDone = status === "complete" || Boolean(order.completedAt);

  const isTerminal = TERMINAL_STATUSES.includes(status);

  return [
    {
      key: "order_placed",
      label: "Order placed",
      done: true,
      active: false,
      at: order.createdAt,
      locked: true,
    },
    {
      key: "payment_secured",
      label: "Payment secured",
      done: securedDone,
      active: !securedDone && !isTerminal,
      at: order.securedAt,
      locked: Boolean(order.dealId),
    },
    {
      key: "shipped",
      label: "Shipped",
      done: shippedDone,
      active: securedDone && !shippedDone && !isTerminal,
      at: order.shippedAt,
      locked: false,
    },
    {
      key: "delivery_complete",
      label: "Delivery complete",
      done: completeDone,
      active: shippedDone && !completeDone && !isTerminal,
      at: order.completedAt,
      locked: Boolean(order.dealId),
    },
  ];
}

export function countOpenPreShipTasks(tasks: FulfillmentTasks): number {
  return FULFILLMENT_TASK_DEFINITIONS.filter(
    (item) => item.phase === "pre_ship" && !isTaskDone(tasks, item.key)
  ).length;
}

export function orderNeedsFulfillmentAction(order: AdminOrderRow): boolean {
  if (order.fulfillmentStatus === "secured") {
    return countOpenPreShipTasks(order.fulfillmentTasks) > 0 || !order.shippedAt;
  }
  if (order.fulfillmentStatus === "complete") {
    return !isTaskDone(order.fulfillmentTasks, "receipt_sent") && !order.receiptSentAt;
  }
  return false;
}

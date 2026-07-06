import {
  applyTaskToggle,
  canMarkShipped,
  validateAdminStatusChange,
  validateTaskChange,
} from "@/lib/orders/fulfillment-workflow";
import type {
  FulfillmentTaskKey,
  FulfillmentTasks,
  OrderFulfillmentStatus,
  UpdateOrderParams,
} from "@/lib/orders/types";

export function mergeFulfillmentTaskUpdates(
  current: FulfillmentTasks,
  updates: FulfillmentTasks
): FulfillmentTasks {
  let next = { ...current };

  for (const [rawKey, state] of Object.entries(updates)) {
    const key = rawKey as FulfillmentTaskKey;
    if (!state || typeof state !== "object") {
      continue;
    }
    next = applyTaskToggle(next, key, Boolean(state.done));
  }

  return next;
}

export function validateOrderWorkflowUpdate(
  order: {
    dealId: string | null;
    fulfillmentStatus: OrderFulfillmentStatus;
    fulfillmentTasks: FulfillmentTasks;
  },
  params: UpdateOrderParams
): string | null {
  if (params.fulfillmentStatus) {
    const statusError = validateAdminStatusChange(order, params.fulfillmentStatus);
    if (statusError) {
      return statusError;
    }
  }

  if (params.fulfillmentTasks) {
    for (const [rawKey, state] of Object.entries(params.fulfillmentTasks)) {
      const key = rawKey as FulfillmentTaskKey;
      const done = Boolean(state?.done);
      const taskError = validateTaskChange(order, key, done);
      if (taskError) {
        return taskError;
      }
    }
  }

  if (params.ship) {
    if (!canMarkShipped(order)) {
      return "Order must be payment secured before marking shipped.";
    }
    if (!params.ship.courier.trim()) {
      return "Courier name is required to mark shipped.";
    }
    if (!params.ship.tracking.trim()) {
      return "Tracking number is required to mark shipped.";
    }
  }

  if (params.markReceiptSent) {
    const taskError = validateTaskChange(order, "receipt_sent", true);
    if (taskError) {
      return taskError;
    }
  }

  return null;
}

export function buildWorkflowPatch(
  order: {
    fulfillmentStatus: OrderFulfillmentStatus;
    fulfillmentTasks: FulfillmentTasks;
    receiptSentAt: string | null;
  },
  params: UpdateOrderParams
) {
  const patch: {
    fulfillmentStatus?: OrderFulfillmentStatus;
    adminNote?: string | null;
    fulfillmentTasks?: FulfillmentTasks;
    shippingCourier?: string | null;
    shippingTracking?: string | null;
    shippedAt?: string | null;
    receiptSentAt?: string | null;
  } = {};

  if (params.adminNote !== undefined) {
    patch.adminNote = params.adminNote;
  }

  if (params.fulfillmentStatus) {
    patch.fulfillmentStatus = params.fulfillmentStatus;
  }

  if (params.fulfillmentTasks) {
    patch.fulfillmentTasks = mergeFulfillmentTaskUpdates(order.fulfillmentTasks, params.fulfillmentTasks);
  }

  if (params.ship) {
    patch.fulfillmentStatus = "shipped";
    patch.shippingCourier = params.ship.courier.trim();
    patch.shippingTracking = params.ship.tracking.trim();
    patch.shippedAt = new Date().toISOString();
  }

  if (params.markReceiptSent) {
    const now = new Date().toISOString();
    patch.fulfillmentTasks = applyTaskToggle(
      patch.fulfillmentTasks ?? order.fulfillmentTasks,
      "receipt_sent",
      true
    );
    patch.receiptSentAt = order.receiptSentAt ?? now;
  }

  return patch;
}

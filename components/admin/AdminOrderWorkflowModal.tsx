"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  ExternalLink,
  Lock,
  Package,
  Truck,
  X,
} from "lucide-react";
import { formatNgn } from "@/lib/referral/config";
import {
  FULFILLMENT_TASK_DEFINITIONS,
  adminEditableStatuses,
  buildPaymentTimeline,
  canMarkShipped,
  isFulfillmentWorkflowUnlocked,
  isPostDeliveryPhase,
  isPreShipPhase,
  isTaskDone,
} from "@/lib/orders/fulfillment-workflow";
import { statusBadgeClass, statusLabel } from "@/lib/orders/status";
import type { AdminOrderRow, FulfillmentTaskKey, FulfillmentTasks, OrderFulfillmentStatus } from "@/lib/orders/types";

interface AdminOrderWorkflowModalProps {
  order: AdminOrderRow;
  onClose: () => void;
  onSaved: (order: AdminOrderRow) => void;
}

function formatWhen(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function variantLabel(order: AdminOrderRow): string {
  const parts = [order.productStorage, order.productColor].filter(Boolean);
  return parts.length > 0 ? parts.join(" · ") : "Standard";
}

function amountLabel(order: AdminOrderRow): string {
  const amount = order.checkoutAmountNgn ?? order.productPriceNgn;
  return amount != null ? formatNgn(amount) : "—";
}

export default function AdminOrderWorkflowModal({
  order,
  onClose,
  onSaved,
}: AdminOrderWorkflowModalProps) {
  const [tasks, setTasks] = useState<FulfillmentTasks>(order.fulfillmentTasks);
  const [adminNote, setAdminNote] = useState(order.adminNote ?? "");
  const [status, setStatus] = useState<OrderFulfillmentStatus>(order.fulfillmentStatus);
  const [courier, setCourier] = useState(order.shippingCourier ?? "");
  const [tracking, setTracking] = useState(order.shippingTracking ?? "");
  const [localError, setLocalError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTasks(order.fulfillmentTasks);
    setAdminNote(order.adminNote ?? "");
    setStatus(order.fulfillmentStatus);
    setCourier(order.shippingCourier ?? "");
    setTracking(order.shippingTracking ?? "");
    setLocalError("");
  }, [order]);

  const paymentTimeline = useMemo(() => buildPaymentTimeline(order), [order]);
  const editableStatuses = useMemo(() => adminEditableStatuses(order), [order]);
  const fulfillmentUnlocked = isFulfillmentWorkflowUnlocked(order.fulfillmentStatus);
  const showShipForm = canMarkShipped(order);
  const showReceiptAction = isPostDeliveryPhase(order.fulfillmentStatus);

  const toggleTask = (key: FulfillmentTaskKey, done: boolean) => {
    setTasks((prev) => {
      const next = { ...prev };
      if (!done) {
        delete next[key];
        return next;
      }
      next[key] = { done: true, at: new Date().toISOString() };
      return next;
    });
  };

  const saveWorkflow = async (payload: Record<string, unknown>) => {
    setLocalError("");
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        setLocalError(data.error || "Could not save workflow changes.");
        return;
      }
      onSaved(data.order as AdminOrderRow);
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();

    const payload: Record<string, unknown> = {};

    const taskChanges: FulfillmentTasks = {};
    for (const { key } of FULFILLMENT_TASK_DEFINITIONS) {
      const wasDone = isTaskDone(order.fulfillmentTasks, key);
      const isDone = isTaskDone(tasks, key);
      if (wasDone !== isDone) {
        taskChanges[key] = { done: isDone };
      }
    }
    if (Object.keys(taskChanges).length > 0) {
      payload.fulfillmentTasks = taskChanges;
    }

    if (adminNote !== (order.adminNote ?? "")) {
      payload.adminNote = adminNote;
    }

    if (status !== order.fulfillmentStatus) {
      payload.fulfillmentStatus = status;
    }

    await saveWorkflow(payload);
  };

  const handleShip = async (event: FormEvent) => {
    event.preventDefault();
    await saveWorkflow({
      ship: {
        courier,
        tracking,
      },
    });
  };

  const handleMarkReceiptSent = async () => {
    await saveWorkflow({ markReceiptSent: true });
  };

  const displayError = localError;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-workflow-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Close order workflow"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-4xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-100 shadow-card-hover">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-6 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-1">
              Order #{order.id}
            </p>
            <h2 id="order-workflow-title" className="font-display text-lg font-bold text-slate-900">
              {order.productName}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {order.customerName} · {order.customerPhone} · {amountLabel(order)}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.fulfillmentStatus)}`}
              >
                {statusLabel(order.fulfillmentStatus)}
              </span>
              <span className="text-xs text-slate-400">{variantLabel(order)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {displayError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
              {displayError}
            </p>
          )}

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-5">
              <h3 className="font-display text-sm font-bold text-slate-900 mb-4">Payment timeline</h3>
              <ol className="space-y-4">
                {paymentTimeline.map((step) => (
                  <li key={step.key} className="flex gap-3">
                    <div className="mt-0.5 shrink-0">
                      {step.done ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" aria-hidden />
                      ) : step.active ? (
                        <Circle className="h-5 w-5 text-primary-500" aria-hidden />
                      ) : (
                        <Circle className="h-5 w-5 text-slate-300" aria-hidden />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            step.done ? "text-slate-900" : step.active ? "text-primary-700" : "text-slate-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {step.locked && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-slate-200/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                            <Lock className="h-3 w-3" aria-hidden />
                            Holdam
                          </span>
                        )}
                      </div>
                      {step.at && (
                        <p className="text-xs text-slate-500 mt-0.5">{formatWhen(step.at)}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>

              {order.dealId && (
                <div className="mt-5 pt-4 border-t border-slate-200/80">
                  <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">Deal ID</p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-slate-700 break-all">{order.dealId}</p>
                    {order.merchantDealUrl && (
                      <a
                        href={order.merchantDealUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        Open
                        <ExternalLink className="h-3 w-3" aria-hidden />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-slate-100 p-5">
              <h3 className="font-display text-sm font-bold text-slate-900 mb-1">Fulfillment checklist</h3>
              <p className="text-xs text-slate-500 mb-4">
                {fulfillmentUnlocked
                  ? "Track pre-ship ops here. Shipping updates order status to Shipped."
                  : "Checklist unlocks after payment is secured."}
              </p>

              <ul className="space-y-3">
                {FULFILLMENT_TASK_DEFINITIONS.map((item) => {
                  const done = isTaskDone(tasks, item.key);
                  const preShipLocked =
                    item.phase === "pre_ship" &&
                    (!fulfillmentUnlocked || !isPreShipPhase(order.fulfillmentStatus));
                  const postDeliveryLocked =
                    item.phase === "post_delivery" && !showReceiptAction;
                  const disabled = saving || preShipLocked || postDeliveryLocked;

                  return (
                    <li
                      key={item.key}
                      className={`rounded-lg border px-3 py-3 ${
                        done ? "border-emerald-100 bg-emerald-50/50" : "border-slate-100 bg-white"
                      }`}
                    >
                      <label className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
                        <input
                          type="checkbox"
                          checked={done}
                          disabled={disabled}
                          onChange={(event) => toggleTask(item.key, event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span>
                          <span className="block text-sm font-medium text-slate-900">{item.label}</span>
                          <span className="block text-xs text-slate-500 mt-0.5">{item.description}</span>
                          {tasks[item.key]?.at && (
                            <span className="block text-[11px] text-slate-400 mt-1">
                              {formatWhen(tasks[item.key]?.at ?? null)}
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>

              {showReceiptAction && !isTaskDone(tasks, "receipt_sent") && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleMarkReceiptSent()}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" aria-hidden />
                  Mark receipt sent
                </button>
              )}
            </div>
          </section>

          {order.shippedAt && (
            <section className="rounded-xl border border-violet-100 bg-violet-50/40 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Truck className="h-4 w-4 text-violet-600" aria-hidden />
                <h3 className="font-display text-sm font-bold text-slate-900">Shipment</h3>
              </div>
              <p className="text-sm text-slate-700">
                {order.shippingCourier || "Courier"} · {order.shippingTracking || "Tracking pending"}
              </p>
              {order.shippedAt && (
                <p className="text-xs text-slate-500 mt-1">Shipped {formatWhen(order.shippedAt)}</p>
              )}
            </section>
          )}

          {showShipForm && (
            <section className="rounded-xl border border-primary-100 bg-primary-50/30 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-primary-600" aria-hidden />
                <h3 className="font-display text-sm font-bold text-slate-900">Mark shipped</h3>
              </div>
              <form onSubmit={(event) => void handleShip(event)} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Courier</span>
                  <input
                    className="input-field mt-1 w-full"
                    value={courier}
                    onChange={(event) => setCourier(event.target.value)}
                    placeholder="Courier name"
                    required
                  />
                </label>
                <label className="block text-sm">
                  <span className="font-medium text-slate-700">Tracking number</span>
                  <input
                    className="input-field mt-1 w-full"
                    value={tracking}
                    onChange={(event) => setTracking(event.target.value)}
                    placeholder="Tracking reference"
                    required
                  />
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                    {saving ? "Saving..." : "Mark shipped"}
                  </button>
                </div>
              </form>
            </section>
          )}

          <form onSubmit={(event) => void handleSave(event)} className="rounded-xl border border-slate-100 p-5 space-y-4">
            <h3 className="font-display text-sm font-bold text-slate-900">Ops notes and status</h3>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Internal note</span>
              <textarea
                className="input-field mt-1 w-full min-h-[80px]"
                value={adminNote}
                onChange={(event) => setAdminNote(event.target.value)}
                placeholder="Internal ops note"
              />
            </label>

            <label className="block text-sm max-w-sm">
              <span className="font-medium text-slate-700">Override status</span>
              <select
                className="input-field mt-1 w-full"
                value={status}
                onChange={(event) => setStatus(event.target.value as OrderFulfillmentStatus)}
              >
                {editableStatuses.map((option) => (
                  <option key={option} value={option}>
                    {statusLabel(option)}
                  </option>
                ))}
              </select>
              {order.dealId && (
                <span className="block text-xs text-slate-500 mt-1">
                  Payment secured and complete are updated by Holdam when a deal is linked.
                </span>
              )}
            </label>

            <div className="rounded-lg bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-600">
              <p className="font-medium text-slate-800">{order.customerName}</p>
              <p>{order.customerPhone}</p>
              <p className="mt-1">
                {order.customerAddress}, {order.customerState}
              </p>
              {order.notes && <p className="mt-2 italic text-slate-500">{order.notes}</p>}
            </div>

            <button type="submit" disabled={saving} className="btn-outline disabled:opacity-50">
              {saving ? "Saving..." : "Save checklist and notes"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

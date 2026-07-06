"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, Package, RefreshCw } from "lucide-react";
import StateSelect from "@/components/StateSelect";
import AdminOrderWorkflowModal from "@/components/admin/AdminOrderWorkflowModal";
import { formatNgn } from "@/lib/referral/config";
import { orderNeedsFulfillmentAction } from "@/lib/orders/fulfillment-workflow";
import { statusBadgeClass, statusLabel } from "@/lib/orders/status";
import type { AdminOrderRow, OrderFulfillmentStatus } from "@/lib/orders/types";
import { ADMIN_EDITABLE_ORDER_STATUSES, ORDER_SOURCES, sourceLabel } from "@/lib/orders/types";

const emptyManualForm = {
  productName: "",
  productPriceNgn: "",
  productStorage: "",
  productColor: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  customerState: "",
  fulfillmentStatus: "pending_payment" as OrderFulfillmentStatus,
  notes: "",
  adminNote: "",
  sendNotificationEmail: true,
};

function formatDate(iso: string): string {
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
  return parts.length > 0 ? parts.join(" · ") : "—";
}

function amountLabel(order: AdminOrderRow): string {
  const amount = order.checkoutAmountNgn ?? order.productPriceNgn;
  return amount != null ? formatNgn(amount) : "—";
}

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [form, setForm] = useState(emptyManualForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);

  const activeOrder = useMemo(
    () => orders.find((order) => order.id === activeOrderId) ?? null,
    [activeOrderId, orders]
  );

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/orders");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not load orders.");
        setOrders([]);
        return;
      }
      const rows: AdminOrderRow[] = data.orders ?? [];
      setOrders(rows);
    } catch {
      setError("Network error while loading orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.fulfillmentStatus !== statusFilter) return false;
      if (sourceFilter !== "all" && order.source !== sourceFilter) return false;
      if (needsActionOnly && !orderNeedsFulfillmentAction(order)) return false;
      return true;
    });
  }, [needsActionOnly, orders, sourceFilter, statusFilter]);

  const needsActionCount = useMemo(
    () => orders.filter((order) => orderNeedsFulfillmentAction(order)).length,
    [orders]
  );

  const handleCreateManual = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/admin/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          productPriceNgn: form.productPriceNgn.trim() ? Number(form.productPriceNgn) : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not create order.");
        return;
      }

      setMessage("Manual order saved.");
      setForm(emptyManualForm);
      await loadOrders();
    } catch {
      setError("Network error while creating order.");
    } finally {
      setCreating(false);
    }
  };

  const handleWorkflowSaved = (updated: AdminOrderRow) => {
    setOrders((prev) => prev.map((order) => (order.id === updated.id ? updated : order)));
    setMessage(`Updated order #${updated.id}.`);
  };

  const openWorkflow = (orderId: number) => {
    setError("");
    setMessage("");
    setActiveOrderId(orderId);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-600 mt-1">
            Track payment milestones, pre-ship checklist, shipping, and receipts from one workflow
            view per order.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadOrders()}
          className="btn-outline text-sm py-2 px-4 self-start"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} aria-hidden />
          Refresh
        </button>
      </div>

      {(error || message) && (
        <div className="space-y-2">
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3" role="status">
              {message}
            </p>
          )}
        </div>
      )}

      <section className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5 text-primary-600" />
          <h3 className="font-display text-lg font-bold text-slate-900">Add manual order</h3>
        </div>
        <p className="text-sm text-slate-600 mb-6">
          For orders taken by email, WhatsApp, or phone. Open the workflow view to manage fulfillment.
        </p>

        <form onSubmit={handleCreateManual} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Product name</span>
              <input
                className="input-field mt-1 w-full"
                value={form.productName}
                onChange={(e) => setForm((prev) => ({ ...prev, productName: e.target.value }))}
                placeholder="Product title for the order"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Price (NGN)</span>
              <input
                className="input-field mt-1 w-full"
                type="number"
                min={1}
                value={form.productPriceNgn}
                onChange={(e) => setForm((prev) => ({ ...prev, productPriceNgn: e.target.value }))}
                placeholder="Order amount in naira"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Storage (optional)</span>
              <input
                className="input-field mt-1 w-full"
                value={form.productStorage}
                onChange={(e) => setForm((prev) => ({ ...prev, productStorage: e.target.value }))}
                placeholder="Storage variant if applicable"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Color (optional)</span>
              <input
                className="input-field mt-1 w-full"
                value={form.productColor}
                onChange={(e) => setForm((prev) => ({ ...prev, productColor: e.target.value }))}
                placeholder="Color variant if applicable"
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Customer name</span>
              <input
                className="input-field mt-1 w-full"
                value={form.customerName}
                onChange={(e) => setForm((prev) => ({ ...prev, customerName: e.target.value }))}
                placeholder="Customer name"
                required
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Customer phone</span>
              <input
                className="input-field mt-1 w-full"
                value={form.customerPhone}
                onChange={(e) => setForm((prev) => ({ ...prev, customerPhone: e.target.value }))}
                placeholder="Your mobile number"
                required
              />
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Delivery address</span>
              <input
                className="input-field mt-1 w-full"
                value={form.customerAddress}
                onChange={(e) => setForm((prev) => ({ ...prev, customerAddress: e.target.value }))}
                placeholder="Street address and area"
                required
              />
            </label>
            <div className="block text-sm">
              <span className="font-medium text-slate-700">State</span>
              <div className="mt-1">
                <StateSelect
                  value={form.customerState}
                  onChange={(state) => setForm((prev) => ({ ...prev, customerState: state }))}
                />
              </div>
            </div>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Initial status</span>
              <select
                className="input-field mt-1 w-full"
                value={form.fulfillmentStatus}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fulfillmentStatus: e.target.value as OrderFulfillmentStatus,
                  }))
                }
              >
                {ADMIN_EDITABLE_ORDER_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {statusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Order notes (optional)</span>
              <textarea
                className="input-field mt-1 w-full min-h-[72px]"
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="How the order was received or special instructions"
              />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.sendNotificationEmail}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sendNotificationEmail: e.target.checked }))
                }
                className="rounded border-slate-300"
              />
              <span className="text-slate-700">Send ops notification email</span>
            </label>
          </div>

          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? "Saving..." : "Save manual order"}
          </button>
        </form>
      </section>

      <section className="card-elevated p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary-600" />
            <h3 className="font-display text-lg font-bold text-slate-900">Order list</h3>
            {!loading && (
              <span className="ml-1 inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                {filteredOrders.length}
                {filteredOrders.length !== orders.length && ` / ${orders.length}`}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setNeedsActionOnly((prev) => !prev)}
              className={`inline-flex items-center rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                needsActionOnly
                  ? "border-amber-300 bg-amber-50 text-amber-800"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              Needs action
              {needsActionCount > 0 && (
                <span className="ml-1.5 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-200 px-1.5 py-0.5 text-[10px]">
                  {needsActionCount}
                </span>
              )}
            </button>
            <select
              className="input-field py-1.5 text-xs rounded-lg"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="all">All statuses</option>
              <option value="pending_payment">Pending payment</option>
              <option value="secured">Payment secured</option>
              <option value="shipped">Shipped</option>
              <option value="complete">Complete</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              className="input-field py-1.5 text-xs rounded-lg"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              aria-label="Filter by source"
            >
              <option value="all">All sources</option>
              {ORDER_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {sourceLabel(source)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <ClipboardList className="h-10 w-10 opacity-40" />
            <p className="text-sm font-medium">No orders match these filters.</p>
            {(statusFilter !== "all" || sourceFilter !== "all" || needsActionOnly) && (
              <button
                type="button"
                className="text-xs text-primary-600 hover:underline"
                onClick={() => {
                  setStatusFilter("all");
                  setSourceFilter("all");
                  setNeedsActionOnly(false);
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Customer</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Product</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Amount</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Source</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide">Workflow</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order, idx) => (
                  <tr
                    key={order.id}
                    className={`border-t border-slate-50 align-top transition-colors hover:bg-primary-50/30 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                  >
                    <td className="px-4 py-3 whitespace-nowrap text-slate-500 text-xs">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{order.customerName}</p>
                      <p className="text-slate-500 text-xs">{order.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{order.productName}</p>
                      <p className="text-slate-500 text-xs">{variantLabel(order)}</p>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-900">
                      {amountLabel(order)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                        {sourceLabel(order.source)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(order.fulfillmentStatus)}`}
                        >
                          {statusLabel(order.fulfillmentStatus)}
                        </span>
                        {orderNeedsFulfillmentAction(order) && (
                          <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
                            Action
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex items-center rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-700 transition-colors"
                        onClick={() => openWorkflow(order.id)}
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {activeOrder && (
        <AdminOrderWorkflowModal
          order={activeOrder}
          onClose={() => setActiveOrderId(null)}
          onSaved={handleWorkflowSaved}
        />
      )}
    </div>
  );
}

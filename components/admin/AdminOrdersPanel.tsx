"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ClipboardList, ExternalLink, Package, RefreshCw } from "lucide-react";
import StateSelect from "@/components/StateSelect";
import { formatNgn } from "@/lib/referral/config";
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
  const [savingId, setSavingId] = useState<number | null>(null);
  const [draftNotes, setDraftNotes] = useState<Record<number, string>>({});
  const [draftStatuses, setDraftStatuses] = useState<Record<number, OrderFulfillmentStatus>>({});

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
      setDraftNotes(Object.fromEntries(rows.map((row) => [row.id, row.adminNote ?? ""])));
      setDraftStatuses(Object.fromEntries(rows.map((row) => [row.id, row.fulfillmentStatus])));
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
      return true;
    });
  }, [orders, sourceFilter, statusFilter]);

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

  const saveOrderUpdate = async (order: AdminOrderRow) => {
    setSavingId(order.id);
    setError("");
    setMessage("");

    const fulfillmentStatus = draftStatuses[order.id];
    const adminNote = draftNotes[order.id] ?? "";

    try {
      const response = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillmentStatus:
            fulfillmentStatus !== order.fulfillmentStatus ? fulfillmentStatus : undefined,
          adminNote: adminNote !== (order.adminNote ?? "") ? adminNote : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not update order.");
        return;
      }

      setMessage(`Updated order #${order.id}.`);
      await loadOrders();
    } catch {
      setError("Network error while updating order.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Orders</h2>
          <p className="text-sm text-slate-600 mt-1">
            Website checkout, chatbot, and manual orders in one list. Holdam webhooks can still
            update payment status; ops can override any order here.
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
          For orders taken by email, WhatsApp, or phone. Payment and shipping status are managed here.
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
        <div className="flex items-center gap-2 mb-4">
          <ClipboardList className="h-5 w-5 text-primary-600" />
          <h3 className="font-display text-lg font-bold text-slate-900">Order list</h3>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <label className="text-sm text-slate-600 flex items-center gap-2">
            Status
            <select
              className="input-field py-1.5 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending_payment">Pending payment</option>
              <option value="secured">Payment secured</option>
              <option value="shipped">Shipped</option>
              <option value="complete">Complete</option>
              <option value="disputed">Disputed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </label>
          <label className="text-sm text-slate-600 flex items-center gap-2">
            Source
            <select
              className="input-field py-1.5 text-sm"
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
            >
              <option value="all">All</option>
              {ORDER_SOURCES.map((source) => (
                <option key={source} value={source}>
                  {sourceLabel(source)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading orders...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-sm text-slate-500">No orders match these filters.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Date</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-slate-100 align-top">
                      <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{order.customerName}</p>
                        <p className="text-slate-500">{order.customerPhone}</p>
                        <p className="text-slate-500 text-xs mt-1">
                          {order.customerAddress}, {order.customerState}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{order.productName}</p>
                        <p className="text-slate-500 text-xs">{variantLabel(order)}</p>
                        {order.notes && (
                          <p className="text-slate-500 text-xs mt-1">{order.notes}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{amountLabel(order)}</td>
                      <td className="px-4 py-3">{sourceLabel(order.source)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-lg border px-2 py-1 text-xs font-medium ${statusBadgeClass(order.fulfillmentStatus)}`}
                        >
                          {statusLabel(order.fulfillmentStatus)}
                        </span>
                        {order.dealId && (
                          <p className="text-xs text-slate-400 mt-1 font-mono">{order.dealId}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 min-w-[220px]">
                        <select
                          className="input-field w-full text-xs mb-2"
                          value={draftStatuses[order.id] ?? order.fulfillmentStatus}
                          onChange={(e) =>
                            setDraftStatuses((prev) => ({
                              ...prev,
                              [order.id]: e.target.value as OrderFulfillmentStatus,
                            }))
                          }
                        >
                          {ADMIN_EDITABLE_ORDER_STATUSES.map((status) => (
                            <option key={status} value={status}>
                              {statusLabel(status)}
                            </option>
                          ))}
                        </select>

                        <textarea
                          className="input-field w-full text-xs min-h-[56px] mb-2"
                          value={draftNotes[order.id] ?? ""}
                          onChange={(e) =>
                            setDraftNotes((prev) => ({ ...prev, [order.id]: e.target.value }))
                          }
                          placeholder="Internal ops note"
                        />

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            className="btn-outline text-xs py-1.5 px-2"
                            disabled={savingId === order.id}
                            onClick={() => void saveOrderUpdate(order)}
                          >
                            {savingId === order.id ? "Saving..." : "Save"}
                          </button>
                          {order.merchantDealUrl && (
                            <a
                              href={order.merchantDealUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-outline text-xs py-1.5 px-2 inline-flex items-center gap-1"
                            >
                              <ExternalLink className="h-3 w-3" aria-hidden />
                              Deal
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Gift, Wallet } from "lucide-react";
import AdminStatCard from "@/components/admin/AdminStatCard";
import { formatNgn } from "@/lib/referral/config";

interface OrderAccountingSummary {
  totalOrders: number;
  pendingPaymentCount: number;
  securedCount: number;
  completeCount: number;
  pendingPaymentNgn: number;
  securedGmvNgn: number;
  websiteOrderCount: number;
  chatbotOrderCount: number;
  manualOrderCount: number;
}

interface ReferralAccountingSummary {
  activeReferralCodes: number;
  pendingReferralEvents: number;
  pendingReferrerCreditNgn: number;
  storeCreditOutstandingNgn: number;
  storeCreditRedeemedNgn: number;
}

interface StoreAccountingSummary {
  orders: OrderAccountingSummary;
  referrals: ReferralAccountingSummary;
}

export default function AdminAccountingOverview() {
  const [summary, setSummary] = useState<StoreAccountingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/accounting");
      const data = await response.json();
      if (!response.ok) {
        setSummary(null);
        setError(data.error || "Accounting unavailable.");
        return;
      }
      setSummary(data.summary ?? null);
    } catch {
      setSummary(null);
      setError("Could not load accounting summary.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="card-elevated p-5 border-l-4 border-l-slate-100 animate-pulse">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-slate-100 h-11 w-11 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-2.5 bg-slate-100 rounded w-2/3" />
                <div className="h-6 bg-slate-100 rounded w-1/2" />
                <div className="h-2 bg-slate-100 rounded w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="card-elevated p-6 flex items-start gap-3">
        <div className="rounded-lg bg-amber-50 p-2 shrink-0">
          <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <p className="text-sm text-slate-600">
          {error || "Accounting requires Postgres. Set DATABASE_URL or POSTGRES_URL."}
        </p>
      </div>
    );
  }

  const { orders, referrals } = summary;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold text-slate-900">Orders and payments</h3>
        <p className="text-sm text-slate-600 mt-1">
          Website checkout, chatbot, and manual orders tracked in the store database.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Total orders"
          value={String(orders.totalOrders)}
          hint={`${orders.websiteOrderCount} website · ${orders.chatbotOrderCount} chatbot · ${orders.manualOrderCount} manual`}
          icon={ClipboardList}
          variant="indigo"
        />
        <AdminStatCard
          label="Pending payment"
          value={String(orders.pendingPaymentCount)}
          hint={formatNgn(orders.pendingPaymentNgn)}
          icon={Wallet}
          variant="amber"
        />
        <AdminStatCard
          label="Payment secured"
          value={String(orders.securedCount)}
          hint={formatNgn(orders.securedGmvNgn)}
          icon={Wallet}
          variant="emerald"
        />
        <AdminStatCard
          label="Complete"
          value={String(orders.completeCount)}
          hint="Released on Holdam"
          icon={ClipboardList}
          variant="emerald"
        />
      </div>

      <div>
        <h3 className="font-display text-lg font-bold text-slate-900 mt-2">Referral program</h3>
        <p className="text-sm text-slate-600 mt-1">
          Store credit liability and pending referrer rewards.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminStatCard
          label="Referral links"
          value={String(referrals.activeReferralCodes)}
          hint="Active codes"
          icon={Gift}
          variant="indigo"
        />
        <AdminStatCard
          label="Pending rewards"
          value={String(referrals.pendingReferralEvents)}
          hint={formatNgn(referrals.pendingReferrerCreditNgn)}
          icon={Gift}
          variant="amber"
        />
        <AdminStatCard
          label="Store credit out"
          value={formatNgn(referrals.storeCreditOutstandingNgn)}
          hint="Available to redeem"
          icon={Wallet}
          variant="rose"
        />
        <AdminStatCard
          label="Credit redeemed"
          value={formatNgn(referrals.storeCreditRedeemedNgn)}
          hint="Applied at checkout"
          icon={Wallet}
          variant="emerald"
        />
      </div>
    </div>
  );
}

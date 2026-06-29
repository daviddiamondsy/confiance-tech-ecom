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
      <div className="card-elevated p-6 text-sm text-slate-600">
        Loading order and referral accounting...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="card-elevated p-6 text-sm text-slate-600">
        {error || "Accounting requires Postgres. Set DATABASE_URL or POSTGRES_URL."}
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
        />
        <AdminStatCard
          label="Pending payment"
          value={String(orders.pendingPaymentCount)}
          hint={formatNgn(orders.pendingPaymentNgn)}
          icon={Wallet}
        />
        <AdminStatCard
          label="Payment secured"
          value={String(orders.securedCount)}
          hint={formatNgn(orders.securedGmvNgn)}
          icon={Wallet}
        />
        <AdminStatCard
          label="Complete"
          value={String(orders.completeCount)}
          hint="Released on Holdam"
          icon={ClipboardList}
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
        />
        <AdminStatCard
          label="Pending rewards"
          value={String(referrals.pendingReferralEvents)}
          hint={formatNgn(referrals.pendingReferrerCreditNgn)}
          icon={Gift}
        />
        <AdminStatCard
          label="Store credit out"
          value={formatNgn(referrals.storeCreditOutstandingNgn)}
          hint="Available to redeem"
          icon={Wallet}
        />
        <AdminStatCard
          label="Credit redeemed"
          value={formatNgn(referrals.storeCreditRedeemedNgn)}
          hint="Applied at checkout"
          icon={Wallet}
        />
      </div>
    </div>
  );
}

"use client";

import { Suspense, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Copy, Gift, Share2, Users } from "lucide-react";
import {
  formatNgn,
  formatReferralTierRange,
  REFERRAL_TIERS,
  STORE_CREDIT_EXPIRY_MONTHS,
} from "@/lib/referral/config";
import { buildReferralShareMessage } from "@/lib/referral/share-message";

interface ReferralHistoryItem {
  id: number;
  status: "pending" | "earned";
  refereePhoneMasked: string;
  tierLabel: string;
  referrerCreditNgn: number;
  orderedAt: string;
  earnedAt: string | null;
  creditExpiresAt: string | null;
}

interface ReferralDashboardData {
  code: string;
  referrerName: string | null;
  storeCreditBalanceNgn: number;
  shareUrl: string;
  stats: {
    pendingCount: number;
    earnedCount: number;
    earnedThisMonth: number;
    totalCreditEarnedNgn: number;
  };
  referrals: ReferralHistoryItem[];
}

function formatReferralDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReferDashboardContent() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<ReferralDashboardData | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/referral/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, name }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not load your referral link.");
        setDashboard(null);
        return;
      }
      setDashboard(data);
    } catch {
      setError("Network error. Please try again.");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralCode = async () => {
    if (!dashboard?.code) return;
    try {
      await navigator.clipboard.writeText(dashboard.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch {
      setError("Could not copy referral code.");
    }
  };

  const copyShareMessage = async () => {
    if (!dashboard?.shareUrl || !dashboard.code) return;
    try {
      const message = buildReferralShareMessage({
        code: dashboard.code,
        shareUrl: dashboard.shareUrl,
        referrerName: dashboard.referrerName,
      });
      await navigator.clipboard.writeText(message);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      setError("Could not copy share message.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-100 text-primary-600 mb-4">
          <Gift className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">
          Refer a Friend, Earn Store Credit
        </h1>
        <p className="text-slate-600 leading-relaxed max-w-xl mx-auto">
          Share your link. Friends save on their first order from our store. You earn store credit after
          their order completes and the return window closes.
        </p>
      </div>

      <div className="card-elevated p-8 mb-8">
        <form onSubmit={handleLookup} className="space-y-4">
          <div>
            <label htmlFor="refer-name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Your name (optional)
            </label>
            <input
              id="refer-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="How friends will see you"
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="refer-phone" className="block text-sm font-medium text-slate-700 mb-1.5">
              Phone number used at checkout *
            </label>
            <input
              id="refer-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Your mobile number"
              required
              className="input-field"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
            {loading ? "Loading..." : "Get my referral link"}
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </div>

      {dashboard && (
        <div className="space-y-6">
          <div className="card-elevated p-8">
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-6">
              Your referral link
            </p>

            <p className="text-sm font-medium text-slate-700 mb-2">Your referral code</p>
            <div className="flex items-stretch gap-3 mb-6">
              <div className="flex flex-1 items-center justify-between rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                <span className="font-display text-lg font-bold tracking-wide text-slate-900">
                  {dashboard.code}
                </span>
                <button
                  type="button"
                  onClick={copyReferralCode}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
                  aria-label={copiedCode ? "Referral code copied" : "Copy referral code"}
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
            {copiedCode && (
              <p className="-mt-4 mb-4 text-xs font-medium text-emerald-600">Code copied</p>
            )}

            <button type="button" onClick={copyShareMessage} className="btn-primary w-full sm:w-auto">
              <Share2 className="h-4 w-4" />
              {copiedShare ? "Message copied" : "Share"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-elevated p-5">
              <p className="text-sm text-slate-500 mb-1">Available store credit</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatNgn(dashboard.storeCreditBalanceNgn)}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                Store credit expires {STORE_CREDIT_EXPIRY_MONTHS} months after each reward is earned.
              </p>
            </div>
            <div className="card-elevated p-5">
              <p className="text-sm text-slate-500 mb-1">Successful referrals</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.stats.earnedCount}</p>
            </div>
            <div className="card-elevated p-5">
              <p className="text-sm text-slate-500 mb-1">Pending referrals</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.stats.pendingCount}</p>
            </div>
          </div>

          {dashboard.referrals.length > 0 && (
            <div className="card-elevated p-8">
              <h2 className="font-display text-xl font-bold text-slate-900 mb-2">Your referrals</h2>
              <p className="text-sm text-slate-500 mb-4">
                Credit appears here after each friend&apos;s order completes. Pending orders show the amount
                you will earn.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4 font-medium">Friend</th>
                      <th className="py-2 pr-4 font-medium">Tier</th>
                      <th className="py-2 pr-4 font-medium">Status</th>
                      <th className="py-2 pr-4 font-medium">You earn</th>
                      <th className="py-2 font-medium">Expires</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-700">
                    {dashboard.referrals.map((referral) => (
                      <tr key={referral.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {referral.refereePhoneMasked}
                        </td>
                        <td className="py-3 pr-4">{referral.tierLabel}</td>
                        <td className="py-3 pr-4 capitalize">
                          {referral.status === "pending" ? "Pending" : "Earned"}
                        </td>
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {formatNgn(referral.referrerCreditNgn)}
                        </td>
                        <td className="py-3 text-slate-600">
                          {referral.creditExpiresAt
                            ? formatReferralDate(referral.creditExpiresAt)
                            : referral.status === "pending"
                              ? "After order completes"
                              : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="card-elevated p-8">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-xl font-bold text-slate-900">How it works</h2>
            </div>
            <ol className="space-y-3 text-slate-600 list-decimal list-inside leading-relaxed">
              <li>Send your link to a friend buying their first device from us.</li>
              <li>They get an automatic discount at checkout.</li>
              <li>You receive store credit after their order completes (not returned or disputed).</li>
              <li>Use store credit on your next order from this store within {STORE_CREDIT_EXPIRY_MONTHS} months.</li>
            </ol>
          </div>

          <div className="card-elevated p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-xl font-bold text-slate-900">Reward tiers</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Fixed store credit amounts by your friend&apos;s catalog price band.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="py-2 pr-4 font-medium">Price tier</th>
                    <th className="py-2 pr-4 font-medium">Friend saves</th>
                    <th className="py-2 font-medium">You earn</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700">
                  {REFERRAL_TIERS.map((tier) => (
                    <tr key={tier.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4">
                        <span className="block font-medium text-slate-900">{tier.label}</span>
                        <span className="block text-xs text-slate-500 mt-0.5">
                          {formatReferralTierRange(tier)}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {formatNgn(tier.refereeDiscountNgn)}
                      </td>
                      <td className="py-3">
                        {formatNgn(tier.referrerCreditNgn)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ReferPageClient() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <Suspense fallback={<div className="py-20 text-center text-slate-500">Loading...</div>}>
        <ReferDashboardContent />
      </Suspense>
      <Footer />
    </div>
  );
}

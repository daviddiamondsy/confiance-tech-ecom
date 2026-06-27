"use client";

import { Suspense, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Copy, Gift, Share2, Users } from "lucide-react";
import {
  formatNgn,
  formatReferralTierRange,
  REFERRAL_TIERS,
} from "@/lib/referral/config";

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
}

function ReferDashboardContent() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<ReferralDashboardData | null>(null);
  const [copied, setCopied] = useState(false);

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

  const copyLink = async () => {
    if (!dashboard?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(dashboard.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
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
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">Your link</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <code className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-800 break-all">
                {dashboard.shareUrl}
              </code>
              <button type="button" onClick={copyLink} className="btn-primary whitespace-nowrap">
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Your code: <span className="font-semibold text-slate-900">{dashboard.code}</span>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="card-elevated p-5">
              <p className="text-sm text-slate-500 mb-1">Store credit balance</p>
              <p className="text-2xl font-bold text-primary-600">
                {formatNgn(dashboard.storeCreditBalanceNgn)}
              </p>
            </div>
            <div className="card-elevated p-5">
              <p className="text-sm text-slate-500 mb-1">Successful referrals</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.stats.earnedCount}</p>
            </div>
            <div className="card-elevated p-5">
              <p className="text-sm text-slate-500 mb-1">Pending this month</p>
              <p className="text-2xl font-bold text-slate-900">{dashboard.stats.earnedThisMonth}</p>
            </div>
          </div>

          <div className="card-elevated p-8">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-xl font-bold text-slate-900">How it works</h2>
            </div>
            <ol className="space-y-3 text-slate-600 list-decimal list-inside leading-relaxed">
              <li>Send your link to a friend buying their first device from us.</li>
              <li>They get an automatic discount at checkout.</li>
              <li>You receive store credit after their order completes (not returned or disputed).</li>
              <li>Use store credit on your next order from this store.</li>
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

"use client";

import { Suspense, useEffect, useState } from "react";
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
import { readLastOrderPhone } from "@/lib/customer-phone-storage";

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
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  useEffect(() => {
    const savedPhone = readLastOrderPhone();
    if (savedPhone) {
      setPhone(savedPhone);
    }
  }, []);

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

  const copyReferralLink = async () => {
    if (!dashboard?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(dashboard.shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setError("Could not copy referral link.");
    }
  };

  const copyShareMessage = async () => {
    if (!dashboard?.shareUrl) return;
    try {
      const message = buildReferralShareMessage({
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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="relative bg-slate-950 text-white overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8 mb-10">
        <div className="absolute inset-0 bg-hero-mesh opacity-50" />
        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-white/10 mb-5">
            <Gift className="h-8 w-8 text-primary-300" />
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 tracking-tight">
            Refer &amp; Earn Store Points
          </h1>
          <p className="text-slate-400 leading-relaxed max-w-lg mx-auto">
            Share your link. Friends save on their first order. You earn store points after their order completes.
          </p>
        </div>
      </div>

      <div className="card-elevated overflow-hidden mb-8">
        <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-8 py-5">
          <h2 className="font-display font-bold text-white">Find your referral link</h2>
          <p className="text-primary-100 text-sm mt-0.5">Enter the phone number you used at checkout</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleLookup} className="space-y-4">
            <div>
              <label htmlFor="refer-name" className="input-label">Your name (optional)</label>
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
              <label htmlFor="refer-phone" className="input-label">Phone number used at checkout *</label>
              <input
                id="refer-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 08012345678"
                required
                className="input-field"
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? "Loading…" : "Get my referral link"}
            </button>
          </form>
          {error && (
            <div className="mt-4 alert-error">
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>

      {dashboard && (
        <div className="space-y-6">
          {/* Referral link card */}
          <div className="card-elevated overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-slate-900">Your referral link</p>
                <p className="text-xs text-slate-500 mt-0.5">Share this link with friends to earn store points</p>
              </div>
              {copiedLink && (
                <span className="badge-success">Copied!</span>
              )}
            </div>
            <div className="p-8">
              <div className="flex items-center gap-2 mb-5 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-sm font-mono text-slate-700 flex-1 break-all">{dashboard.shareUrl}</span>
                <button
                  type="button"
                  onClick={copyReferralLink}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all text-xs font-semibold"
                  aria-label={copiedLink ? "Referral link copied" : "Copy referral link"}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Copy
                </button>
              </div>
              <button type="button" onClick={copyShareMessage} className="btn-primary">
                <Share2 className="h-4 w-4" />
                {copiedShare ? "Message copied!" : "Copy share message"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="stat-card border-l-4 border-primary-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Store points</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">
                {formatNgn(dashboard.storeCreditBalanceNgn)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Expires {STORE_CREDIT_EXPIRY_MONTHS} months after earned
              </p>
            </div>
            <div className="stat-card border-l-4 border-emerald-500">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Earned</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dashboard.stats.earnedCount}</p>
              <p className="text-xs text-slate-400 mt-1">Successful referrals</p>
            </div>
            <div className="stat-card border-l-4 border-amber-400">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{dashboard.stats.pendingCount}</p>
              <p className="text-xs text-slate-400 mt-1">Awaiting completion</p>
            </div>
          </div>

          {dashboard.referrals.length > 0 && (
            <div className="card-elevated overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100">
                <h2 className="font-display text-lg font-bold text-slate-900">Your referrals</h2>
                <p className="text-sm text-slate-500 mt-0.5">
                  Points appear after each friend&apos;s order completes.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <th className="py-3 px-6 font-semibold">Friend</th>
                      <th className="py-3 pr-4 font-semibold">Tier</th>
                      <th className="py-3 pr-4 font-semibold">Status</th>
                      <th className="py-3 pr-4 font-semibold">You earn</th>
                      <th className="py-3 pr-6 font-semibold">Expires</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.referrals.map((referral) => (
                      <tr key={referral.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          {referral.refereePhoneMasked}
                        </td>
                        <td className="py-3.5 pr-4 text-slate-600">{referral.tierLabel}</td>
                        <td className="py-3.5 pr-4">
                          <span className={referral.status === "earned" ? "badge-success" : "badge-warning"}>
                            {referral.status === "earned" ? "Earned" : "Pending"}
                          </span>
                        </td>
                        <td className="py-3.5 pr-4 font-semibold text-slate-900">
                          {formatNgn(referral.referrerCreditNgn)}
                        </td>
                        <td className="py-3.5 pr-6 text-slate-500 text-xs">
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
              <li>You receive store points after their order completes (not returned or disputed).</li>
              <li>Use store points on your next order from this store within {STORE_CREDIT_EXPIRY_MONTHS} months.</li>
            </ol>
          </div>

          <div className="card-elevated p-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-primary-600" />
              <h2 className="font-display text-xl font-bold text-slate-900">Reward tiers</h2>
            </div>
            <p className="text-sm text-slate-500 mb-4">
              Fixed store point amounts by your friend&apos;s catalog price band.
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
      <Suspense fallback={
        <div className="py-20 text-center text-slate-500 animate-pulse">
          <div className="w-12 h-12 bg-slate-200 rounded-2xl mx-auto mb-4" />
          <p className="text-sm">Loading your dashboard…</p>
        </div>
      }>
        <div className="pb-16">
          <ReferDashboardContent />
        </div>
      </Suspense>
      <Footer />
    </div>
  );
}

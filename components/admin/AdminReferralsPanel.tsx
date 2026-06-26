"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Copy, Gift, RefreshCw } from "lucide-react";
import { formatNgn } from "@/lib/referral/config";

interface AdminReferralRow {
  id: number;
  code: string;
  referrerPhone: string;
  referrerName: string | null;
  createdAt: string;
  earnedCount: number;
  pendingCount: number;
  storeCreditBalanceNgn: number;
  shareUrl: string;
}

const emptyForm = {
  name: "",
  phone: "",
  customCode: "",
};

export default function AdminReferralsPanel() {
  const [referrals, setReferrals] = useState<AdminReferralRow[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadReferrals = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/referrals");
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not load referrals.");
        setReferrals([]);
        return;
      }
      setReferrals(data.referrals ?? []);
    } catch {
      setError("Network error while loading referrals.");
      setReferrals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadReferrals();
  }, [loadReferrals]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setCreating(true);
    setError("");
    setMessage("");
    setGeneratedLink(null);

    try {
      const response = await fetch("/api/admin/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not create referral link.");
        return;
      }

      setMessage(
        data.created
          ? `Created referral link for ${data.referrerName || data.referrerPhone}.`
          : `Referral link already exists for this phone.`
      );
      setGeneratedLink(data.shareUrl);
      setForm((prev) => ({ ...prev, customCode: "" }));
      await loadReferrals();
    } catch {
      setError("Network error while creating referral link.");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = async (link: string) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy link.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold text-slate-900">Referrals</h2>
        <p className="text-sm text-slate-600 mt-1">
          Generate share links for past buyers. Optional custom codes must be 4 to 20 letters or numbers.
        </p>
      </div>

      <section className="card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary-600" />
          <h3 className="font-display text-lg font-bold text-slate-900">Create referral link</h3>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="referral-name" className="block text-sm font-medium text-slate-700 mb-2">
              Customer name
            </label>
            <input
              id="referral-name"
              type="text"
              className="input-field"
              placeholder="Cherish"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            />
          </div>
          <div>
            <label htmlFor="referral-phone" className="block text-sm font-medium text-slate-700 mb-2">
              Checkout phone *
            </label>
            <input
              id="referral-phone"
              type="tel"
              className="input-field"
              placeholder="08012345678"
              value={form.phone}
              onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
              required
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="referral-code" className="block text-sm font-medium text-slate-700 mb-2">
              Custom code (optional)
            </label>
            <input
              id="referral-code"
              type="text"
              className="input-field uppercase"
              placeholder="CHERISH24"
              value={form.customCode}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, customCode: event.target.value.toUpperCase() }))
              }
            />
            <p className="text-xs text-slate-500 mt-1">
              Leave blank to auto-generate from the customer name.
            </p>
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-3">
            <button type="submit" className="btn-primary" disabled={creating}>
              {creating ? "Generating..." : "Generate link"}
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => void loadReferrals()}
              disabled={loading}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh list
            </button>
            {message && (
              <p className="text-sm text-emerald-700" role="status">
                {message}
              </p>
            )}
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
        </form>

        {generatedLink && (
          <div className="mt-6 rounded-xl border border-primary-100 bg-primary-50/60 p-4">
            <p className="text-sm font-medium text-slate-700 mb-2">Share link</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <code className="flex-1 rounded-lg bg-white border border-slate-200 px-3 py-2 text-sm break-all">
                {generatedLink}
              </code>
              <button type="button" className="btn-primary whitespace-nowrap" onClick={() => copyLink(generatedLink)}>
                <Copy className="h-4 w-4" />
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="card-elevated p-6">
        <h3 className="font-display text-lg font-bold text-slate-900 mb-4">Existing referral links</h3>

        {loading ? (
          <p className="text-sm text-slate-600">Loading referrals...</p>
        ) : referrals.length === 0 ? (
          <p className="text-sm text-slate-600">No referral links yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium hidden lg:table-cell">Link</th>
                  <th className="px-4 py-3 font-medium">Earned</th>
                  <th className="px-4 py-3 font-medium">Pending</th>
                  <th className="px-4 py-3 font-medium">Credit</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {referrals.map((referral) => (
                  <tr key={referral.id} className="bg-white">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{referral.referrerName || "—"}</p>
                      <p className="text-xs text-slate-500">{referral.referrerPhone}</p>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{referral.code}</td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs truncate text-slate-600">
                      {referral.shareUrl}
                    </td>
                    <td className="px-4 py-3">{referral.earnedCount}</td>
                    <td className="px-4 py-3">{referral.pendingCount}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{formatNgn(referral.storeCreditBalanceNgn)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="btn-outline text-sm py-2 px-3"
                        onClick={() => copyLink(referral.shareUrl)}
                      >
                        Copy
                      </button>
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

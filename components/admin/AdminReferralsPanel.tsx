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
  const [deletingId, setDeletingId] = useState<number | null>(null);

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

  const handleDelete = async (referral: AdminReferralRow) => {
    const label = referral.referrerName || referral.code;
    const confirmed = window.confirm(
      `Delete referral link for ${label}? The link will stop working. Store credit already earned is not removed.`
    );
    if (!confirmed) return;

    setDeletingId(referral.id);
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/admin/referrals?id=${referral.id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not delete referral link.");
        return;
      }
      setMessage(`Deleted referral link ${referral.code}.`);
      if (generatedLink?.includes(referral.code)) {
        setGeneratedLink(null);
      }
      await loadReferrals();
    } catch {
      setError("Network error while deleting referral link.");
    } finally {
      setDeletingId(null);
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
              placeholder="Customer name"
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
              placeholder="Checkout mobile number"
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
              placeholder="Custom referral code"
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
        <div className="flex items-center gap-2 mb-5">
          <h3 className="font-display text-lg font-bold text-slate-900">Existing referral links</h3>
          {!loading && (
            <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
              {referrals.length}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : referrals.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-slate-400">
            <Gift className="h-9 w-9 opacity-40" />
            <p className="text-sm font-medium">No referral links yet.</p>
            <p className="text-xs text-center max-w-xs">
              Generate a link above for a past buyer and their share URL will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Customer</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Code</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400 hidden lg:table-cell">Link</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Earned</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Pending</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Credit</th>
                  <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wide text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {referrals.map((referral, idx) => (
                  <tr
                    key={referral.id}
                    className={`border-t border-slate-50 transition-colors hover:bg-primary-50/30 ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-900">{referral.referrerName || "—"}</p>
                      <p className="text-xs text-slate-500">{referral.referrerPhone}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-800">
                        {referral.code}
                      </code>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell max-w-xs truncate text-slate-500 text-xs">
                      {referral.shareUrl}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        {referral.earnedCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {referral.pendingCount > 0 ? (
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-700">
                          {referral.pendingCount}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-semibold text-slate-800">{formatNgn(referral.storeCreditBalanceNgn)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1.5">
                        <button
                          type="button"
                          title="Copy share link"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                          onClick={() => copyLink(referral.shareUrl)}
                        >
                          <Copy className="h-3 w-3" />
                          Copy
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                          disabled={deletingId === referral.id}
                          onClick={() => void handleDelete(referral)}
                        >
                          {deletingId === referral.id ? "…" : "Delete"}
                        </button>
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

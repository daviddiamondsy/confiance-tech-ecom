"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import CompanyLogo from "@/components/CompanyLogo";

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/admin";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error ?? "Login failed");
        return;
      }

      router.push(nextPath);
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-surface-muted">
      <div className="w-full max-w-md card-elevated p-8">
        <div className="flex justify-center mb-6">
          <CompanyLogo size={72} priority />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-2 text-center">
          Confiance Tech
        </p>
        <h1 className="font-display text-2xl font-bold text-slate-900 mb-2">Catalog admin</h1>
        <p className="text-slate-600 mb-8 text-sm">
          Sign in to manage pricing, filter tags, and products.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="input-field"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center">
          <Link href="/" className="text-sm text-primary-700 hover:text-primary-800 font-medium">
            Return to store
          </Link>
        </p>
      </div>
    </div>
  );
}

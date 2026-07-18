"use client";

import { useCallback, useEffect, useState } from "react";

export const REFERRAL_STORAGE_KEY = "holdam_referral_code";
export const REFERRAL_CODE_EVENT = "holdam:referral-code";

export function persistReferralCode(code: string): void {
  if (typeof window === "undefined") return;
  const normalized = code.trim().toUpperCase();
  if (!normalized) return;
  sessionStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
  window.dispatchEvent(new CustomEvent(REFERRAL_CODE_EVENT, { detail: normalized }));
}

export function readPersistedReferralCode(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(REFERRAL_STORAGE_KEY);
}

export function clearPersistedReferralCode(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(REFERRAL_CODE_EVENT, { detail: null }));
}

/** Capture ?ref= from the current URL into sessionStorage (safe to call repeatedly). */
export function captureReferralCodeFromUrl(): string | null {
  if (typeof window === "undefined") return null;
  const ref = new URLSearchParams(window.location.search).get("ref")?.trim();
  if (!ref) return readPersistedReferralCode();
  persistReferralCode(ref);
  return ref.toUpperCase();
}

export interface ReferralDiscountPreview {
  code: string | null;
  discountNgn: number;
  referrerName: string | null;
  loading: boolean;
}

/**
 * Loads the persisted referral preview for a catalog price.
 * Reacts when ReferralCapture (or another caller) persists a code.
 */
export function useReferralDiscount(catalogPriceNgn: number): ReferralDiscountPreview {
  const [code, setCode] = useState<string | null>(null);
  const [discountNgn, setDiscountNgn] = useState(0);
  const [referrerName, setReferrerName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const syncCode = useCallback(() => {
    const fromUrl = captureReferralCodeFromUrl();
    setCode(fromUrl);
    return fromUrl;
  }, []);

  useEffect(() => {
    const initial = syncCode();
    if (!initial) {
      setLoading(false);
      setDiscountNgn(0);
      setReferrerName(null);
    }

    const onCode = () => {
      syncCode();
    };
    window.addEventListener(REFERRAL_CODE_EVENT, onCode);
    // ReferralCapture may persist after first paint; re-check briefly.
    const t0 = window.setTimeout(onCode, 0);
    const t1 = window.setTimeout(onCode, 150);
    return () => {
      window.removeEventListener(REFERRAL_CODE_EVENT, onCode);
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, [syncCode]);

  useEffect(() => {
    if (!code || !catalogPriceNgn || catalogPriceNgn <= 0) {
      setDiscountNgn(0);
      setReferrerName(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    async function loadPreview() {
      try {
        const response = await fetch("/api/referral/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: code, catalogPriceNgn }),
        });
        const data = await response.json();
        if (cancelled) return;

        if (data.valid && data.refereeDiscountNgn) {
          setDiscountNgn(Number(data.refereeDiscountNgn) || 0);
          setReferrerName(data.referrerName ?? null);
        } else {
          setDiscountNgn(0);
          setReferrerName(null);
          const reason = typeof data.reason === "string" ? data.reason.toLowerCase() : "";
          // Drop only broken codes; keep code when the current variant is below the min floor.
          if (
            reason.includes("not found") ||
            reason.includes("own referral")
          ) {
            clearPersistedReferralCode();
            setCode(null);
          }
        }
      } catch {
        if (!cancelled) {
          setDiscountNgn(0);
          setReferrerName(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPreview();
    return () => {
      cancelled = true;
    };
  }, [code, catalogPriceNgn]);

  return { code, discountNgn, referrerName, loading };
}

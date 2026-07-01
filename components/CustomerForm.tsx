"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import StateSelect from "@/components/StateSelect";
import { resolveStorefrontCheckoutError } from "@/lib/checkout-errors";
import {
  readPersistedReferralCode,
  clearPersistedReferralCode,
} from "@/components/ReferralDiscountBanner";
import { formatNgn } from "@/lib/referral/config";
import { persistLastOrderPhone, readLastOrderPhone } from "@/lib/customer-phone-storage";

function checkoutStorageKey(productId?: string) {
  return productId ? `holdam_checkout_${productId}` : "holdam_checkout";
}

// Meta Pixel conversion tracking
declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const trackLead = () => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Lead");
  }
};

function initialOrderFormData() {
  if (process.env.NODE_ENV !== "development") {
    return { name: "", address: "", state: "", phone: "" };
  }

  return {
    name: "Test Customer",
    address: "12 Admiralty Way, Lekki Phase 1",
    state: "Lagos",
    phone: "08012345678",
  };
}

interface CustomerFormProps {
  variant?: "default" | "compact" | "inline";
  title?: string;
  subtitle?: string;
  productPrice?: number;
  productName?: string;
  productId?: string;
  /** Selected storage variant label (e.g. 256GB) for server-side price lookup */
  productStorage?: string;
  /** Selected color (e.g. Space Black) */
  productColor?: string;
  /** URL slug for checkout cancel redirect back to the product page */
  productSlug?: string;
  /** Days until delivery due (Holdam deliveryDueAt); defaults to HOLDAM_DELIVERY_DAYS server-side */
  deliveryDays?: number;
}

export default function CustomerForm({
  variant = "default",
  title = "Get Exclusive Updates",
  subtitle = "Subscribe to receive product updates and special offers.",
  productPrice,
  productName,
  productId,
  productStorage,
  productColor,
  productSlug,
  deliveryDays,
}: CustomerFormProps) {
  const [formData, setFormData] = useState(initialOrderFormData);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [storeCreditBalanceNgn, setStoreCreditBalanceNgn] = useState(0);
  const [applyStoreCredit, setApplyStoreCredit] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setReferralCode(readPersistedReferralCode());
    const savedPhone = readLastOrderPhone();
    if (savedPhone) {
      setFormData((prev) => ({ ...prev, phone: savedPhone }));
    }
  }, []);

  const resetCheckoutUiState = useCallback(() => {
    setIsRedirecting(false);
    setIsSubmitting(false);
  }, []);

  // Browser back from Holdam checkout restores this page from bfcache with stale isRedirecting=true.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const key = checkoutStorageKey(productId);
    const saved = sessionStorage.getItem(key);
    if (saved) setPendingCheckoutUrl(saved);

    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) resetCheckoutUiState();
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, [productId, resetCheckoutUiState]);

  const goToCheckout = (checkoutUrl: string) => {
    if (productId) {
      sessionStorage.setItem(checkoutStorageKey(productId), checkoutUrl);
      setPendingCheckoutUrl(checkoutUrl);
    }
    setIsRedirecting(true);
    window.location.assign(checkoutUrl);
  };

  const handleContinueToCheckout = () => {
    if (!pendingCheckoutUrl) return;
    setErrorMessage("");
    goToCheckout(pendingCheckoutUrl);
  };

  const handleStateChange = (state: string) => {
    setFormData((prev) => ({ ...prev, state }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      console.log("[Order] Submitting order request", {
        productId,
        productName,
        productPrice,
        productStorage,
        productColor,
        customerData: formData,
      });

      const response = await fetch("/api/create-holdam-deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          productSlug,
          productName,
          productPrice,
          productStorage,
          productColor,
          deliveryDays,
          customerData: formData,
          referralCode,
          applyStoreCredit: applyStoreCredit && storeCreditBalanceNgn > 0,
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => null);

        console.error("[Order] Checkout creation failed", {
          status: response.status,
          statusText: response.statusText,
          errorPayload,
        });

        setErrorMessage(resolveStorefrontCheckoutError(errorPayload));
        setIsSubmitting(false);
        setIsRedirecting(false);
        return;
      }

      const responseData = await response.json();
      console.log("[Order] Full API response:", JSON.stringify(responseData));

      const { deal, checkoutUrl } = responseData;
      console.log("[Order] Holdam deal created successfully", { dealId: deal?.id, checkoutUrl });

      trackLead();

      if (formData.phone?.trim()) {
        persistLastOrderPhone(formData.phone);
      }

      if (referralCode) {
        clearPersistedReferralCode();
      }
      
      if (checkoutUrl) {
        goToCheckout(checkoutUrl);
        return;
      }

      setIsSubmitting(false);
      router.push("/thank-you");
    } catch (error) {
      console.error("[Order] Order submission error:", error);
      setErrorMessage("We could not submit your order. Please check your connection and try again.");
      setIsSubmitting(false);
      setIsRedirecting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const fetchStoreCreditBalance = useCallback(async (phone: string) => {
    if (!phone.trim()) {
      setStoreCreditBalanceNgn(0);
      setApplyStoreCredit(false);
      return;
    }

    try {
      const response = await fetch("/api/referral/balance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (!response.ok) {
        setStoreCreditBalanceNgn(0);
        return;
      }
      const data = await response.json();
      setStoreCreditBalanceNgn(Number(data.storeCreditBalanceNgn) || 0);
    } catch {
      setStoreCreditBalanceNgn(0);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchStoreCreditBalance(formData.phone);
    }, 400);
    return () => clearTimeout(timer);
  }, [formData.phone, fetchStoreCreditBalance]);

  const primaryButtonLabel = isRedirecting
    ? "Opening checkout…"
    : isSubmitting
      ? variant === "inline"
        ? "Processing..."
        : "Submitting..."
      : variant === "inline"
        ? "Order Now"
        : "Place Order";

  const showContinuePayment =
    !!pendingCheckoutUrl && !isSubmitting && !isRedirecting;

  const continuePaymentLink = showContinuePayment ? (
    <button
      type="button"
      onClick={handleContinueToCheckout}
      className="text-sm font-medium text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline"
    >
      Continue to payment
    </button>
  ) : null;

  const storeCreditField =
    storeCreditBalanceNgn > 0 ? (
      <label className="flex items-start gap-3 rounded-lg border border-primary-100 bg-primary-50/60 p-4 cursor-pointer">
        <input
          type="checkbox"
          checked={applyStoreCredit}
          onChange={(e) => setApplyStoreCredit(e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
        />
        <span className="text-sm text-slate-700 leading-relaxed">
          Apply {formatNgn(storeCreditBalanceNgn)} store points to this order
        </span>
      </label>
    ) : null;

  if (variant === "inline") {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Your name"
          required
          className="input-field flex-1 min-w-[150px]"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Your mobile number"
          required
          className="input-field flex-1 min-w-[150px]"
        />
        <StateSelect
          name="state"
          value={formData.state}
          onChange={handleStateChange}
          required
          placeholder="Select state"
          className="flex-1 min-w-[180px]"
        />
        {storeCreditField}
        <button
          type="submit"
          disabled={isSubmitting || isRedirecting}
          className="btn-primary disabled:opacity-50"
        >
          {primaryButtonLabel}
          <Send className="h-4 w-4" />
        </button>
        {continuePaymentLink && (
          <div className="w-full text-center sm:text-left">{continuePaymentLink}</div>
        )}
        {isSubmitted && (
          <div className="sm:absolute sm:mt-16 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Thank you! We will contact you shortly.</span>
          </div>
        )}
        {errorMessage && (
          <div className="sm:absolute sm:mt-16 flex items-center gap-2 text-red-600 text-sm">
            <span>{errorMessage}</span>
          </div>
        )}
      </form>
    );
  }

  if (variant === "compact") {
    return (
      <div className="card-elevated p-6">
        <h3 className="font-display text-lg font-semibold text-slate-900 mb-1">{title}</h3>
        <p className="text-sm text-slate-600 mb-4">{subtitle}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="input-field text-sm py-2.5"
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Your mobile number"
            required
            className="input-field text-sm py-2.5"
          />
          <StateSelect
            name="state"
            value={formData.state}
            onChange={handleStateChange}
            required
            placeholder="Select state"
            inputClassName="text-sm py-2.5"
          />
          {storeCreditField}
          <button
            type="submit"
            disabled={isSubmitting || isRedirecting}
            className="btn-primary w-full text-sm py-2.5 disabled:opacity-50"
          >
            {primaryButtonLabel}
            <Send className="h-4 w-4" />
          </button>
          {continuePaymentLink && (
            <div className="text-center">{continuePaymentLink}</div>
          )}
        </form>
        {isSubmitted && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Thank you! We will be in touch soon.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-3 text-sm text-red-600">
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="order-form" className="bg-white rounded-3xl border border-slate-100 shadow-card">
      <div className="bg-gradient-to-r from-primary-600 to-violet-600 px-8 py-6 rounded-t-3xl">
        <h3 className="font-display text-2xl font-bold text-white mb-1">{title}</h3>
        <p className="text-primary-100 text-sm leading-relaxed">{subtitle}</p>
      </div>
      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="input-label">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Your full name"
              required
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="phone" className="input-label">Phone Number *</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="e.g. 08012345678"
              required
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="address" className="input-label">Delivery Address *</label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street, area, city"
              required
              className="input-field"
            />
          </div>
          <div className="relative z-20">
            <label htmlFor="state" className="input-label">State *</label>
            <StateSelect
              id="state"
              name="state"
              value={formData.state}
              onChange={handleStateChange}
              required
              placeholder="Select your state"
            />
          </div>
          {storeCreditField}
          <button
            type="submit"
            disabled={isSubmitting || isRedirecting}
            className="btn-primary w-full py-4 text-base disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {(isSubmitting || isRedirecting) ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            {primaryButtonLabel}
          </button>
          {continuePaymentLink && (
            <div className="text-center">{continuePaymentLink}</div>
          )}
        </form>
        {isSubmitted && (
          <div className="mt-5 alert-success">
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
            <span>Thank you! We have received your request and will contact you shortly.</span>
          </div>
        )}
        {errorMessage && (
          <div className="mt-5 alert-error">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}

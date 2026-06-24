"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Send, CheckCircle } from "lucide-react";
import StateSelect from "@/components/StateSelect";
import { resolveStorefrontCheckoutError } from "@/lib/checkout-errors";

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

interface CustomerFormProps {
  variant?: "default" | "compact" | "inline";
  title?: string;
  subtitle?: string;
  productPrice?: number;
  productName?: string;
  productId?: string;
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
  productSlug,
  deliveryDays,
}: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    phone: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [pendingCheckoutUrl, setPendingCheckoutUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

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
          deliveryDays,
          customerData: formData,
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
          placeholder="Phone number"
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
            placeholder="Phone number"
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
    <div className="card-elevated p-8">
      <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-600 mb-6">{subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
            Full Name *
          </label>
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
          <label htmlFor="phone" className="block text-sm font-medium text-slate-700 mb-1.5">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-slate-700 mb-1.5">
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Delivery address"
            required
            className="input-field"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-slate-700 mb-1.5">
            State *
          </label>
          <StateSelect
            id="state"
            name="state"
            value={formData.state}
            onChange={handleStateChange}
            required
            placeholder="Select your state"
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || isRedirecting}
          className="btn-primary w-full py-4 text-lg disabled:opacity-50"
        >
          {primaryButtonLabel}
          <Send className="h-5 w-5" />
        </button>
        {continuePaymentLink && (
          <div className="text-center">{continuePaymentLink}</div>
        )}
      </form>
      {isSubmitted && (
        <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>Thank you! We have received your request and will contact you shortly.</span>
        </div>
      )}
      {errorMessage && (
        <div className="mt-4 text-sm text-red-600 bg-red-50 p-4 rounded-lg">
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}

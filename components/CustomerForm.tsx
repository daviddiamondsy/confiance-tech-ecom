"use client";

import { useState } from "react";
import { Send, CheckCircle, CreditCard } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";

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

// Nigerian states
const nigerianStates = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT (Abuja)",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers (Port Harcourt)",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

// States that don't require confirmation fee
const noFeeStates = ["Edo", "Lagos", "FCT (Abuja)", "Rivers (Port Harcourt)"];

interface CustomerFormProps {
  variant?: "default" | "compact" | "inline";
  title?: string;
  subtitle?: string;
  productPrice?: number;
  productName?: string;
  productId?: string;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "");

export default function CustomerForm({ 
  variant = "default",
  title = "Get Exclusive Updates",
  subtitle = "Subscribe to receive product updates and special offers.",
  productPrice,
  productName,
  productId,
}: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    phone: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requiresPayment, setRequiresPayment] = useState(false);

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedState = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state: selectedState,
    }));
    
    // Check if state requires confirmation fee
    if (selectedState && !noFeeStates.includes(selectedState)) {
      setRequiresPayment(true);
    } else {
      setRequiresPayment(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // If state requires payment and we have product details
    if (requiresPayment && productPrice && productName && productId) {
      try {
        const confirmationFee = Math.round(productPrice * 0.05);
        
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: confirmationFee,
            productName,
            productId,
            customerData: formData,
          }),
        });

        const data = await response.json();

        if (data.url) {
          window.location.href = data.url;
          return;
        }
      } catch (error) {
        console.error("Payment error:", error);
      }
    }
    
    // Regular form submission for eligible states
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    setFormData({ name: "", address: "", state: "", phone: "" });
    setRequiresPayment(false);
    
    // Track Meta Pixel conversion
    trackLead();
    
    setTimeout(() => setIsSubmitted(false), 5000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

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
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[150px]"
        />
        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="Phone number"
          required
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none min-w-[150px]"
        />
        <select
          name="state"
          value={formData.state}
          onChange={handleStateChange}
          required
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white min-w-[150px]"
        >
          <option value="">Select state</option>
          {nigerianStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? "Processing..." : requiresPayment ? "Pay 5% & Order" : "Order Now"}
          <Send className="h-4 w-4" />
        </button>
        {isSubmitted && (
          <div className="sm:absolute sm:mt-16 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Thank you! We will contact you shortly.</span>
          </div>
        )}
      </form>
    );
  }

  if (variant === "compact") {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
          />
          <select
            name="state"
            value={formData.state}
            onChange={handleStateChange}
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm bg-white"
          >
            <option value="">Select state</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {requiresPayment && productPrice && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              5% confirmation fee (₦{Math.round(productPrice * 0.05).toLocaleString()}) required
            </p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting 
              ? (requiresPayment ? "Redirecting..." : "Submitting...") 
              : (requiresPayment ? "Pay 5% & Order" : "Place Order")}
            <Send className="h-4 w-4" />
          </button>
        </form>
        {isSubmitted && (
          <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Thank you! We will be in touch soon.</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+1 (555) 123-4567"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address *
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="123 Main Street, Apartment 4B"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
            State *
          </label>
          <select
            id="state"
            name="state"
            value={formData.state}
            onChange={handleStateChange}
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white"
          >
            <option value="">Select a state</option>
            {nigerianStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {requiresPayment && productPrice && (
            <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
              <CreditCard className="h-4 w-4" />
              Confirmation fee of ₦{Math.round(productPrice * 0.05).toLocaleString()} (5%) required for this location
            </p>
          )}
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full px-6 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg"
        >
          {isSubmitting 
            ? (requiresPayment ? "Redirecting to Payment..." : "Submitting...") 
            : (requiresPayment ? `Pay ₦${productPrice ? Math.round(productPrice * 0.05).toLocaleString() : 0} & Place Order` : "Place Order")}
          <Send className="h-5 w-5" />
        </button>
      </form>
      {isSubmitted && (
        <div className="mt-4 flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg">
          <CheckCircle className="h-5 w-5" />
          <span>Thank you! We have received your request and will contact you shortly.</span>
        </div>
      )}
    </div>
  );
}

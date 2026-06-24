export const CHECKOUT_BLOCKED_CODE = "CHECKOUT_BLOCKED";

export const CHECKOUT_BLOCKED_BUYER_MESSAGE =
  "This seller cannot accept new orders at the moment. Please contact the store or try again later.";

type CheckoutErrorPayload = {
  error?: string;
  code?: string;
  buyerMessage?: string;
  details?: string;
};

/** Map API / SDK errors to buyer-safe copy for the storefront form. */
export function resolveStorefrontCheckoutError(payload: CheckoutErrorPayload | null): string {
  if (!payload) {
    return "We could not start checkout. Please try again.";
  }
  if (payload.code === CHECKOUT_BLOCKED_CODE) {
    return payload.buyerMessage || CHECKOUT_BLOCKED_BUYER_MESSAGE;
  }
  if (typeof payload.error === "string" && payload.error.trim()) {
    return payload.error;
  }
  if (typeof payload.details === "string" && payload.details.trim()) {
    return payload.details;
  }
  return "We could not start checkout. Please try again.";
}

type HoldamApiError = {
  response?: {
    status?: number;
    data?: {
      error?: string;
      code?: string;
      reason?: string;
    };
  };
  message?: string;
};

export function mapHoldamDealCreateError(error: unknown): {
  status: number;
  body: Record<string, string>;
} {
  const axiosError = error as HoldamApiError;
  const status = axiosError?.response?.status ?? 500;
  const data = axiosError?.response?.data;

  if (data?.code === CHECKOUT_BLOCKED_CODE) {
    return {
      status: 403,
      body: {
        error: data.error || "Checkout unavailable for this seller.",
        code: CHECKOUT_BLOCKED_CODE,
        buyerMessage: CHECKOUT_BLOCKED_BUYER_MESSAGE,
      },
    };
  }

  const message =
    data?.error ||
    (error instanceof Error ? error.message : undefined) ||
    "Failed to create checkout";

  return {
    status: status >= 400 && status < 600 ? status : 500,
    body: {
      error: message,
      details: data?.reason || message,
    },
  };
}

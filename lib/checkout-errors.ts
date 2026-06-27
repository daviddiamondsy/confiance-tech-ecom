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

type HoldamApiErrorBody = {
  error?: string;
  code?: string;
  reason?: string;
};

type HoldamApiError = Error & {
  status?: number;
  code?: string;
  raw?: HoldamApiErrorBody;
  response?: {
    status?: number;
    data?: HoldamApiErrorBody;
  };
};

function extractHoldamErrorPayload(error: unknown): {
  status: number;
  data: HoldamApiErrorBody | undefined;
  code: string | undefined;
  message: string | undefined;
} {
  const err = error as HoldamApiError;

  if (err?.raw && typeof err.raw === "object") {
    return {
      status: err.status ?? 500,
      data: err.raw,
      code: err.raw.code ?? err.code,
      message:
        typeof err.raw.error === "string"
          ? err.raw.error
          : err.message,
    };
  }

  const data = err?.response?.data;
  const status = err?.response?.status ?? err?.status ?? 500;

  return {
    status,
    data,
    code: data?.code ?? err?.code,
    message:
      data?.error ||
      (error instanceof Error ? error.message : undefined),
  };
}

export function mapHoldamDealCreateError(error: unknown): {
  status: number;
  body: Record<string, string>;
} {
  const { status, data, code, message } = extractHoldamErrorPayload(error);

  if (code === CHECKOUT_BLOCKED_CODE) {
    return {
      status: 403,
      body: {
        error: message || "Checkout unavailable for this seller.",
        code: CHECKOUT_BLOCKED_CODE,
        buyerMessage: CHECKOUT_BLOCKED_BUYER_MESSAGE,
      },
    };
  }

  const fallbackMessage = message || "Failed to create checkout";

  return {
    status: status >= 400 && status < 600 ? status : 500,
    body: {
      error: fallbackMessage,
      details: data?.reason || fallbackMessage,
    },
  };
}

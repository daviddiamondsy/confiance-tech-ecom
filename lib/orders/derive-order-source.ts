import type { NextRequest } from "next/server";
import type { OrderSource } from "@/lib/orders/types";

/** Resolve checkout channel for store_orders.source. */
export function deriveOrderSource(params: {
  bodySource?: unknown;
  botStoreApiKey?: string | null;
  requestBotKey?: string | null;
}): Extract<OrderSource, "website" | "chatbot"> {
  const configuredKey = params.botStoreApiKey?.trim();
  const requestKey = params.requestBotKey?.trim();

  if (configuredKey) {
    return configuredKey === requestKey ? "chatbot" : "website";
  }

  if (params.bodySource === "chatbot") {
    return "chatbot";
  }

  return "website";
}

export function readBotStoreKeyFromRequest(req: NextRequest): string | null {
  const header =
    req.headers.get("x-confiance-bot-key") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  return header || null;
}

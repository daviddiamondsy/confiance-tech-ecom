import { NextRequest, NextResponse } from "next/server";
import Holdam from "@holdam/ts";
import { isPostgresConfigured } from "@/lib/db/client";
import { processReferralWebhook } from "@/lib/referral/service";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.HOLDAM_API_KEY;
    const webhookSecret = process.env.HOLDAM_WEBHOOK_SECRET;

    if (!apiKey || !webhookSecret) {
      console.error("[Webhook][holdam] Missing HOLDAM_API_KEY or HOLDAM_WEBHOOK_SECRET");
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const rawBody = await req.text();
    const signature = req.headers.get("x-holdam-signature") ?? "";

    const holdam = new Holdam(apiKey, {
      baseUrl: process.env.HOLDAM_BASE_URL || "https://escrow-backend-production-e42c.up.railway.app/v1",
    });

    const isValid = holdam.webhooks.verifySignature(rawBody, signature, webhookSecret);
    if (!isValid) {
      console.error("[Webhook][holdam] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(rawBody);
    const { id: dealId, metadata, status, amount } = event.data ?? {};

    console.log("[Webhook][holdam] Event received", {
      event: event.event,
      dealId,
      status,
      amount,
      metadata,
    });

    switch (event.event) {
      case "deal.funded":
        console.log("[Webhook][holdam] Deal funded; payment secured", { dealId, metadata });
        break;

      case "deal.released":
        console.log("[Webhook][holdam] Deal released; funds sent to seller", { dealId, metadata });
        break;

      case "deal.disputed":
        console.log("[Webhook][holdam] Deal disputed", { dealId, metadata });
        break;

      case "deal.cancelled":
        console.log("[Webhook][holdam] Deal cancelled", { dealId, metadata });
        break;

      case "deal.refunded":
        console.log("[Webhook][holdam] Deal refunded", { dealId, metadata });
        break;

      default:
        console.log("[Webhook][holdam] Unknown event", { event: event.event });
    }

    if (isPostgresConfigured() && dealId && event.event) {
      void processReferralWebhook({
        eventName: event.event,
        dealId: String(dealId),
        metadata: metadata ?? null,
      }).catch((referralError) => {
        console.error("[Webhook][holdam] Referral processing failed", { dealId, referralError });
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("[Webhook][holdam] Error processing webhook", { error, details });
    return NextResponse.json({ error: "Webhook processing failed", details }, { status: 500 });
  }
}

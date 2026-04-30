import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sendOrderEmail } from "@/lib/order-email";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

function getStripe(): Stripe {
  if (!stripeSecretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: "2026-03-25.dahlia",
  });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        { error: "Payment has not been completed" },
        { status: 400 }
      );
    }

    await sendOrderEmail({
      productId: session.metadata?.productId,
      productName: session.metadata?.productName,
      productPrice: undefined,
      customerName: session.metadata?.customerName || "",
      customerPhone: session.metadata?.customerPhone || "",
      customerAddress: session.metadata?.customerAddress || "",
      customerState: session.metadata?.customerState || "",
      paymentStatus: "paid",
      confirmationFee: session.metadata?.confirmationFee
        ? Number(session.metadata.confirmationFee)
        : undefined,
      stripeSessionId: session.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Paid order confirmation error:", error);
    return NextResponse.json(
      { error: "Failed to confirm paid order" },
      { status: 500 }
    );
  }
}

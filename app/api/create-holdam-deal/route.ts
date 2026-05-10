import { NextRequest, NextResponse } from "next/server";
import Holdam from "@holdam/js";
import { sendOrderEmail } from "@/lib/order-email";

export async function POST(req: NextRequest) {
  try {
    const {
      productId,
      productName,
      productPrice,
      customerData,
    } = await req.json();

    console.log("[API][create-holdam-deal] Received request", {
      productId,
      productName,
      productPrice,
      hasCustomerData: Boolean(customerData),
    });

    if (
      !customerData?.name ||
      !customerData?.phone ||
      !customerData?.address ||
      !customerData?.state
    ) {
      console.error("[API][create-holdam-deal] Missing required customer details", { customerData });
      return NextResponse.json(
        { error: "Missing required customer details" },
        { status: 400 }
      );
    }

    const apiKey = process.env.HOLDAM_API_KEY;
    if (!apiKey) {
      console.error("[API][create-holdam-deal] Missing HOLDAM_API_KEY");
      return NextResponse.json(
        { error: "Payment service not configured", details: "Missing HOLDAM_API_KEY" },
        { status: 500 }
      );
    }

    const holdam = new Holdam(apiKey, {
      baseUrl: process.env.HOLDAM_BASE_URL || "https://api.holdam.ng/v1",
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://confiance.tech";

    const deal = await holdam.deals.create({
      amount: productPrice,
      currency: "NGN",
      seller: process.env.HOLDAM_SELLER_PHONE || customerData.phone,
      successUrl: `${baseUrl}/payment-success?deal_id={DEAL_ID}`,
      cancelUrl: `${baseUrl}/products/${productId}`,
      description: `${productName} — Order for ${customerData.name}`,
      metadata: {
        productId,
        productName,
        productPrice,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerAddress: customerData.address,
        customerState: customerData.state,
      },
    });

    console.log("[API][create-holdam-deal] Deal created", {
      dealId: deal.data?.id,
      checkoutUrl: deal.data?.checkoutUrl,
    });

    await sendOrderEmail({
      productId,
      productName,
      productPrice,
      customerName: customerData.name,
      customerPhone: customerData.phone,
      customerAddress: customerData.address,
      customerState: customerData.state,
      paymentStatus: "pending",
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: deal.data.checkoutUrl,
      dealId: deal.data.id,
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";
    console.error("[API][create-holdam-deal] Error", { error, details });
    return NextResponse.json(
      { error: "Failed to create checkout", details },
      { status: 500 }
    );
  }
}

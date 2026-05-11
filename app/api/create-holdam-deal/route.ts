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

    const sellerId = process.env.HOLDAM_SELLER_PHONE || customerData.phone;
    console.log("[API][create-holdam-deal] Holdam SDK params:", {
      totalAmount: 30000,
      currency: "NGN",
      sellerId,
      sellerIdFromEnv: process.env.HOLDAM_SELLER_PHONE,
      customerPhone: customerData.phone,
    });

    const deal = await holdam.deals.create({
      amount: 30000, // Hardcoded: Tier 1 limit is ₦50,000
      currency: "NGN",
      seller: sellerId,
      title: `${productName} — Order for ${customerData.name}`,
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
    } as any) as unknown as { id: string };

    console.log("[API][create-holdam-deal] Deal response:", JSON.stringify(deal, null, 2));
    console.log("[API][create-holdam-deal] Deal keys:", Object.keys(deal));

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

    // Holdam returns deal wrapped in .data
    const dealData = (deal as any)?.data || deal;
    const checkoutUrl = dealData?.checkoutUrl;

    console.log("[API][create-holdam-deal] Returning response:", { dealId: dealData?.id, checkoutUrl });

    return NextResponse.json({
      success: true,
      dealId: dealData?.id,
      deal: dealData,
      checkoutUrl,
    });
  } catch (error) {
    console.error("[API][create-holdam-deal] Raw error:", error);
    console.error("[API][create-holdam-deal] Error keys:", Object.keys(error || {}));
    console.error("[API][create-holdam-deal] Error constructor:", error?.constructor?.name);

    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    const details = axiosError?.response?.data
      ? JSON.stringify(axiosError.response.data)
      : error instanceof Error
      ? error.message
      : "Unknown error";
    const status = axiosError?.response?.status;

    console.error("[API][create-holdam-deal] Error", {
      message: axiosError?.message,
      holdam_status: status,
      holdam_response: axiosError?.response?.data,
      details,
    });

    return NextResponse.json(
      { error: "Failed to create checkout", details },
      { status: 500 }
    );
  }
}

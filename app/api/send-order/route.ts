import { NextRequest, NextResponse } from "next/server";
import { sendOrderEmail } from "@/lib/order-email";

export async function POST(req: NextRequest) {
  try {
    const {
      productId,
      productName,
      productPrice,
      customerData,
    } = await req.json();

    console.log("[API][send-order] Received order request", {
      productId,
      productName,
      productPrice,
      hasCustomerData: Boolean(customerData),
      customerData,
    });

    if (
      !customerData?.name ||
      !customerData?.phone ||
      !customerData?.address ||
      !customerData?.state
    ) {
      console.error("[API][send-order] Missing required customer details", {
        customerData,
      });

      return NextResponse.json(
        { error: "Missing required customer details" },
        { status: 400 }
      );
    }

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

    console.log("[API][send-order] Order email sent successfully", {
      productId,
      productName,
      customerName: customerData.name,
      customerPhone: customerData.phone,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : "Unknown error";

    console.error("[API][send-order] Order email error", {
      error,
      details,
    });

    return NextResponse.json(
      { error: "Failed to send order", details },
      { status: 500 }
    );
  }
}

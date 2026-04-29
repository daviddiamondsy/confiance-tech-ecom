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

    if (
      !customerData?.name ||
      !customerData?.phone ||
      !customerData?.address ||
      !customerData?.state
    ) {
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Order email error:", error);
    return NextResponse.json(
      { error: "Failed to send order" },
      { status: 500 }
    );
  }
}

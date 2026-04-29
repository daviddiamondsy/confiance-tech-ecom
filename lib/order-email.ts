export interface OrderEmailPayload {
  productId?: string;
  productName?: string;
  productPrice?: number;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerState: string;
  paymentStatus: "pending" | "paid";
  confirmationFee?: number;
  stripeSessionId?: string;
}

const formatCurrency = (amount?: number) => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "N/A";
  }

  return `₦${amount.toLocaleString()}`;
};

const buildEmailHtml = (payload: OrderEmailPayload) => {
  const rows = [
    ["Product", payload.productName || "N/A"],
    ["Product ID", payload.productId || "N/A"],
    ["Product Price", formatCurrency(payload.productPrice)],
    ["Customer Name", payload.customerName],
    ["Phone", payload.customerPhone],
    ["Address", payload.customerAddress],
    ["State", payload.customerState],
    ["Payment Status", payload.paymentStatus === "paid" ? "Paid confirmation fee" : "No confirmation fee required"],
    ["Confirmation Fee", formatCurrency(payload.confirmationFee)],
    ["Stripe Session", payload.stripeSessionId || "N/A"],
  ];

  const rowsHtml = rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:12px;border:1px solid #e5e7eb;font-weight:600;background:#f9fafb;">${label}</td>
          <td style="padding:12px;border:1px solid #e5e7eb;">${value}</td>
        </tr>`
    )
    .join("");

  return `
    <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;color:#111827;">
      <h2 style="margin:0 0 16px;">New Order Request</h2>
      <p style="margin:0 0 24px;">A customer submitted a new order on the website.</p>
      <table style="width:100%;border-collapse:collapse;">${rowsHtml}</table>
    </div>`;
};

const buildEmailText = (payload: OrderEmailPayload) => {
  return [
    "New Order Request",
    "",
    `Product: ${payload.productName || "N/A"}`,
    `Product ID: ${payload.productId || "N/A"}`,
    `Product Price: ${formatCurrency(payload.productPrice)}`,
    `Customer Name: ${payload.customerName}`,
    `Phone: ${payload.customerPhone}`,
    `Address: ${payload.customerAddress}`,
    `State: ${payload.customerState}`,
    `Payment Status: ${payload.paymentStatus === "paid" ? "Paid confirmation fee" : "No confirmation fee required"}`,
    `Confirmation Fee: ${formatCurrency(payload.confirmationFee)}`,
    `Stripe Session: ${payload.stripeSessionId || "N/A"}`,
  ].join("\n");
};

export async function sendOrderEmail(payload: OrderEmailPayload) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const notificationEmail = process.env.ORDER_NOTIFICATION_EMAIL;
  const fromEmail = process.env.ORDER_FROM_EMAIL || "onboarding@resend.dev";

  if (!resendApiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!notificationEmail) {
    throw new Error("Missing ORDER_NOTIFICATION_EMAIL environment variable.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [notificationEmail],
      subject: `New Order${payload.productName ? ` - ${payload.productName}` : ""}`,
      html: buildEmailHtml(payload),
      text: buildEmailText(payload),
      reply_to: notificationEmail,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Resend request failed: ${response.status} ${errorText}`);
  }

  return response.json();
}

export interface OrderEmailReferralDetails {
  referralCode?: string;
  referrerName?: string | null;
  catalogPriceNgn?: number;
  checkoutAmountNgn?: number;
  refereeDiscountNgn?: number;
  storeCreditAppliedNgn?: number;
}

export interface OrderEmailPayload {
  productId?: string;
  productName?: string;
  productPrice?: number;
  productStorage?: string;
  productColor?: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerState: string;
  paymentStatus: "pending" | "paid";
  confirmationFee?: number;
  stripeSessionId?: string;
  referral?: OrderEmailReferralDetails;
}

const formatCurrency = (amount?: number) => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "N/A";
  }

  return `₦${amount.toLocaleString()}`;
};

function buildReferralRows(referral?: OrderEmailReferralDetails): [string, string][] {
  if (!referral) return [];

  const rows: [string, string][] = [];

  if (referral.referralCode) {
    rows.push(["Referral code", referral.referralCode]);
  }
  if (referral.referrerName) {
    rows.push(["Referrer", referral.referrerName]);
  }
  if (typeof referral.refereeDiscountNgn === "number" && referral.refereeDiscountNgn > 0) {
    rows.push(["Referral discount", formatCurrency(referral.refereeDiscountNgn)]);
  }
  if (typeof referral.storeCreditAppliedNgn === "number" && referral.storeCreditAppliedNgn > 0) {
    rows.push(["Store credit applied", formatCurrency(referral.storeCreditAppliedNgn)]);
  }
  if (
    typeof referral.catalogPriceNgn === "number" &&
    typeof referral.checkoutAmountNgn === "number" &&
    referral.catalogPriceNgn !== referral.checkoutAmountNgn
  ) {
    rows.push(["Catalog price", formatCurrency(referral.catalogPriceNgn)]);
    rows.push(["Checkout amount", formatCurrency(referral.checkoutAmountNgn)]);
  }

  return rows;
}

const buildEmailHtml = (payload: OrderEmailPayload) => {
  const rows: [string, string][] = [
    ["Product", payload.productName || "N/A"],
    ["Product ID", payload.productId || "N/A"],
    ["Size", payload.productStorage || "N/A"],
    ["Color", payload.productColor || "N/A"],
    ["Product Price", formatCurrency(payload.productPrice)],
    ...buildReferralRows(payload.referral),
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
  const referralLines = buildReferralRows(payload.referral).map(
    ([label, value]) => `${label}: ${value}`
  );

  return [
    "New Order Request",
    "",
    `Product: ${payload.productName || "N/A"}`,
    `Product ID: ${payload.productId || "N/A"}`,
    `Size: ${payload.productStorage || "N/A"}`,
    `Color: ${payload.productColor || "N/A"}`,
    `Product Price: ${formatCurrency(payload.productPrice)}`,
    ...referralLines,
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

  console.log("[Email][sendOrderEmail] Preparing order email", {
    productId: payload.productId,
    productName: payload.productName,
    paymentStatus: payload.paymentStatus,
    customerName: payload.customerName,
    referralCode: payload.referral?.referralCode,
    hasResendApiKey: Boolean(resendApiKey),
    notificationEmail,
    fromEmail,
  });

  if (!resendApiKey) {
    console.error("[Email][sendOrderEmail] Missing RESEND_API_KEY environment variable");
    throw new Error("Missing RESEND_API_KEY environment variable.");
  }

  if (!notificationEmail) {
    console.error("[Email][sendOrderEmail] Missing ORDER_NOTIFICATION_EMAIL environment variable");
    throw new Error("Missing ORDER_NOTIFICATION_EMAIL environment variable.");
  }

  console.log("[Email][sendOrderEmail] Sending request to Resend", {
    to: notificationEmail,
    from: fromEmail,
    subject: `New Order${payload.productName ? ` - ${payload.productName}` : ""}`,
  });

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
    console.error("[Email][sendOrderEmail] Resend request failed", {
      status: response.status,
      errorText,
    });
    throw new Error(`Resend request failed: ${response.status} ${errorText}`);
  }

  console.log("[Email][sendOrderEmail] Resend request succeeded");

  return response.json();
}

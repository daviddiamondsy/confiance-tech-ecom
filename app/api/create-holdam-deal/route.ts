import { NextRequest, NextResponse } from "next/server";
import Holdam from "@holdam/ts";
import { sendOrderEmail } from "@/lib/order-email";
import { mapHoldamDealCreateError } from "@/lib/checkout-errors";
import { resolveDeliveryDays } from "@/lib/delivery-deadline";
import { resolveCheckoutPrice } from "@/lib/resolve-checkout-price";
import { isPostgresConfigured } from "@/lib/db/client";
import { computeCheckoutAmount, recordReferralOnDealCreated } from "@/lib/referral/service";
import { getStoreCreditBalance, getReferralCodeByCode } from "@/lib/db/referral-repository";
import { ensureReferralReady } from "@/lib/referral/db-ready";
import { recordDirectOrder, recordHoldamOrder } from "@/lib/orders/service";
import {
  deriveOrderSource,
  readBotStoreKeyFromRequest,
} from "@/lib/orders/derive-order-source";
import { isHoldamBypassEnabled } from "@/lib/holdam/config";
import type { OrderEmailReferralDetails } from "@/lib/order-email";

async function buildReferralEmailDetails(params: {
  referralAdjustment:
    | Awaited<ReturnType<typeof computeCheckoutAmount>>["adjustment"]
    | undefined;
  amountNgn: number;
  checkoutAmountNgn: number;
}): Promise<OrderEmailReferralDetails | undefined> {
  const { referralAdjustment, amountNgn, checkoutAmountNgn } = params;
  if (
    !referralAdjustment ||
    !(
      referralAdjustment.referralCode ||
      referralAdjustment.refereeDiscountNgn > 0 ||
      referralAdjustment.storeCreditAppliedNgn > 0 ||
      checkoutAmountNgn !== amountNgn
    )
  ) {
    return undefined;
  }

  let referrerName: string | null | undefined;
  if (referralAdjustment.referralCode && isPostgresConfigured()) {
    const codeRow = await getReferralCodeByCode(referralAdjustment.referralCode);
    referrerName = codeRow?.referrer_name;
  }

  return {
    referralCode: referralAdjustment.referralCode,
    referrerName,
    catalogPriceNgn: amountNgn,
    checkoutAmountNgn,
    refereeDiscountNgn: referralAdjustment.refereeDiscountNgn,
    storeCreditAppliedNgn: referralAdjustment.storeCreditAppliedNgn,
  };
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    const {
      source,
      productId,
      productSlug,
      productName,
      productPrice,
      productStorage,
      productColor,
      customerData,
      referralCode,
      applyStoreCredit,
    } = await req.json();

    const orderSource = deriveOrderSource({
      bodySource: source,
      botStoreApiKey: process.env.BOT_STORE_API_KEY,
      requestBotKey: readBotStoreKeyFromRequest(req),
    });

    const holdamBypass = isHoldamBypassEnabled();

    console.log("[API][create-holdam-deal] ===== START =====");
    console.log("[API][create-holdam-deal] Received request", {
      productId,
      productName,
      productPrice,
      orderSource,
      holdamBypass,
      hasCustomerData: Boolean(customerData),
      timestamp: new Date().toISOString(),
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

    const catalogPrice = await resolveCheckoutPrice({
      productId: productId ? String(productId) : undefined,
      productSlug: productSlug ? String(productSlug) : undefined,
      storage: productStorage ? String(productStorage) : undefined,
    });

    if (!catalogPrice) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const amountNgn = catalogPrice.price;
    const resolvedProductName = productName ? String(productName) : catalogPrice.productName;
    const resolvedProductId = catalogPrice.productId;
    const resolvedProductSlug = catalogPrice.productSlug;
    const orderStorage = productStorage ? String(productStorage).trim() : undefined;
    const orderColor = productColor ? String(productColor).trim() : undefined;

    let checkoutAmountNgn = amountNgn;
    let referralAdjustment:
      | Awaited<ReturnType<typeof computeCheckoutAmount>>["adjustment"]
      | undefined;
    let storeCreditBalanceNgn = 0;

    if (isPostgresConfigured()) {
      await ensureReferralReady();

      if (applyStoreCredit) {
        storeCreditBalanceNgn = await getStoreCreditBalance(customerData.phone);
      }

      const pricing = await computeCheckoutAmount({
        catalogPriceNgn: amountNgn,
        buyerPhone: customerData.phone,
        referralCode: referralCode ? String(referralCode) : undefined,
        applyStoreCredit: Boolean(applyStoreCredit),
      });

      if (pricing.error) {
        return NextResponse.json({ error: pricing.error }, { status: 400 });
      }

      checkoutAmountNgn = pricing.adjustment.finalAmountNgn;
      referralAdjustment = pricing.adjustment;
    }

    const clientPrice = Number(productPrice);
    if (
      Number.isFinite(clientPrice) &&
      clientPrice > 0 &&
      clientPrice !== amountNgn
    ) {
      console.warn("[API][create-holdam-deal] Client price differed from catalog; using DB price", {
        clientPrice,
        catalogPrice: amountNgn,
        productId: resolvedProductId,
        productSlug: resolvedProductSlug,
      });
    }

    const referralEmailDetails = await buildReferralEmailDetails({
      referralAdjustment,
      amountNgn,
      checkoutAmountNgn,
    });

    if (holdamBypass) {
      console.log("[API][create-holdam-deal] Holdam bypass enabled; recording order only");

      let orderId: number | undefined;

      if (isPostgresConfigured()) {
        try {
          const row = await recordDirectOrder({
            source: orderSource,
            productId: resolvedProductId,
            productName: resolvedProductName,
            catalogPriceNgn: amountNgn,
            checkoutAmountNgn,
            productStorage: orderStorage,
            productColor: orderColor,
            customerName: customerData.name,
            customerPhone: customerData.phone,
            customerAddress: customerData.address,
            customerState: customerData.state,
            referralCode: referralAdjustment?.referralCode,
            refereeDiscountNgn: referralAdjustment?.refereeDiscountNgn,
            storeCreditAppliedNgn: referralAdjustment?.storeCreditAppliedNgn,
          });
          orderId = row.id;
        } catch (orderError) {
          console.error("[API][create-holdam-deal] Direct order record failed", orderError);
          return NextResponse.json(
            { error: "Could not save order. Please try again." },
            { status: 500 }
          );
        }
      }

      try {
        await sendOrderEmail({
          productId: resolvedProductId,
          productName: resolvedProductName,
          productPrice: amountNgn,
          productStorage: orderStorage,
          productColor: orderColor,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          customerState: customerData.state,
          paymentStatus: "pending",
          referral: referralEmailDetails,
        });
        console.log("[API][create-holdam-deal] Order email sent (Holdam bypass)", {
          orderId,
          durationMs: Date.now() - startTime,
        });
      } catch (emailError) {
        console.error("[API][create-holdam-deal] Order email failed (Holdam bypass)", {
          orderId,
          emailError,
        });
      }

      console.log("[API][create-holdam-deal] ===== SUCCESS (HOLDAM BYPASS) =====");

      return NextResponse.json({
        success: true,
        holdamBypass: true,
        orderId,
        pricing: referralAdjustment
          ? {
              catalogPriceNgn: amountNgn,
              checkoutAmountNgn,
              refereeDiscountNgn: referralAdjustment.refereeDiscountNgn,
              storeCreditAppliedNgn: referralAdjustment.storeCreditAppliedNgn,
              storeCreditBalanceNgn,
            }
          : undefined,
      });
    }

    const apiKey = process.env.HOLDAM_API_KEY;
    const baseUrl = process.env.HOLDAM_BASE_URL || "https://escrow-backend-production-e42c.up.railway.app/v1";

    console.log("[API][create-holdam-deal] Configuration check", {
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey ? `${apiKey.substring(0, 8)}...` : "none",
      baseUrl,
    });

    if (!apiKey) {
      console.error("[API][create-holdam-deal] Missing HOLDAM_API_KEY");
      return NextResponse.json(
        { error: "Payment service not configured", details: "Missing HOLDAM_API_KEY" },
        { status: 500 }
      );
    }

    const holdam = new Holdam(apiKey, {
      baseUrl,
    });

    const siteBaseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://confiance.tech";

    console.log("[API][create-holdam-deal] Holdam SDK params:", {
      totalAmount: checkoutAmountNgn,
      currency: "NGN",
      buyerPhone: customerData.phone,
    });

    const nameParts = customerData.name.trim().split(" ");
    const buyerFirstName = nameParts[0] || customerData.name;
    const buyerLastName = nameParts.slice(1).join(" ") || "";

    const deliverWithinDays = resolveDeliveryDays(undefined);
    const businessName =
      process.env.HOLDAM_BUSINESS_NAME?.trim() || "Confiance Tech";

    const cancelProductPath = resolvedProductSlug || resolvedProductId;

    const dealRequest = {
      amount: checkoutAmountNgn,
      currency: "NGN",
      buyerFirstName,
      buyerLastName,
      title: `${resolvedProductName}, Order for ${customerData.name}`,
      deliveryDays: deliverWithinDays,
      successUrl: `${siteBaseUrl}/payment-success?deal_id={DEAL_ID}`,
      cancelUrl: `${siteBaseUrl}/products/${cancelProductPath}`,
      metadata: {
        productId: resolvedProductId,
        productName: resolvedProductName,
        productPrice: amountNgn,
        catalogPriceNgn: amountNgn,
        checkoutAmountNgn,
        productStorage: orderStorage,
        productColor: orderColor,
        deliveryDays: deliverWithinDays,
        businessName,
        customerAddress: customerData.address,
        customerState: customerData.state,
        buyerPhone: customerData.phone,
        referralCode: referralAdjustment?.referralCode,
        refereeDiscountNgn: referralAdjustment?.refereeDiscountNgn ?? 0,
        storeCreditAppliedNgn: referralAdjustment?.storeCreditAppliedNgn ?? 0,
        referrerCreditNgn: referralAdjustment?.referrerCreditNgn ?? 0,
      },
    };

    console.log(
      "[API][create-holdam-deal] Calling Holdam SDK with request:",
      JSON.stringify(dealRequest, null, 2)
    );
    const sdkCallStart = Date.now();

    const deal = await holdam.deals.create(dealRequest);

    if (isPostgresConfigured()) {
      try {
        await recordHoldamOrder({
          dealId: deal.data.id,
          source: orderSource,
          productId: resolvedProductId,
          productName: resolvedProductName,
          catalogPriceNgn: amountNgn,
          checkoutAmountNgn,
          productStorage: orderStorage,
          productColor: orderColor,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerAddress: customerData.address,
          customerState: customerData.state,
          referralCode: referralAdjustment?.referralCode,
          refereeDiscountNgn: referralAdjustment?.refereeDiscountNgn,
          storeCreditAppliedNgn: referralAdjustment?.storeCreditAppliedNgn,
        });
      } catch (orderError) {
        console.error("[API][create-holdam-deal] Store order record failed", orderError);
      }
    }

    if (isPostgresConfigured() && referralAdjustment) {
      try {
        await recordReferralOnDealCreated({
          dealId: deal.data.id,
          adjustment: referralAdjustment,
          catalogPriceNgn: amountNgn,
          buyerPhone: customerData.phone,
        });
      } catch (referralError) {
        console.error("[API][create-holdam-deal] Referral record failed", referralError);
      }
    }

    const sdkCallDuration = Date.now() - sdkCallStart;
    console.log("[API][create-holdam-deal] Holdam SDK call completed", {
      duration: `${sdkCallDuration}ms`,
    });

    try {
      await sendOrderEmail({
        productId: resolvedProductId,
        productName: resolvedProductName,
        productPrice: amountNgn,
        productStorage: orderStorage,
        productColor: orderColor,
        customerName: customerData.name,
        customerPhone: customerData.phone,
        customerAddress: customerData.address,
        customerState: customerData.state,
        paymentStatus: "pending",
        dealId: deal.data.id,
        referral: referralEmailDetails,
      });
      console.log("[API][create-holdam-deal] Order email sent", {
        dealId: deal.data.id,
        durationMs: Date.now() - startTime,
      });
    } catch (emailError) {
      console.error("[API][create-holdam-deal] Order email failed (deal still created)", {
        dealId: deal.data.id,
        emailError,
      });
    }

    const dealData = deal.data;
    const checkoutUrl = dealData.checkoutUrl;

    console.log("[API][create-holdam-deal] Returning response:", {
      dealId: dealData.id,
      checkoutUrl,
      totalDuration: `${Date.now() - startTime}ms`,
    });
    console.log("[API][create-holdam-deal] ===== SUCCESS =====");

    return NextResponse.json({
      success: true,
      holdamBypass: false,
      dealId: dealData.id,
      deal: dealData,
      checkoutUrl,
      pricing: referralAdjustment
        ? {
            catalogPriceNgn: amountNgn,
            checkoutAmountNgn,
            refereeDiscountNgn: referralAdjustment.refereeDiscountNgn,
            storeCreditAppliedNgn: referralAdjustment.storeCreditAppliedNgn,
            storeCreditBalanceNgn,
          }
        : undefined,
    });
  } catch (error) {
    const errorDuration = Date.now() - startTime;
    console.error("[API][create-holdam-deal] ===== ERROR =====");
    console.error("[API][create-holdam-deal] Error occurred after:", `${errorDuration}ms`);
    console.error("[API][create-holdam-deal] Raw error:", error);

    const mapped = mapHoldamDealCreateError(error);
    console.error("[API][create-holdam-deal] Mapped error", mapped);
    console.error("[API][create-holdam-deal] ===== END ERROR =====");

    return NextResponse.json(mapped.body, { status: mapped.status });
  }
}

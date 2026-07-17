import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  fetchPricingConfig,
  recalculateAllPrices,
  updatePricingConfig,
} from "@/lib/db/pricing-config-repository";

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await fetchPricingConfig();
  return NextResponse.json(config);
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const yuanToNaira = Number(body.yuanToNaira);
  const gbpToNaira = Number(body.gbpToNaira);
  const usdToNaira = Number(body.usdToNaira);
  const sellingMarkup = Number(body.sellingMarkup);
  const expensiveYuanThresholdRaw = body.expensiveYuanThreshold;
  const expensiveWholesaleNgnThresholdRaw = body.expensiveWholesaleNgnThreshold;
  const expensiveSellingMarkupRaw = body.expensiveSellingMarkup;
  const cheapYuanThresholdRaw = body.cheapYuanThreshold;
  const cheapWholesaleNgnThresholdRaw = body.cheapWholesaleNgnThreshold;
  const cheapSellingMarkupRaw = body.cheapSellingMarkup;

  const expensiveYuanThreshold =
    expensiveYuanThresholdRaw === "" || expensiveYuanThresholdRaw == null
      ? null
      : Number(expensiveYuanThresholdRaw);
  const expensiveWholesaleNgnThreshold =
    expensiveWholesaleNgnThresholdRaw === "" || expensiveWholesaleNgnThresholdRaw == null
      ? null
      : Number(expensiveWholesaleNgnThresholdRaw);
  const expensiveSellingMarkup =
    expensiveSellingMarkupRaw === "" || expensiveSellingMarkupRaw == null
      ? null
      : Number(expensiveSellingMarkupRaw);
  const cheapYuanThreshold =
    cheapYuanThresholdRaw === "" || cheapYuanThresholdRaw == null
      ? null
      : Number(cheapYuanThresholdRaw);
  const cheapWholesaleNgnThreshold =
    cheapWholesaleNgnThresholdRaw === "" || cheapWholesaleNgnThresholdRaw == null
      ? null
      : Number(cheapWholesaleNgnThresholdRaw);
  const cheapSellingMarkup =
    cheapSellingMarkupRaw === "" || cheapSellingMarkupRaw == null
      ? null
      : Number(cheapSellingMarkupRaw);

  if (
    !Number.isFinite(yuanToNaira) ||
    yuanToNaira <= 0 ||
    !Number.isFinite(gbpToNaira) ||
    gbpToNaira <= 0 ||
    !Number.isFinite(usdToNaira) ||
    usdToNaira <= 0 ||
    !Number.isFinite(sellingMarkup) ||
    sellingMarkup <= 0
  ) {
    return NextResponse.json({ error: "Invalid pricing values" }, { status: 400 });
  }

  if (
    expensiveYuanThreshold != null &&
    (!Number.isFinite(expensiveYuanThreshold) || expensiveYuanThreshold <= 0)
  ) {
    return NextResponse.json({ error: "Invalid expensive yuan threshold" }, { status: 400 });
  }

  if (
    expensiveWholesaleNgnThreshold != null &&
    (!Number.isFinite(expensiveWholesaleNgnThreshold) || expensiveWholesaleNgnThreshold <= 0)
  ) {
    return NextResponse.json(
      { error: "Invalid expensive wholesale NGN threshold" },
      { status: 400 }
    );
  }

  if (
    expensiveSellingMarkup != null &&
    (!Number.isFinite(expensiveSellingMarkup) || expensiveSellingMarkup <= 0)
  ) {
    return NextResponse.json({ error: "Invalid expensive markup multiplier" }, { status: 400 });
  }

  if (expensiveYuanThreshold != null && expensiveSellingMarkup == null) {
    return NextResponse.json(
      { error: "Expensive markup multiplier is required when yuan threshold is set" },
      { status: 400 }
    );
  }

  if (expensiveWholesaleNgnThreshold != null && expensiveSellingMarkup == null) {
    return NextResponse.json(
      { error: "Expensive markup multiplier is required when wholesale threshold is set" },
      { status: 400 }
    );
  }

  if (
    cheapYuanThreshold != null &&
    (!Number.isFinite(cheapYuanThreshold) || cheapYuanThreshold <= 0)
  ) {
    return NextResponse.json({ error: "Invalid cheap yuan threshold" }, { status: 400 });
  }

  if (
    cheapWholesaleNgnThreshold != null &&
    (!Number.isFinite(cheapWholesaleNgnThreshold) || cheapWholesaleNgnThreshold <= 0)
  ) {
    return NextResponse.json(
      { error: "Invalid cheap wholesale NGN threshold" },
      { status: 400 }
    );
  }

  if (
    cheapSellingMarkup != null &&
    (!Number.isFinite(cheapSellingMarkup) || cheapSellingMarkup <= 0)
  ) {
    return NextResponse.json({ error: "Invalid cheap markup multiplier" }, { status: 400 });
  }

  if (cheapYuanThreshold != null && cheapSellingMarkup == null) {
    return NextResponse.json(
      { error: "Cheap markup multiplier is required when yuan threshold is set" },
      { status: 400 }
    );
  }

  if (cheapWholesaleNgnThreshold != null && cheapSellingMarkup == null) {
    return NextResponse.json(
      { error: "Cheap markup multiplier is required when wholesale threshold is set" },
      { status: 400 }
    );
  }

  const config = await updatePricingConfig({
    yuanToNaira,
    gbpToNaira,
    usdToNaira,
    sellingMarkup,
    expensiveYuanThreshold,
    expensiveWholesaleNgnThreshold,
    expensiveSellingMarkup,
    cheapYuanThreshold,
    cheapWholesaleNgnThreshold,
    cheapSellingMarkup,
  });

  await recalculateAllPrices(config);

  return NextResponse.json(config);
}

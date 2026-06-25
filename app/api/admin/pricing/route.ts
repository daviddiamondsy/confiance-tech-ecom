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
  const sellingMarkup = Number(body.sellingMarkup);
  const expensiveYuanThresholdRaw = body.expensiveYuanThreshold;
  const expensiveSellingMarkupRaw = body.expensiveSellingMarkup;
  const expensiveYuanThreshold =
    expensiveYuanThresholdRaw === "" || expensiveYuanThresholdRaw == null
      ? null
      : Number(expensiveYuanThresholdRaw);
  const expensiveSellingMarkup =
    expensiveSellingMarkupRaw === "" || expensiveSellingMarkupRaw == null
      ? null
      : Number(expensiveSellingMarkupRaw);

  if (
    !Number.isFinite(yuanToNaira) ||
    yuanToNaira <= 0 ||
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
    expensiveSellingMarkup != null &&
    (!Number.isFinite(expensiveSellingMarkup) || expensiveSellingMarkup <= 0)
  ) {
    return NextResponse.json({ error: "Invalid expensive markup multiplier" }, { status: 400 });
  }

  if (expensiveYuanThreshold != null && expensiveSellingMarkup == null) {
    return NextResponse.json(
      { error: "Expensive markup multiplier is required when threshold is set" },
      { status: 400 }
    );
  }

  const config = await updatePricingConfig({
    yuanToNaira,
    sellingMarkup,
    expensiveYuanThreshold,
    expensiveSellingMarkup,
  });

  await recalculateAllPrices(config);

  return NextResponse.json(config);
}

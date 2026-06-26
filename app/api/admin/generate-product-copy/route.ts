import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { parseFilterSlugsInput } from "@/lib/admin-product-form";
import {
  AdminProductCopyAiError,
  generateProductCopyWithAi,
} from "@/lib/admin-product-copy-ai";

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const productName = String(body.productName ?? "").trim();
  const filterSlugs = parseFilterSlugsInput(body.filterSlugs, body.filterSlug);
  const storage =
    body.storage != null && String(body.storage).trim()
      ? String(body.storage).trim()
      : undefined;

  if (!productName) {
    return NextResponse.json({ error: "productName is required" }, { status: 400 });
  }

  try {
    const copy = await generateProductCopyWithAi({
      productName,
      filterSlugs,
      storage,
    });
    return NextResponse.json(copy);
  } catch (error) {
    if (error instanceof AdminProductCopyAiError) {
      const status =
        error.message === "AI_NOT_CONFIGURED"
          ? 503
          : error.message === "PRODUCT_NAME_REQUIRED"
            ? 400
            : 502;
      return NextResponse.json({ error: error.userMessage }, { status });
    }

    console.error("[admin/generate-product-copy] failed", error);
    return NextResponse.json({ error: "Could not generate copy" }, { status: 500 });
  }
}

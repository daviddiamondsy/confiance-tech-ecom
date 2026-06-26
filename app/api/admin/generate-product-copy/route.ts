import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { parseFilterSlugsInput } from "@/lib/admin-product-form";
import { generateProductCopyWithAi } from "@/lib/admin-product-copy-ai";

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
    if (error instanceof Error) {
      if (error.message === "AI_NOT_CONFIGURED") {
        return NextResponse.json(
          {
            error:
              "AI copy generation is not configured. Set ADMIN_OPENAI_API_KEY or OPENAI_API_KEY.",
          },
          { status: 503 }
        );
      }
      if (error.message === "AI_REQUEST_FAILED") {
        return NextResponse.json(
          { error: "Could not generate copy. Check your API key and try again." },
          { status: 502 }
        );
      }
      if (error.message === "INVALID_AI_RESPONSE") {
        return NextResponse.json(
          { error: "AI returned an invalid response. Try again." },
          { status: 502 }
        );
      }
    }

    console.error("[admin/generate-product-copy] failed", error);
    return NextResponse.json({ error: "Could not generate copy" }, { status: 500 });
  }
}

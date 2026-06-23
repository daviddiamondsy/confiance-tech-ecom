import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import {
  createProductFilter,
  deleteProductFilter,
  fetchProductFiltersFromDb,
  normalizeFilterSlug,
  updateProductFilter,
} from "@/lib/db/filters-repository";

function postgresRequired() {
  return NextResponse.json(
    { error: "DATABASE_URL or POSTGRES_URL is required to manage filters" },
    { status: 503 }
  );
}

export async function GET() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const filters = await fetchProductFiltersFromDb();
  return NextResponse.json({ filters });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const body = await req.json();
  const label = String(body.label ?? "").trim();
  const slugInput = String(body.slug ?? "").trim();
  const slug = slugInput ? normalizeFilterSlug(slugInput) : normalizeFilterSlug(label);

  if (!label || !slug) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  try {
    const filter = await createProductFilter({ slug, label });
    return NextResponse.json({ filter }, { status: 201 });
  } catch (error) {
    console.error("[admin/filters] create failed", error);
    return NextResponse.json({ error: "Could not create filter tag" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const { slug, label } = await req.json();
  if (!slug || !label) {
    return NextResponse.json({ error: "slug and label are required" }, { status: 400 });
  }

  try {
    const filter = await updateProductFilter(String(slug), String(label));
    return NextResponse.json({ filter });
  } catch (error) {
    console.error("[admin/filters] update failed", error);
    return NextResponse.json({ error: "Could not update filter tag" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return postgresRequired();
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ error: "slug query param is required" }, { status: 400 });
  }

  try {
    await deleteProductFilter(slug);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Error && error.message === "FILTER_IN_USE") {
      return NextResponse.json(
        { error: "Cannot delete a filter tag that still has products assigned" },
        { status: 409 }
      );
    }
    console.error("[admin/filters] delete failed", error);
    return NextResponse.json({ error: "Could not delete filter tag" }, { status: 500 });
  }
}

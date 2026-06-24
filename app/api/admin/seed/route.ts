import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";
import { seedCatalog } from "@/lib/db/seed";

export async function POST() {
  if (!isAdminAuthenticated()) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPostgresConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL or POSTGRES_URL is required" },
      { status: 503 }
    );
  }

  try {
    await ensureCatalogSchema();
    const count = await seedCatalog();
    return NextResponse.json({
      ok: true,
      message: `Imported ${count} default catalog products. Existing rows were updated, not duplicated.`,
      count,
    });
  } catch (error) {
    console.error("[admin/seed] catalog import failed", error);
    return NextResponse.json(
      {
        error: "Could not import default catalog",
        detail: getPostgresErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

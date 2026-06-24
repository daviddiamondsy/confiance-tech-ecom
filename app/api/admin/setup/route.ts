import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { isPostgresConfigured } from "@/lib/db/client";
import { runMigrations } from "@/lib/db/migrate";
import { getPostgresErrorMessage } from "@/lib/db/postgres-errors";

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
    await runMigrations();
    return NextResponse.json({ ok: true, message: "Database schema applied." });
  } catch (error) {
    console.error("[admin/setup] migrate failed", error);
    return NextResponse.json(
      {
        error: "Could not apply database schema",
        detail: getPostgresErrorMessage(error),
      },
      { status: 500 }
    );
  }
}

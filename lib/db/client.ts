import { createPool, sql as vercelSql } from "@vercel/postgres";
import type { QueryResultRow } from "@neondatabase/serverless";

type SqlPrimitive = string | number | boolean | undefined | null;

/** Neon on Vercel exposes DATABASE_URL; @vercel/postgres expects POSTGRES_URL. */
function ensurePostgresEnv(): void {
  if (!process.env.POSTGRES_URL?.trim() && process.env.DATABASE_URL?.trim()) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL.trim();
  }

  if (!process.env.POSTGRES_URL_NON_POOLING?.trim()) {
    if (process.env.DATABASE_URL_UNPOOLED?.trim()) {
      process.env.POSTGRES_URL_NON_POOLING = process.env.DATABASE_URL_UNPOOLED.trim();
      return;
    }

    const pooled = process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
    if (pooled?.includes("-pooler")) {
      process.env.POSTGRES_URL_NON_POOLING = pooled.replace("-pooler", "");
    }
  }
}

ensurePostgresEnv();

export const sql = vercelSql;

export function getPostgresConnectionUrl(): string | undefined {
  ensurePostgresEnv();
  return process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
}

export function getDirectPostgresConnectionUrl(): string | undefined {
  ensurePostgresEnv();
  return (
    process.env.POSTGRES_URL_NON_POOLING?.trim() ||
    process.env.DATABASE_URL_UNPOOLED?.trim() ||
    getPostgresConnectionUrl()?.replace("-pooler", "")
  );
}

export function isPostgresConfigured(): boolean {
  return Boolean(getPostgresConnectionUrl());
}

/** Use a direct (non-pooler) connection for DDL. Neon poolers reject CREATE/ALTER. */
export async function sqlDdl<O extends QueryResultRow>(
  strings: TemplateStringsArray,
  ...values: SqlPrimitive[]
) {
  const connectionString = getDirectPostgresConnectionUrl();
  if (!connectionString) {
    throw new Error("Missing direct Postgres connection URL");
  }

  const pool = createPool({ connectionString });
  try {
    return await pool.sql<O>(strings, ...values);
  } finally {
    await pool.end();
  }
}

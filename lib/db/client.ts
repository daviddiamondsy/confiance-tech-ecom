import { sql as vercelSql } from "@vercel/postgres";

/** Neon on Vercel exposes DATABASE_URL; @vercel/postgres expects POSTGRES_URL. */
function ensurePostgresEnv(): void {
  if (!process.env.POSTGRES_URL?.trim() && process.env.DATABASE_URL?.trim()) {
    process.env.POSTGRES_URL = process.env.DATABASE_URL.trim();
  }
}

ensurePostgresEnv();

export const sql = vercelSql;

export function getPostgresConnectionUrl(): string | undefined {
  ensurePostgresEnv();
  return process.env.POSTGRES_URL?.trim() || process.env.DATABASE_URL?.trim();
}

export function isPostgresConfigured(): boolean {
  return Boolean(getPostgresConnectionUrl());
}

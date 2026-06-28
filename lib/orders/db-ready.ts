import { ensureOrdersSchema } from "@/lib/db/orders-schema";

let schemaReady: Promise<void> | null = null;

/** Idempotent orders DDL; deduped across concurrent requests (serverless-safe). */
export function ensureOrdersReady(): Promise<void> {
  if (!schemaReady) {
    schemaReady = ensureOrdersSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

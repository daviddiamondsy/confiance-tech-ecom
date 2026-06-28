import { ensureReferralSchema } from "@/lib/db/referral-schema";

let schemaReady: Promise<void> | null = null;

/** Idempotent referral DDL; deduped across concurrent requests (serverless-safe). */
export function ensureReferralReady(): Promise<void> {
  if (!schemaReady) {
    schemaReady = ensureReferralSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

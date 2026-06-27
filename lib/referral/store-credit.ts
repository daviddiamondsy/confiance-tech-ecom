import { STORE_CREDIT_EXPIRY_MONTHS } from "@/lib/referral/config";

export interface StoreCreditLedgerEntry {
  amountNgn: number;
  expiresAt: Date | null;
  createdAt: Date;
}

/** Available balance after FIFO redemption and expiry (positive grants only). */
export function computeAvailableStoreCreditBalance(
  entries: StoreCreditLedgerEntry[],
  asOf: Date = new Date()
): number {
  const sorted = [...entries].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  const grants: { remaining: number; expiresAt: Date | null }[] = [];

  for (const entry of sorted) {
    if (entry.amountNgn > 0) {
      grants.push({ remaining: entry.amountNgn, expiresAt: entry.expiresAt });
      continue;
    }

    let toDeduct = -entry.amountNgn;
    for (const grant of grants) {
      if (toDeduct <= 0) break;
      if (grant.remaining <= 0) continue;
      if (grant.expiresAt && grant.expiresAt <= asOf) continue;
      const take = Math.min(grant.remaining, toDeduct);
      grant.remaining -= take;
      toDeduct -= take;
    }
  }

  return grants
    .filter((grant) => grant.remaining > 0 && (!grant.expiresAt || grant.expiresAt > asOf))
    .reduce((sum, grant) => sum + grant.remaining, 0);
}

export function storeCreditExpiresAt(earnedAt: Date): Date {
  const expires = new Date(earnedAt);
  expires.setMonth(expires.getMonth() + STORE_CREDIT_EXPIRY_MONTHS);
  return expires;
}

export function maskRefereePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "••••";
  return `••••${digits.slice(-4)}`;
}

import { describe, expect, it } from "vitest";
import {
  computeAvailableStoreCreditBalance,
  storeCreditExpiresAt,
} from "@/lib/referral/store-credit";
import { STORE_CREDIT_EXPIRY_MONTHS } from "@/lib/referral/config";

// BDD: e-com.md › Feature: Referral Program › Store credit expiry
describe("e-com.md › Referral Program › store credit ledger", () => {
  it("sums positive grants with no redemptions", () => {
    const balance = computeAvailableStoreCreditBalance([
      { amountNgn: 10_000, expiresAt: null, createdAt: new Date("2026-01-01") },
      { amountNgn: 5_000, expiresAt: null, createdAt: new Date("2026-02-01") },
    ]);

    expect(balance).toBe(15_000);
  });

  it("applies FIFO redemption against oldest non-expired grants", () => {
    const balance = computeAvailableStoreCreditBalance([
      { amountNgn: 10_000, expiresAt: null, createdAt: new Date("2026-01-01") },
      { amountNgn: 8_000, expiresAt: null, createdAt: new Date("2026-02-01") },
      { amountNgn: -12_000, expiresAt: null, createdAt: new Date("2026-03-01") },
    ]);

    expect(balance).toBe(6_000);
  });

  it("excludes expired grants from available balance", () => {
    const asOf = new Date("2027-02-01");
    const expiredAt = new Date("2026-01-01");

    const balance = computeAvailableStoreCreditBalance(
      [
        { amountNgn: 10_000, expiresAt: expiredAt, createdAt: new Date("2025-01-01") },
        { amountNgn: 5_000, expiresAt: null, createdAt: new Date("2026-06-01") },
      ],
      asOf
    );

    expect(balance).toBe(5_000);
  });

  it("sets expiry twelve months after earn date", () => {
    const earnedAt = new Date("2026-06-15T12:00:00Z");
    const expires = storeCreditExpiresAt(earnedAt);

    expect(expires.getMonth()).toBe((earnedAt.getMonth() + STORE_CREDIT_EXPIRY_MONTHS) % 12);
    expect(expires.getFullYear()).toBeGreaterThanOrEqual(earnedAt.getFullYear());
  });
});

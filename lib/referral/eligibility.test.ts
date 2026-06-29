import { describe, expect, it } from "vitest";

/**
 * Documents referee referral consumption rules (mirrors referral-repository SQL).
 * Unpaid checkouts must not block new referral attempts on the same phone.
 */
export function refereeReferralDiscountConsumed(
  events: Array<{ status: string; orderFulfillmentStatus?: string | null }>
): boolean {
  return events.some((event) => {
    if (event.status === "earned") return true;
    if (event.status !== "pending") return false;
    const fulfillment = event.orderFulfillmentStatus;
    return fulfillment != null && fulfillment !== "pending_payment";
  });
}

describe("referee referral eligibility", () => {
  it("pending unpaid checkout does not consume referral slot", () => {
    expect(
      refereeReferralDiscountConsumed([
        { status: "pending", orderFulfillmentStatus: "pending_payment" },
      ])
    ).toBe(false);
  });

  it("earned referral blocks reuse", () => {
    expect(refereeReferralDiscountConsumed([{ status: "earned" }])).toBe(true);
  });

  it("pending on secured order blocks reuse", () => {
    expect(
      refereeReferralDiscountConsumed([
        { status: "pending", orderFulfillmentStatus: "secured" },
      ])
    ).toBe(true);
  });

  it("void events do not block", () => {
    expect(refereeReferralDiscountConsumed([{ status: "void" }])).toBe(false);
  });
});

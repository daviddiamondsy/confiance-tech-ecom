import { describe, expect, it } from "vitest";
import { buildReferralTermsSections } from "@/lib/referral/terms";
import {
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_MIN_DEAL_NGN,
  STORE_CREDIT_EXPIRY_MONTHS,
} from "@/lib/referral/config";

describe("buildReferralTermsSections", () => {
  it("includes live config values in customer-facing terms", () => {
    const sections = buildReferralTermsSections();
    const text = sections.flatMap((section) => section.items).join(" ");

    expect(sections.length).toBeGreaterThan(0);
    expect(text).toContain(String(REFERRAL_ATTRIBUTION_DAYS));
    expect(text).toContain(String(STORE_CREDIT_EXPIRY_MONTHS));
    expect(text).toContain(REFERRAL_MIN_DEAL_NGN.toLocaleString("en-NG"));
    expect(text).toContain("store points");
    expect(text).toContain("One referral discount per phone number");
  });
});

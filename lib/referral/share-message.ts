import {
  formatNgn,
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_TIERS,
} from "@/lib/referral/config";

export interface ReferralShareMessageInput {
  code: string;
  shareUrl: string;
  referrerName?: string | null;
}

export function refereeDiscountRangeNgn(): { min: number; max: number } {
  const amounts = REFERRAL_TIERS.map((tier) => tier.refereeDiscountNgn);
  return {
    min: Math.min(...amounts),
    max: Math.max(...amounts),
  };
}

export function formatRefereeDiscountRange(): string {
  const { min, max } = refereeDiscountRangeNgn();
  if (min === max) {
    return formatNgn(min);
  }
  return `${formatNgn(min)} to ${formatNgn(max)}`;
}

/** Ready-to-paste message for WhatsApp, SMS, or email. */
export function buildReferralShareMessage(input: ReferralShareMessageInput): string {
  const intro = input.referrerName
    ? `Hey! ${input.referrerName} here. I bought from Confiance Tech and wanted to share a discount with you.`
    : "Hey! I bought from Confiance Tech and wanted to share a discount with you.";

  const { max } = refereeDiscountRangeNgn();
  const discountSummary = formatRefereeDiscountRange();

  return [
    intro,
    "",
    `Save up to ${formatNgn(max)} on your first device order (${discountSummary} depending on the device you pick). The discount applies automatically when you checkout through my link.`,
    "",
    `Open: ${input.shareUrl}`,
    `Or use code: ${input.code}`,
    "",
    `One referral discount per phone number. Link valid for ${REFERRAL_ATTRIBUTION_DAYS} days.`,
  ].join("\n");
}

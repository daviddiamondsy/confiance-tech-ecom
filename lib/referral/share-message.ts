import {
  formatNgn,
  formatRefereeDiscountRange,
  refereeDiscountRangeNgn,
  REFERRAL_ATTRIBUTION_DAYS,
} from "@/lib/referral/config";

export interface ReferralShareMessageInput {
  shareUrl: string;
  referrerName?: string | null;
  productName?: string | null;
}

export { formatRefereeDiscountRange, refereeDiscountRangeNgn } from "@/lib/referral/config";

/** Ready-to-paste message for WhatsApp, SMS, or email. */
export function buildReferralShareMessage(input: ReferralShareMessageInput): string {
  const intro = input.referrerName
    ? `Hey! ${input.referrerName} here. I bought from Confiance Tech and wanted to share a discount with you.`
    : "Hey! I bought from Confiance Tech and wanted to share a discount with you.";

  const discountSummary = formatRefereeDiscountRange();
  const { max: maxFriendDiscountNgn } = refereeDiscountRangeNgn();
  const discountLine = `Save up to ${formatNgn(maxFriendDiscountNgn)} on your first device order (${discountSummary} depending on the device you pick). The discount applies automatically when you checkout through my link.`;

  const lines = [intro, ""];
  if (input.productName?.trim()) {
    lines.push(`I picked this for you: ${input.productName.trim()}.`, "");
  }
  lines.push(
    discountLine,
    "",
    `Open: ${input.shareUrl}`,
    "",
    `One referral discount per phone number. Link valid for ${REFERRAL_ATTRIBUTION_DAYS} days.`
  );
  return lines.join("\n");
}

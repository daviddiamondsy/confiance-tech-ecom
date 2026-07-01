import {
  formatNgn,
  formatRefereeDiscountRange,
  REFERRAL_ATTRIBUTION_DAYS,
  REFERRAL_MIN_DEAL_NGN,
  STORE_CREDIT_EXPIRY_MONTHS,
} from "@/lib/referral/config";

export interface ReferralTermsSection {
  title: string;
  items: string[];
}

/** Customer-facing referral program terms, derived from live config values. */
export function buildReferralTermsSections(): ReferralTermsSection[] {
  const friendDiscountRange = formatRefereeDiscountRange();

  return [
    {
      title: "Program overview",
      items: [
        "The Confiance Tech Refer & Earn program lets you share a personal link so friends save on their first order and you earn store points after their order completes.",
        "Rewards are store points with a naira value. They are not cash, cannot be withdrawn, and cannot be transferred to another person.",
        "Confiance Tech may update, pause, or end this program at any time. The terms on this page reflect the current rules.",
      ],
    },
    {
      title: "Referrer eligibility",
      items: [
        "You need a valid Nigerian mobile number to get a referral link. Use the same number you use at checkout when possible.",
        "Each phone number receives one referral code. You may update the display name shown to friends, but the code stays tied to your phone.",
        "You must not create fake orders, self-refer, or use misleading claims when sharing your link.",
      ],
    },
    {
      title: "Friend (referee) eligibility",
      items: [
        "The referral discount applies to a friend's first qualifying paid order only. One referral discount per phone number, ever.",
        "A friend cannot use their own referral code.",
        "The friend must open your referral link and complete checkout while the referral is still attributed to your code.",
        `Referral links stay active for ${REFERRAL_ATTRIBUTION_DAYS} days after a friend clicks your link.`,
        `Friend savings are fixed by device catalog price band (${friendDiscountRange} depending on the product). See the reward tiers table for current amounts.`,
      ],
    },
    {
      title: "How rewards are earned",
      items: [
        "Your friend receives an automatic discount at checkout when their order qualifies.",
        "Your store points stay pending until their order completes successfully through Holdam checkout.",
        "You and your friend receive equal reward amounts for the tier that matches the product catalog price.",
        "If an order is cancelled, refunded, or disputed, pending rewards are voided. Store points already earned may be reversed.",
      ],
    },
    {
      title: "Using store points",
      items: [
        `Store points expire ${STORE_CREDIT_EXPIRY_MONTHS} months after they are earned.`,
        "Apply available store points at checkout on a future order from Confiance Tech.",
        `After discounts, the order total must remain at least ${formatNgn(REFERRAL_MIN_DEAL_NGN)}.`,
        "Store points are applied in first-earned order when you redeem them.",
        "Unused store points have no cash value after expiry.",
      ],
    },
    {
      title: "General",
      items: [
        "Confiance Tech may reject or reverse rewards for abuse, duplicate accounts, or attempts to game the program.",
        "These terms supplement our standard order, return, and checkout policies.",
        "For help with your referral link or store point balance, contact us using the details on our website.",
      ],
    },
  ];
}

const DEFAULT_STOREFRONT_PHONE = "+1 (555) 651-9184";
const DEFAULT_FACEBOOK_URL = "#";
const DEFAULT_INSTAGRAM_URL = "https://www.instagram.com/confiance_tech";

function trimEnv(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

/** wa.me link from display phone (supports +1… or Nigerian 0… local format). */
export function whatsappUrlFromPhone(phone: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return "#";
  if (digits.startsWith("0")) {
    return `https://wa.me/234${digits.slice(1)}`;
  }
  return `https://wa.me/${digits}`;
}

export const STOREFRONT_PHONE =
  trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_PHONE) ?? DEFAULT_STOREFRONT_PHONE;

export const STOREFRONT_SOCIAL_LINKS = {
  facebook:
    trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_FACEBOOK_URL) ?? DEFAULT_FACEBOOK_URL,
  whatsapp:
    trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_WHATSAPP_URL) ??
    whatsappUrlFromPhone(STOREFRONT_PHONE),
  instagram:
    trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_INSTAGRAM_URL) ?? DEFAULT_INSTAGRAM_URL,
} as const;

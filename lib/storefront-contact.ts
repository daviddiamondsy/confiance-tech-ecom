const DEFAULT_STOREFRONT_PHONE = "07065093454";
const DEFAULT_STOREFRONT_WHATSAPP_PHONE = "+234 904 947 7733";
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

/** tel: link from display phone (Nigerian 0… → +234…). */
export function telUrlFromPhone(phone: string): string {
  const digits = phoneDigits(phone);
  if (!digits) return "#";
  if (digits.startsWith("0")) {
    return `tel:+234${digits.slice(1)}`;
  }
  return `tel:+${digits}`;
}

/** Call / display number shown in footer and FAQ. */
export const STOREFRONT_PHONE =
  trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_PHONE) ?? DEFAULT_STOREFRONT_PHONE;

/** WhatsApp display number (may differ from call number). */
export const STOREFRONT_WHATSAPP_PHONE =
  trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_WHATSAPP_PHONE) ??
  DEFAULT_STOREFRONT_WHATSAPP_PHONE;

export const STOREFRONT_CALL_URL = telUrlFromPhone(STOREFRONT_PHONE);

export const STOREFRONT_SOCIAL_LINKS = {
  facebook:
    trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_FACEBOOK_URL) ?? DEFAULT_FACEBOOK_URL,
  whatsapp:
    trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_WHATSAPP_URL) ??
    whatsappUrlFromPhone(STOREFRONT_WHATSAPP_PHONE),
  instagram:
    trimEnv(process.env.NEXT_PUBLIC_STOREFRONT_INSTAGRAM_URL) ?? DEFAULT_INSTAGRAM_URL,
} as const;

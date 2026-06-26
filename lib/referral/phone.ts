/** Normalize Nigerian phone numbers to E.164 (+234...) for consistent matching. */
export function normalizeNigerianPhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return trimmed;

  if (digits.startsWith("234") && digits.length >= 13) {
    return `+${digits.slice(0, 13)}`;
  }

  if (digits.startsWith("0") && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }

  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `+234${digits}`;
  }

  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }

  return `+${digits}`;
}

export function phonesMatch(a: string, b: string): boolean {
  const na = normalizeNigerianPhone(a);
  const nb = normalizeNigerianPhone(b);
  return Boolean(na && nb && na === nb);
}

/**
 * When true, checkout skips Holdam deal creation and hosted payment.
 * Records the order locally and sends the ops notification email only.
 *
 * Fail closed in production: bypass is always off regardless of env.
 * In non-production, requires an explicit BYPASS_HOLDAM=true opt-in.
 */
export function isHoldamBypassEnabled(): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }

  return parseEnvFlag(process.env.BYPASS_HOLDAM) === true;
}

function parseEnvFlag(raw: string | undefined): boolean | undefined {
  if (raw === undefined || raw.trim() === "") {
    return undefined;
  }

  const normalized = raw.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }

  return undefined;
}

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

/**
 * When true, checkout skips Holdam deal creation and hosted payment.
 * Records the order locally and sends the ops notification email only.
 *
 * Defaults to true in development when BYPASS_HOLDAM is unset.
 */
export function isHoldamBypassEnabled(): boolean {
  const explicit = parseEnvFlag(process.env.BYPASS_HOLDAM);
  if (explicit !== undefined) {
    return explicit;
  }

  return process.env.NODE_ENV === "development";
}

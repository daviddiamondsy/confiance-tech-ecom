/** Postgres drivers often return TIMESTAMPTZ as strings, not Date instances. */
export function coerceDate(value: Date | string | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function coerceDateIso(value: Date | string | null | undefined): string | null {
  const date = coerceDate(value);
  return date ? date.toISOString() : null;
}

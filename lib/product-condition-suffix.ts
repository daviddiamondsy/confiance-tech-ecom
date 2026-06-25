/** Product name suffix by category: MacBooks are new; other devices are Grade A pre-owned. */
export const PRODUCT_CONDITION_SUFFIX = {
  clean: "(Clean)",
  new: "(New)",
} as const;

const CONDITION_SUFFIX_PATTERN = /\s*\((Clean|New)\)\s*$/i;

export function conditionSuffixForFilter(filterSlug: string | null | undefined): string {
  if (filterSlug === "new" || filterSlug === "macbook") {
    return PRODUCT_CONDITION_SUFFIX.new;
  }
  return PRODUCT_CONDITION_SUFFIX.clean;
}

export function isNewProductFilter(filterSlug: string | null | undefined): boolean {
  return filterSlug === "new" || filterSlug === "macbook";
}

export function stripConditionSuffix(name: string): string {
  return name.replace(CONDITION_SUFFIX_PATTERN, "").trim();
}

export function normalizeProductName(
  name: string,
  filterSlug: string | null | undefined
): string {
  const base = stripConditionSuffix(name);
  const suffix = conditionSuffixForFilter(filterSlug);
  return `${base} ${suffix}`;
}

/** Storefront name: filter tag wins over a stale (Clean)/(New) suffix in the DB. */
export function resolveProductDisplayName(
  name: string,
  filterSlug?: string | null
): string {
  if (!filterSlug) return name;
  return normalizeProductName(name, filterSlug);
}

/** Suffix at end of a product display name, if present. */
export function conditionSuffixInName(name: string): string | null {
  const match = name.match(CONDITION_SUFFIX_PATTERN);
  if (!match) return null;
  const value = match[1].toLowerCase();
  return value === "new" ? PRODUCT_CONDITION_SUFFIX.new : PRODUCT_CONDITION_SUFFIX.clean;
}

export function replaceConditionSuffix(
  name: string,
  replacement: string
): string {
  const suffix = conditionSuffixInName(name);
  if (!suffix) return name;
  return name.replace(suffix, replacement);
}

/** Storefront title: base name, optional storage, optional color, then (Clean)/(New). */
export function buildVariantDisplayName(input: {
  name: string;
  filterSlug?: string | null;
  storage?: string;
  color?: string;
}): string {
  const normalized = input.filterSlug
    ? normalizeProductName(input.name, input.filterSlug)
    : input.name;
  const base = stripConditionSuffix(normalized);
  const suffix = input.filterSlug
    ? conditionSuffixForFilter(input.filterSlug)
    : (conditionSuffixInName(normalized) ?? PRODUCT_CONDITION_SUFFIX.clean);

  let label = base;
  if (input.storage) {
    label = `${base} ${input.storage}`;
  }
  if (input.color) {
    label = input.storage ? `${label} - ${input.color}` : `${base} - ${input.color}`;
  }
  return `${label} ${suffix}`;
}

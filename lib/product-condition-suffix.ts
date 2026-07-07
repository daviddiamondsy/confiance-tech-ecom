/** Product name suffix by category: MacBooks are new; other devices are Grade A pre-owned. */
export const PRODUCT_CONDITION_SUFFIX = {
  clean: "(Like New)",
  new: "(New)",
} as const;

const CONDITION_SUFFIX_PATTERN = /\s*\((Clean|Like New|New)\)\s*$/i;

export function conditionSuffixForFilter(filterSlug: string | null | undefined): string {
  if (filterSlug === "new" || filterSlug === "macbook") {
    return PRODUCT_CONDITION_SUFFIX.new;
  }
  return PRODUCT_CONDITION_SUFFIX.clean;
}

/** Pick (Like New) vs (New) suffix when a product has multiple filter tags. */
export function primaryConditionFilterSlug(
  filterSlugs: readonly string[]
): string | null {
  if (filterSlugs.length === 0) return null;
  if (filterSlugs.some((slug) => slug === "new" || slug === "macbook")) {
    return "new";
  }
  return "clean";
}

export function isNewProductFilter(filterSlug: string | null | undefined): boolean {
  return filterSlug === "new" || filterSlug === "macbook";
}

export function isNewProductFromFilterSlugs(filterSlugs: readonly string[]): boolean {
  return filterSlugs.some((slug) => isNewProductFilter(slug));
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

/** Storefront name: filter tags win over a stale condition suffix in the DB. */
export function resolveProductDisplayName(
  name: string,
  filterSlug?: string | null,
  filterSlugs?: readonly string[] | null
): string {
  const slug = filterSlug ?? primaryConditionFilterSlug(filterSlugs ?? []);
  if (!slug) return name;
  return normalizeProductName(name, slug);
}

/** Suffix at end of a product display name, if present. */
export function conditionSuffixInName(name: string): string | null {
  const match = name.match(CONDITION_SUFFIX_PATTERN);
  if (!match) return null;
  const value = match[1].toLowerCase();
  if (value === "new") return PRODUCT_CONDITION_SUFFIX.new;
  return PRODUCT_CONDITION_SUFFIX.clean;
}

export function replaceConditionSuffix(
  name: string,
  replacement: string
): string {
  const suffix = conditionSuffixInName(name);
  if (!suffix) return name;
  return name.replace(suffix, replacement);
}

/** Hide badge when it duplicates the condition suffix already in the product name. */
export function storefrontProductBadge(input: {
  badge?: string | null;
  name: string;
}): string | undefined {
  const badge = input.badge?.trim();
  if (!badge) return undefined;

  const suffix = conditionSuffixInName(input.name);
  if (!suffix) return badge;

  const normalizedBadge = badge.toLowerCase();
  if (normalizedBadge === "new" && suffix === PRODUCT_CONDITION_SUFFIX.new) {
    return undefined;
  }
  if (
    (normalizedBadge === "clean" || normalizedBadge === "like new") &&
    suffix === PRODUCT_CONDITION_SUFFIX.clean
  ) {
    return undefined;
  }

  return badge;
}

/** Storefront title: base name, optional storage, optional color, then condition suffix. */
export function buildVariantDisplayName(input: {
  name: string;
  filterSlug?: string | null;
  filterSlugs?: readonly string[] | null;
  storage?: string;
  color?: string;
  multipleStorageOptions?: boolean;
  multipleColorOptions?: boolean;
}): string {
  const conditionSlug =
    input.filterSlug ?? primaryConditionFilterSlug(input.filterSlugs ?? []);
  const normalized = conditionSlug
    ? normalizeProductName(input.name, conditionSlug)
    : input.name;
  const base = stripConditionSuffix(normalized);
  const suffix = conditionSlug
    ? conditionSuffixForFilter(conditionSlug)
    : (conditionSuffixInName(normalized) ?? PRODUCT_CONDITION_SUFFIX.clean);

  let label = base;
  if (input.storage && input.multipleStorageOptions) {
    label = `${base} ${input.storage}`;
  }
  if (input.color && input.multipleColorOptions) {
    label = input.storage && input.multipleStorageOptions
      ? `${label} - ${input.color}`
      : `${base} - ${input.color}`;
  }
  return `${label} ${suffix}`;
}

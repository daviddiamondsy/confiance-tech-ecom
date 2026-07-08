export type VariantDimension = "storage" | "size";
export type PriceMode = "calculated" | "direct_ngn";

export function parseVariantDimension(value: unknown): VariantDimension {
  const raw = String(value ?? "storage").trim().toLowerCase();
  if (raw === "size") return "size";
  return "storage";
}

export function parsePriceMode(value: unknown): PriceMode {
  const raw = String(value ?? "calculated").trim().toLowerCase();
  if (raw === "direct_ngn" || raw === "direct") return "direct_ngn";
  return "calculated";
}

export function variantPickerLabel(dimension: VariantDimension): string {
  return dimension === "size" ? "Size" : "Storage";
}

export function variantSpecKey(dimension: VariantDimension): "Storage" | "Size" {
  return dimension === "size" ? "Size" : "Storage";
}

export function variantLabelFieldPlaceholder(dimension: VariantDimension): string {
  return dimension === "size" ? "Size label (e.g. 10 inch)" : "Storage capacity label";
}

export function variantLinesPlaceholder(
  dimension: VariantDimension,
  costUnitLabel: string,
  directNaira: boolean
): string {
  if (directNaira) {
    return dimension === "size"
      ? "One size:price per line (e.g. 10\":45000)"
      : "One storage:price per line (e.g. 128GB:850000)";
  }
  return dimension === "size"
    ? `One size:cost per line (${costUnitLabel}, e.g. 10\":25)`
    : `One storage:cost per line (${costUnitLabel}, e.g. 128GB:1500)`;
}

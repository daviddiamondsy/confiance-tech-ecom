/** Normalized fields extracted from Holdam merchant webhook JSON. */
export interface ParsedHoldamWebhookData {
  dealId: string | null;
  metadata: Record<string, unknown> | null;
  status: string | null;
  amount: number | string | null;
}

function readString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

/**
 * Resolve the deal identifier from any supported Holdam webhook payload shape.
 * SDK README uses `data.id`; API-PUBLIC uses `data.dealId` and `data.deal.id`.
 */
export function resolveWebhookDealId(data: unknown): string | null {
  const root = readRecord(data);
  if (!root) return null;

  const deal = readRecord(root.deal);
  const candidates = [root.dealId, root.id, deal?.id];

  for (const candidate of candidates) {
    const id = readString(candidate);
    if (id) return id;
  }

  return null;
}

/** Parse `event.data` from a verified Holdam webhook body. */
export function parseHoldamWebhookData(data: unknown): ParsedHoldamWebhookData {
  const root = readRecord(data);
  const deal = root ? readRecord(root.deal) : null;

  const metadata =
    readRecord(root?.metadata) ??
    readRecord(deal?.metadata) ??
    null;

  const status = readString(root?.status) ?? readString(deal?.status);
  const amount =
    root?.amount ??
    deal?.amount ??
    null;

  return {
    dealId: resolveWebhookDealId(data),
    metadata,
    status,
    amount: typeof amount === "number" || typeof amount === "string" ? amount : null,
  };
}

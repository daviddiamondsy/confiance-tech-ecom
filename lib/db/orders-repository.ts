import { sql } from "@/lib/db/client";
import type {
  CreateDirectOrderParams,
  CreateHoldamOrderParams,
  CreateManualOrderParams,
  OrderFulfillmentStatus,
  StoreOrderRecord,
} from "@/lib/orders/types";
import { normalizeNigerianPhone } from "@/lib/referral/phone";

function mapRow(row: StoreOrderRecord): StoreOrderRecord {
  return row;
}

function sqlTimestamp(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return value;
}

export async function insertHoldamOrder(params: CreateHoldamOrderParams): Promise<StoreOrderRecord> {
  const customerPhone = normalizeNigerianPhone(params.customerPhone) || params.customerPhone.trim();
  const source = params.source ?? "website";

  const { rows } = await sql<StoreOrderRecord>`
    INSERT INTO store_orders (
      deal_id,
      source,
      fulfillment_status,
      product_id,
      product_name,
      product_price_ngn,
      product_storage,
      product_color,
      catalog_price_ngn,
      checkout_amount_ngn,
      customer_name,
      customer_phone,
      customer_address,
      customer_state,
      referral_code,
      referee_discount_ngn,
      store_credit_applied_ngn
    ) VALUES (
      ${params.dealId},
      ${source},
      'pending_payment',
      ${params.productId ?? null},
      ${params.productName},
      ${params.catalogPriceNgn},
      ${params.productStorage ?? null},
      ${params.productColor ?? null},
      ${params.catalogPriceNgn},
      ${params.checkoutAmountNgn},
      ${params.customerName.trim()},
      ${customerPhone},
      ${params.customerAddress.trim()},
      ${params.customerState.trim()},
      ${params.referralCode ?? null},
      ${params.refereeDiscountNgn ?? 0},
      ${params.storeCreditAppliedNgn ?? 0}
    )
    ON CONFLICT (deal_id) DO UPDATE SET
      source = CASE
        WHEN EXCLUDED.source = 'chatbot' THEN 'chatbot'
        ELSE store_orders.source
      END,
      updated_at = NOW()
    RETURNING *
  `;

  return mapRow(rows[0]);
}

/** Storefront order without a Holdam deal (BYPASS_HOLDAM). */
export async function insertDirectOrder(params: CreateDirectOrderParams): Promise<StoreOrderRecord> {
  const customerPhone = normalizeNigerianPhone(params.customerPhone) || params.customerPhone.trim();
  const source = params.source ?? "website";

  const { rows } = await sql<StoreOrderRecord>`
    INSERT INTO store_orders (
      source,
      fulfillment_status,
      product_id,
      product_name,
      product_price_ngn,
      product_storage,
      product_color,
      catalog_price_ngn,
      checkout_amount_ngn,
      customer_name,
      customer_phone,
      customer_address,
      customer_state,
      referral_code,
      referee_discount_ngn,
      store_credit_applied_ngn
    ) VALUES (
      ${source},
      'pending_payment',
      ${params.productId ?? null},
      ${params.productName},
      ${params.catalogPriceNgn},
      ${params.productStorage ?? null},
      ${params.productColor ?? null},
      ${params.catalogPriceNgn},
      ${params.checkoutAmountNgn},
      ${params.customerName.trim()},
      ${customerPhone},
      ${params.customerAddress.trim()},
      ${params.customerState.trim()},
      ${params.referralCode ?? null},
      ${params.refereeDiscountNgn ?? 0},
      ${params.storeCreditAppliedNgn ?? 0}
    )
    RETURNING *
  `;

  return mapRow(rows[0]);
}

export async function insertManualOrder(params: CreateManualOrderParams): Promise<StoreOrderRecord> {
  const customerPhone = normalizeNigerianPhone(params.customerPhone) || params.customerPhone.trim();
  const status = params.fulfillmentStatus ?? "pending_payment";
  const nowSecured = status === "secured" || status === "shipped" || status === "complete";
  const nowComplete = status === "complete";
  const securedAt = nowSecured ? new Date().toISOString() : null;
  const completedAt = nowComplete ? new Date().toISOString() : null;

  const { rows } = await sql<StoreOrderRecord>`
    INSERT INTO store_orders (
      source,
      fulfillment_status,
      product_name,
      product_price_ngn,
      product_storage,
      product_color,
      checkout_amount_ngn,
      customer_name,
      customer_phone,
      customer_address,
      customer_state,
      notes,
      admin_note,
      secured_at,
      completed_at
    ) VALUES (
      'manual',
      ${status},
      ${params.productName.trim()},
      ${params.productPriceNgn ?? null},
      ${params.productStorage?.trim() ?? null},
      ${params.productColor?.trim() ?? null},
      ${params.productPriceNgn ?? null},
      ${params.customerName.trim()},
      ${customerPhone},
      ${params.customerAddress.trim()},
      ${params.customerState.trim()},
      ${params.notes?.trim() ?? null},
      ${params.adminNote?.trim() ?? null},
      ${securedAt},
      ${completedAt}
    )
    RETURNING *
  `;

  return mapRow(rows[0]);
}

export async function listStoreOrders(limit = 100): Promise<StoreOrderRecord[]> {
  const { rows } = await sql<StoreOrderRecord>`
    SELECT *
    FROM store_orders
    ORDER BY created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(mapRow);
}

export async function getStoreOrderById(id: number): Promise<StoreOrderRecord | null> {
  const { rows } = await sql<StoreOrderRecord>`
    SELECT * FROM store_orders WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getStoreOrderByDealId(dealId: string): Promise<StoreOrderRecord | null> {
  const { rows } = await sql<StoreOrderRecord>`
    SELECT * FROM store_orders
    WHERE deal_id = ${dealId} OR holdam_escrow_id = ${dealId}
    LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

export async function getPendingCheckoutOrderByPhone(phone: string): Promise<StoreOrderRecord | null> {
  const customerPhone = normalizeNigerianPhone(phone);
  if (!customerPhone) return null;

  const { rows } = await sql<StoreOrderRecord>`
    SELECT *
    FROM store_orders
    WHERE customer_phone = ${customerPhone}
      AND source IN ('website', 'chatbot', 'holdam')
      AND fulfillment_status = 'pending_payment'
    ORDER BY created_at DESC
    LIMIT 1
  `;
  return rows[0] ? mapRow(rows[0]) : null;
}

/** @deprecated Use getPendingCheckoutOrderByPhone */
export async function getPendingHoldamOrderByPhone(phone: string): Promise<StoreOrderRecord | null> {
  return getPendingCheckoutOrderByPhone(phone);
}

export async function linkHoldamEscrowId(params: {
  checkoutDealId: string;
  escrowId: string;
}): Promise<void> {
  if (!params.checkoutDealId || !params.escrowId) return;
  if (params.checkoutDealId === params.escrowId) return;

  await sql`
    UPDATE store_orders
    SET holdam_escrow_id = ${params.escrowId}, updated_at = NOW()
    WHERE deal_id = ${params.checkoutDealId}
      AND holdam_escrow_id IS NULL
  `;
}

export async function updateStoreOrderStatus(params: {
  id: number;
  fulfillmentStatus: OrderFulfillmentStatus;
  adminNote?: string | null;
  holdamEvent?: string | null;
}): Promise<StoreOrderRecord | null> {
  const existing = await getStoreOrderById(params.id);
  if (!existing) return null;

  const securedAt =
    params.fulfillmentStatus === "secured" ||
    params.fulfillmentStatus === "shipped" ||
    params.fulfillmentStatus === "complete"
      ? existing.secured_at ?? new Date().toISOString()
      : existing.secured_at;

  const completedAt =
    params.fulfillmentStatus === "complete"
      ? existing.completed_at ?? new Date().toISOString()
      : existing.completed_at;

  const { rows } = await sql<StoreOrderRecord>`
    UPDATE store_orders
    SET
      fulfillment_status = ${params.fulfillmentStatus},
      admin_note = COALESCE(${params.adminNote ?? null}, admin_note),
      holdam_event = COALESCE(${params.holdamEvent ?? null}, holdam_event),
      secured_at = ${sqlTimestamp(securedAt)},
      completed_at = ${sqlTimestamp(completedAt)},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function updateStoreOrderFromWebhook(params: {
  dealId: string;
  fulfillmentStatus: OrderFulfillmentStatus;
  holdamEvent: string;
}): Promise<StoreOrderRecord | null> {
  const existing = await getStoreOrderByDealId(params.dealId);
  if (!existing) return null;

  const securedAt =
    params.fulfillmentStatus === "secured" ||
    params.fulfillmentStatus === "shipped" ||
    params.fulfillmentStatus === "complete"
      ? existing.secured_at ?? new Date().toISOString()
      : existing.secured_at;

  const completedAt =
    params.fulfillmentStatus === "complete"
      ? existing.completed_at ?? new Date().toISOString()
      : existing.completed_at;

  const { rows } = await sql<StoreOrderRecord>`
    UPDATE store_orders
    SET
      fulfillment_status = ${params.fulfillmentStatus},
      holdam_event = ${params.holdamEvent},
      secured_at = ${sqlTimestamp(securedAt)},
      completed_at = ${sqlTimestamp(completedAt)},
      updated_at = NOW()
    WHERE deal_id = ${params.dealId} OR holdam_escrow_id = ${params.dealId}
    RETURNING *
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function patchStoreOrder(params: {
  id: number;
  fulfillmentStatus?: OrderFulfillmentStatus;
  adminNote?: string | null;
}): Promise<StoreOrderRecord | null> {
  const existing = await getStoreOrderById(params.id);
  if (!existing) return null;

  const nextStatus = params.fulfillmentStatus ?? existing.fulfillment_status;
  const nextNote = params.adminNote !== undefined ? params.adminNote : existing.admin_note;

  const securedAt =
    nextStatus === "secured" || nextStatus === "shipped" || nextStatus === "complete"
      ? existing.secured_at ?? new Date().toISOString()
      : existing.secured_at;

  const completedAt =
    nextStatus === "complete" ? existing.completed_at ?? new Date().toISOString() : existing.completed_at;

  const { rows } = await sql<StoreOrderRecord>`
    UPDATE store_orders
    SET
      fulfillment_status = ${nextStatus},
      admin_note = ${nextNote},
      secured_at = ${sqlTimestamp(securedAt)},
      completed_at = ${sqlTimestamp(completedAt)},
      updated_at = NOW()
    WHERE id = ${params.id}
    RETURNING *
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

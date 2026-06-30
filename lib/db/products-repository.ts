import {
  finalizeStorageVariantsForSave,
  mergeSpecificationsWithStorage,
} from "@/lib/admin-product-form";
import { buildCatalogProducts } from "@/lib/catalog-seed";
import { CATALOG_YUAN } from "@/lib/catalog-yuan";
import { sql } from "@/lib/db/client";
import { ensureCatalogSchema } from "@/lib/db/catalog-schema";
import { slugForProductId, slugifyProductName, catalogProductIdForSlug, CATALOG_SLUGS } from "@/lib/product-slug";
import { fetchColorsByProductIds, fetchColorsForProduct } from "@/lib/db/colors-repository";
import { fetchPricingConfig } from "@/lib/db/pricing-config-repository";
import { priceFromYuan, type PricingConfig } from "@/lib/pricing";
import {
  defaultShippingForProductName,
  productShippingFromRow,
  DEFAULT_CHINA_SHIPPING_YUAN,
  DEFAULT_INTERNATIONAL_SHIPPING_NGN,
  DEFAULT_LOCAL_DELIVERY_NGN,
  type ChinaShippingYuan,
  type InternationalShippingNgn,
  type LocalDeliveryNgn,
  type ProductShippingCosts,
} from "@/lib/product-shipping";
import { getPostgresErrorMessage, isMissingShippingColumnsError } from "@/lib/db/postgres-errors";
import {
  BATTERY_HEALTH_FEATURE,
  BATTERY_HEALTH_SPEC,
} from "@/lib/device-quality-copy";
import { ensureIphoneProductCopy } from "@/lib/iphone-product-copy";
import type { Product, StorageOption } from "@/lib/product-utils";
import {
  isNewProductFromFilterSlugs,
  normalizeProductName as applyConditionProductName,
  primaryConditionFilterSlug,
  resolveProductDisplayName,
  stripConditionSuffix,
} from "@/lib/product-condition-suffix";
import { fetchFilterSlugsByProductIds, replaceProductFilterSlugs } from "@/lib/db/product-filter-assignments";

interface ProductRow {
  id: string;
  slug: string | null;
  filter_slug: string | null;
  name: string;
  price: number;
  yuan_cost: string | null;
  original_price: number | null;
  image: string;
  badge: string | null;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  sort_order: number;
  china_shipping_yuan: number;
  international_shipping_ngn: number;
  local_delivery_ngn: number;
}

type ProductRowWithoutShipping = Omit<
  ProductRow,
  "china_shipping_yuan" | "international_shipping_ngn" | "local_delivery_ngn"
>;

function withDefaultShipping(row: ProductRowWithoutShipping): ProductRow {
  return {
    ...row,
    china_shipping_yuan: DEFAULT_CHINA_SHIPPING_YUAN,
    international_shipping_ngn: DEFAULT_INTERNATIONAL_SHIPPING_NGN,
    local_delivery_ngn: DEFAULT_LOCAL_DELIVERY_NGN,
  };
}

async function fetchAllProductRows(): Promise<ProductRow[]> {
  try {
    const { rows } = await sql<ProductRow>`
      SELECT
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
        description, features, specifications, sort_order,
        china_shipping_yuan, international_shipping_ngn, local_delivery_ngn
      FROM products
      ORDER BY sort_order ASC, id ASC
    `;
    return rows;
  } catch (error) {
    if (!isMissingShippingColumnsError(error)) throw error;
    console.warn(
      "[products] shipping columns missing; using defaults. Run Apply database schema in admin.",
      getPostgresErrorMessage(error)
    );
    const { rows } = await sql<ProductRowWithoutShipping>`
      SELECT
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
        description, features, specifications, sort_order
      FROM products
      ORDER BY sort_order ASC, id ASC
    `;
    return rows.map(withDefaultShipping);
  }
}

async function fetchProductRowById(id: string): Promise<ProductRow | undefined> {
  try {
    const { rows } = await sql<ProductRow>`
      SELECT
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
        description, features, specifications, sort_order,
        china_shipping_yuan, international_shipping_ngn, local_delivery_ngn
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;
    return rows[0];
  } catch (error) {
    if (!isMissingShippingColumnsError(error)) throw error;
    const { rows } = await sql<ProductRowWithoutShipping>`
      SELECT
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
        description, features, specifications, sort_order
      FROM products
      WHERE id = ${id}
      LIMIT 1
    `;
    const row = rows[0];
    return row ? withDefaultShipping(row) : undefined;
  }
}

async function fetchProductRowBySlug(slug: string): Promise<ProductRow | undefined> {
  try {
    const { rows } = await sql<ProductRow>`
      SELECT
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
        description, features, specifications, sort_order,
        china_shipping_yuan, international_shipping_ngn, local_delivery_ngn
      FROM products
      WHERE slug = ${slug}
      LIMIT 1
    `;
    return rows[0];
  } catch (error) {
    if (!isMissingShippingColumnsError(error)) throw error;
    const { rows } = await sql<ProductRowWithoutShipping>`
      SELECT
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
        description, features, specifications, sort_order
      FROM products
      WHERE slug = ${slug}
      LIMIT 1
    `;
    const row = rows[0];
    return row ? withDefaultShipping(row) : undefined;
  }
}

interface StorageRow {
  product_id: string;
  storage: string;
  price: number;
  yuan_cost: string | null;
  sort_order: number;
}

function resolvePrice(
  yuanCost: number | null,
  storedPrice: number,
  config: PricingConfig,
  shipping: ProductShippingCosts
): number {
  if (yuanCost != null && !Number.isNaN(yuanCost)) {
    return priceFromYuan(yuanCost, config, shipping);
  }
  return storedPrice;
}

function storageOptionYuanCost(
  productId: string,
  storage: string,
  optionYuan: string | null,
  baseYuan: number | null
): number | null {
  if (optionYuan != null && !Number.isNaN(Number(optionYuan))) {
    return Number(optionYuan);
  }

  const catalogYuan = CATALOG_YUAN[productId]?.storageYuan?.[storage];
  if (catalogYuan != null) {
    return catalogYuan;
  }

  return baseYuan;
}

function mapRowToProduct(
  row: ProductRow,
  storageRows: StorageRow[],
  colors: string[],
  config: PricingConfig,
  filterSlugs: string[]
): Product {
  const shipping = productShippingFromRow(row);
  const resolvedFilterSlugs =
    filterSlugs.length > 0
      ? filterSlugs
      : row.filter_slug
        ? [row.filter_slug]
        : [];
  const primaryFilterSlug =
    row.filter_slug ?? primaryConditionFilterSlug(resolvedFilterSlugs) ?? undefined;
  const baseYuan = row.yuan_cost != null ? Number(row.yuan_cost) : null;
  const storageOptions: StorageOption[] | undefined =
    storageRows.length > 0
      ? storageRows.map((option) => {
          const yuan = storageOptionYuanCost(
            row.id,
            option.storage,
            option.yuan_cost,
            baseYuan
          );
          return {
            storage: option.storage,
            price: resolvePrice(yuan, option.price, config, shipping),
          };
        })
      : undefined;

  const listingPrice =
    storageOptions?.[0]?.price ?? resolvePrice(baseYuan, row.price, config, shipping);

  return {
    id: row.id,
    slug: CATALOG_SLUGS[row.id] ?? row.slug ?? slugForProductId(row.id, row.name),
    name: resolveProductDisplayName(row.name, primaryFilterSlug, resolvedFilterSlugs),
    price: listingPrice,
    originalPrice: row.original_price ?? undefined,
    image: row.image,
    badge: row.badge ?? undefined,
    description: row.description,
    features: row.features,
    specifications: row.specifications,
    storageOptions,
    colorOptions: colors.length > 0 ? colors : undefined,
    filterSlug: primaryFilterSlug,
    filterSlugs: resolvedFilterSlugs.length > 0 ? resolvedFilterSlugs : undefined,
  };
}

export async function fetchProductsFromDb(): Promise<Product[]> {
  const config = await fetchPricingConfig();
  const productRows = await fetchAllProductRows();

  if (productRows.length === 0) return [];

  const productIds = productRows.map((row) => row.id);

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    ORDER BY product_id ASC, sort_order ASC
  `;

  const colorsByProduct = await fetchColorsByProductIds(productIds);
  const filtersByProduct = await fetchFilterSlugsByProductIds(productIds);

  const storageByProduct = new Map<string, StorageRow[]>();
  for (const option of storageRows) {
    const list = storageByProduct.get(option.product_id) ?? [];
    list.push(option);
    storageByProduct.set(option.product_id, list);
  }

  return productRows.map((row) =>
    mapRowToProduct(
      row,
      storageByProduct.get(row.id) ?? [],
      colorsByProduct.get(row.id) ?? [],
      config,
      filtersByProduct.get(row.id) ?? []
    )
  );
}

export async function fetchProductByIdFromDb(id: string): Promise<Product | undefined> {
  const config = await fetchPricingConfig();
  const row = await fetchProductRowById(id);
  if (!row) return undefined;

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    WHERE product_id = ${id}
    ORDER BY sort_order ASC
  `;

  const colors = await fetchColorsForProduct(id);
  const filterSlugs = await fetchFilterSlugsByProductIds([id]).then(
    (map) => map.get(id) ?? []
  );

  return mapRowToProduct(row, storageRows, colors, config, filterSlugs);
}

export async function fetchProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  const config = await fetchPricingConfig();
  const row = await fetchProductRowBySlug(slug);

  if (!row) {
    const catalogId = catalogProductIdForSlug(slug);
    if (catalogId) {
      return fetchProductByIdFromDb(catalogId);
    }
    return undefined;
  }

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    WHERE product_id = ${row.id}
    ORDER BY sort_order ASC
  `;

  const colors = await fetchColorsForProduct(row.id);
  const filterSlugs = await fetchFilterSlugsByProductIds([row.id]).then(
    (map) => map.get(row.id) ?? []
  );

  return mapRowToProduct(row, storageRows, colors, config, filterSlugs);
}

export interface SeedProductInput extends Omit<Product, "slug"> {
  slug?: string;
  filterSlug?: string;
  yuanCost?: number;
  storageYuan?: Record<string, number>;
}

export async function upsertCatalogProducts(products: SeedProductInput[]): Promise<void> {
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    const slug = product.slug || slugForProductId(product.id, product.name);
    await sql.query(
      `INSERT INTO products (
        id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge, description,
        features, specifications, sort_order, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12::jsonb, $13, NOW())
      ON CONFLICT (id) DO UPDATE SET
        slug = EXCLUDED.slug,
        filter_slug = EXCLUDED.filter_slug,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        yuan_cost = EXCLUDED.yuan_cost,
        original_price = EXCLUDED.original_price,
        image = EXCLUDED.image,
        badge = EXCLUDED.badge,
        description = EXCLUDED.description,
        features = EXCLUDED.features,
        specifications = EXCLUDED.specifications,
        sort_order = EXCLUDED.sort_order,
        updated_at = NOW()`,
      [
        product.id,
        slug,
        product.filterSlug ?? null,
        product.name,
        product.price,
        product.yuanCost ?? null,
        product.originalPrice ?? null,
        product.image,
        product.badge ?? null,
        product.description,
        JSON.stringify(product.features),
        JSON.stringify(product.specifications),
        index,
      ]
    );

    if (product.storageOptions?.length) {
      await sql`DELETE FROM product_storage_options WHERE product_id = ${product.id}`;
      for (let optionIndex = 0; optionIndex < product.storageOptions.length; optionIndex += 1) {
        const option = product.storageOptions[optionIndex];
        const yuanCost = product.storageYuan?.[option.storage] ?? product.yuanCost ?? null;
        await sql.query(
          `INSERT INTO product_storage_options (product_id, storage, price, yuan_cost, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, option.storage, option.price, yuanCost, optionIndex]
        );
      }
    }
  }
}

export async function fetchAdminProducts(): Promise<AdminProductRecord[]> {
  const config = await fetchPricingConfig();
  const rows = await fetchAllProductRows();

  if (rows.length === 0) return [];

  const productIds = rows.map((row) => row.id);
  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    ORDER BY product_id ASC, sort_order ASC
  `;

  const storageByProduct = new Map<string, StorageRow[]>();
  for (const option of storageRows) {
    const list = storageByProduct.get(option.product_id) ?? [];
    list.push(option);
    storageByProduct.set(option.product_id, list);
  }

  const colorsByProduct = await fetchColorsByProductIds(productIds);
  const filtersByProduct = await fetchFilterSlugsByProductIds(productIds);

  return rows.map((row) => {
    const yuanCost = row.yuan_cost != null ? Number(row.yuan_cost) : null;
    const shipping = productShippingFromRow(row);
    const options = storageByProduct.get(row.id) ?? [];
    const filterSlugs =
      filtersByProduct.get(row.id) ?? (row.filter_slug ? [row.filter_slug] : []);
    const primaryFilterSlug =
      row.filter_slug ?? primaryConditionFilterSlug(filterSlugs) ?? null;
    const firstOption = options[0];
    const listPrice = firstOption
      ? resolvePrice(
          firstOption.yuan_cost != null ? Number(firstOption.yuan_cost) : yuanCost,
          firstOption.price,
          config,
          shipping
        )
      : resolvePrice(yuanCost, row.price, config, shipping);
    return {
      id: row.id,
      slug: row.slug ?? slugForProductId(row.id, row.name),
      name: resolveProductDisplayName(row.name, primaryFilterSlug, filterSlugs),
      yuanCost,
      price: listPrice,
      filterSlug: primaryFilterSlug,
      filterSlugs,
      image: row.image,
      description: row.description,
      badge: row.badge,
      storage: row.specifications?.Storage ?? null,
      features: row.features ?? [],
      specifications: row.specifications ?? {},
      chinaShippingYuan: shipping.chinaShippingYuan,
      internationalShippingNgn: shipping.internationalShippingNgn,
      localDeliveryNgn: shipping.localDeliveryNgn,
      storageVariants: options.map((option) => ({
        storage: option.storage,
        yuan:
          storageOptionYuanCost(row.id, option.storage, option.yuan_cost, yuanCost) ?? yuanCost ?? 0,
      })),
      colors: colorsByProduct.get(row.id) ?? [],
    };
  });
}

/** @deprecated Use fetchAdminProducts instead. */
export async function fetchAdminProductSummaries(): Promise<
  Array<{
    id: string;
    name: string;
    yuanCost: number | null;
    price: number;
    filterSlug: string | null;
    colors: string[];
  }>
> {
  const products = await fetchAdminProducts();
  return products.map(({ id, name, yuanCost, price, filterSlug, colors }) => ({
    id,
    name,
    yuanCost,
    price,
    filterSlug,
    colors,
  }));
}

export interface CreateProductInput {
  name: string;
  yuanCost?: number;
  image: string;
  description: string;
  filterSlugs: string[];
  slug?: string;
  badge?: string;
  storage?: string;
  colors?: string[];
  features?: string[];
  specifications?: Record<string, string>;
  storageVariants?: Array<{ storage: string; yuan: number }>;
  chinaShippingYuan?: ChinaShippingYuan;
  internationalShippingNgn?: InternationalShippingNgn;
  localDeliveryNgn?: LocalDeliveryNgn;
}

export interface AdminProductRecord {
  id: string;
  slug: string;
  name: string;
  yuanCost: number | null;
  price: number;
  filterSlug: string | null;
  filterSlugs: string[];
  image: string;
  description: string;
  badge: string | null;
  storage: string | null;
  features: string[];
  specifications: Record<string, string>;
  chinaShippingYuan: number;
  internationalShippingNgn: number;
  localDeliveryNgn: number;
  storageVariants: Array<{ storage: string; yuan: number }>;
  colors: string[];
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "slug" | "badge">> & {
  badge?: string | null;
};

async function nextProductId(): Promise<string> {
  const { rows } = await sql<{ next_id: number }>`
    SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 AS next_id
    FROM products
    WHERE id ~ '^[0-9]+$'
  `;
  return String(rows[0]?.next_id ?? 1);
}

async function nextSortOrder(): Promise<number> {
  const { rows } = await sql<{ next_order: number }>`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM products
  `;
  return rows[0]?.next_order ?? 0;
}

async function uniqueSlug(baseSlug: string, excludeProductId?: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { rows } = excludeProductId
      ? await sql<{ id: string }>`
          SELECT id FROM products WHERE slug = ${slug} AND id != ${excludeProductId} LIMIT 1
        `
      : await sql<{ id: string }>`
          SELECT id FROM products WHERE slug = ${slug} LIMIT 1
        `;
    if (rows.length === 0) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function buildProductSpecs(input: {
  storage?: string;
  productName?: string;
}): Record<string, string> {
  const isIphone = Boolean(input.productName?.toLowerCase().includes("iphone"));
  return {
    ...(input.storage ? { Storage: input.storage } : {}),
    ...(isIphone ? { "Battery health": BATTERY_HEALTH_SPEC } : {}),
  };
}

function resolveProductSpecifications(input: {
  specifications?: Record<string, string>;
  storage?: string;
  productName: string;
  existing?: Record<string, string>;
}): Record<string, string> {
  if (input.specifications !== undefined) {
    return mergeSpecificationsWithStorage(input.specifications, input.storage);
  }

  if (input.existing && Object.keys(input.existing).length > 0) {
    return mergeSpecificationsWithStorage(input.existing, input.storage);
  }

  return buildProductSpecs({ storage: input.storage, productName: input.productName });
}

function resolveStorageVariants(input: {
  yuanCost?: number;
  storage?: string;
  storageVariants?: Array<{ storage: string; yuan: number }>;
}): Array<{ storage: string; yuan: number }> {
  if (input.storageVariants !== undefined) {
    if (input.storageVariants.length > 0) {
      return input.storageVariants;
    }
    const storage = input.storage?.trim();
    if (storage && input.yuanCost != null && input.yuanCost > 0) {
      return [{ storage, yuan: input.yuanCost }];
    }
    return [];
  }

  const storage = input.storage?.trim();
  if (storage && input.yuanCost != null && input.yuanCost > 0) {
    return [{ storage, yuan: input.yuanCost }];
  }

  return [];
}

function resolvePricingFromInput(input: {
  yuanCost?: number;
  storage?: string;
  storageVariants?: Array<{ storage: string; yuan: number }>;
}): {
  storageVariants: Array<{ storage: string; yuan: number }>;
  baseYuan: number;
  storageLabel?: string;
} {
  const useVariantsOnly =
    input.storageVariants !== undefined && input.storageVariants.length > 0;

  const storageVariants = resolveStorageVariants({
    yuanCost: input.yuanCost,
    storage: useVariantsOnly ? undefined : input.storage,
    storageVariants: input.storageVariants,
  });

  const baseYuan = storageVariants[0]?.yuan ?? input.yuanCost;
  if (baseYuan == null || !Number.isFinite(baseYuan) || baseYuan <= 0) {
    throw new Error("INVALID_YUAN");
  }

  return {
    storageVariants,
    baseYuan,
    storageLabel: storageVariants[0]?.storage ?? (input.storage?.trim() || undefined),
  };
}

interface PersistProductRowFields {
  productId: string;
  slug: string;
  primaryFilterSlug: string | null;
  name: string;
  price: number;
  yuanCost: number;
  image: string;
  badge: string | null;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  shipping: ProductShippingCosts;
}

/** UPDATE with shipping columns; retries after schema migration, then falls back like reads. */
async function persistAdminProductRowUpdate(fields: PersistProductRowFields): Promise<void> {
  const {
    productId,
    slug,
    primaryFilterSlug,
    name,
    price,
    yuanCost,
    image,
    badge,
    description,
    features,
    specifications,
    shipping,
  } = fields;

  const coreParams = [
    productId,
    slug,
    primaryFilterSlug,
    name,
    price,
    yuanCost,
    image,
    badge,
    description,
    JSON.stringify(features),
    JSON.stringify(specifications),
  ];

  const runFullUpdate = () =>
    sql.query(
      `UPDATE products SET
        slug = $2,
        filter_slug = $3,
        name = $4,
        price = $5,
        yuan_cost = $6,
        image = $7,
        badge = $8,
        description = $9,
        features = $10::jsonb,
        specifications = $11::jsonb,
        china_shipping_yuan = $12,
        international_shipping_ngn = $13,
        local_delivery_ngn = $14,
        updated_at = NOW()
      WHERE id = $1`,
      [
        ...coreParams,
        shipping.chinaShippingYuan,
        shipping.internationalShippingNgn,
        shipping.localDeliveryNgn,
      ]
    );

  const runIntlShippingUpdate = () =>
    sql.query(
      `UPDATE products SET
        slug = $2,
        filter_slug = $3,
        name = $4,
        price = $5,
        yuan_cost = $6,
        image = $7,
        badge = $8,
        description = $9,
        features = $10::jsonb,
        specifications = $11::jsonb,
        china_shipping_yuan = $12,
        international_shipping_ngn = $13,
        updated_at = NOW()
      WHERE id = $1`,
      [...coreParams, shipping.chinaShippingYuan, shipping.internationalShippingNgn]
    );

  const runCoreUpdate = () =>
    sql.query(
      `UPDATE products SET
        slug = $2,
        filter_slug = $3,
        name = $4,
        price = $5,
        yuan_cost = $6,
        image = $7,
        badge = $8,
        description = $9,
        features = $10::jsonb,
        specifications = $11::jsonb,
        updated_at = NOW()
      WHERE id = $1`,
      coreParams
    );

  let lastError: unknown;
  try {
    await runFullUpdate();
    return;
  } catch (error) {
    lastError = error;
    if (!isMissingShippingColumnsError(error)) throw error;
  }

  console.warn(
    "[products] shipping columns missing on update; applying schema and retrying.",
    getPostgresErrorMessage(lastError)
  );
  await ensureCatalogSchema();

  try {
    await runFullUpdate();
    return;
  } catch (error) {
    lastError = error;
    if (!isMissingShippingColumnsError(error)) throw error;
  }

  const message = (getPostgresErrorMessage(lastError) ?? "").toLowerCase();
  if (message.includes("local_delivery_ngn")) {
    console.warn(
      "[products] local_delivery_ngn still missing; updating without that column.",
      getPostgresErrorMessage(lastError)
    );
    await runIntlShippingUpdate();
    return;
  }

  console.warn(
    "[products] shipping columns still missing; updating core product fields only.",
    getPostgresErrorMessage(lastError)
  );
  await runCoreUpdate();
}

async function replaceProductStorageOptions(
  productId: string,
  variants: Array<{ storage: string; yuan: number }>,
  config: PricingConfig,
  shipping: ProductShippingCosts
): Promise<void> {
  await ensureCatalogSchema();

  const normalized = finalizeStorageVariantsForSave(variants);

  await sql`DELETE FROM product_storage_options WHERE product_id = ${productId}`;

  for (let index = 0; index < normalized.length; index += 1) {
    const variant = normalized[index];
    const variantPrice = priceFromYuan(variant.yuan, config, shipping);
    await sql`
      INSERT INTO product_storage_options (product_id, storage, price, yuan_cost, sort_order)
      VALUES (
        ${productId},
        ${variant.storage},
        ${variantPrice},
        ${variant.yuan},
        ${index}
      )
    `;
  }

  const { rows } = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count
    FROM product_storage_options
    WHERE product_id = ${productId}
  `;

  if ((rows[0]?.count ?? 0) !== normalized.length) {
    throw new Error("STORAGE_VARIANT_SYNC_FAILED");
  }
}

async function syncStorageOptionPrices(
  productId: string,
  yuanCost: number,
  config: PricingConfig,
  shipping: ProductShippingCosts
): Promise<void> {
  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    WHERE product_id = ${productId}
    ORDER BY sort_order ASC
  `;

  if (storageRows.length === 0) return;

  const variants = storageRows.map((option) => ({
    storage: option.storage,
    yuan:
      storageOptionYuanCost(productId, option.storage, option.yuan_cost, yuanCost) ?? yuanCost,
  }));
  await replaceProductStorageOptions(productId, variants, config, shipping);
}

export async function createAdminProduct(input: CreateProductInput): Promise<{
  id: string;
  slug: string;
  name: string;
  yuanCost: number;
  price: number;
  filterSlug: string;
  filterSlugs: string[];
  colors: string[];
}> {
  const config = await fetchPricingConfig();
  const id = await nextProductId();
  const sortOrder = await nextSortOrder();
  const filterSlugs = Array.from(
    new Set(input.filterSlugs.map((slug) => slug.trim()).filter(Boolean))
  );
  if (filterSlugs.length === 0) {
    throw new Error("INVALID_FILTER");
  }
  const primaryFilterSlug =
    primaryConditionFilterSlug(filterSlugs) ?? filterSlugs[0] ?? "clean";
  const name = applyConditionProductName(input.name, primaryFilterSlug);
  const baseSlug = input.slug?.trim() || slugifyProductName(name);
  const slug = await uniqueSlug(baseSlug);

  const pricing = resolvePricingFromInput({
    yuanCost: input.yuanCost,
    storage: input.storage,
    storageVariants: input.storageVariants,
  });
  const { storageVariants, baseYuan, storageLabel: storage } = pricing;
  const shipping =
    input.chinaShippingYuan != null &&
    input.internationalShippingNgn != null &&
    input.localDeliveryNgn != null
      ? {
          chinaShippingYuan: input.chinaShippingYuan,
          internationalShippingNgn: input.internationalShippingNgn,
          localDeliveryNgn: input.localDeliveryNgn,
        }
      : defaultShippingForProductName(name);
  const price = priceFromYuan(baseYuan, config, shipping);
  const isNew = isNewProductFromFilterSlugs(filterSlugs);
  const isIphone = /iphone/i.test(name);
  let features =
    input.features?.map((feature) => feature.trim()).filter(Boolean) ??
    (isNew
      ? ["Brand new product", "Inspected, tested, and certified"]
      : isIphone
        ? [BATTERY_HEALTH_FEATURE, "UK Grade A condition with accessories included", "Inspected, tested, and certified"]
        : ["UK Grade A condition with accessories included", "Inspected, tested, and certified"]);
  let specifications = resolveProductSpecifications({
    specifications: input.specifications,
    storage,
    productName: name,
  });
  ({ features, specifications } = ensureIphoneProductCopy({
    name,
    features,
    specifications,
  }));

  await sql.query(
    `INSERT INTO products (
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge, description,
      features, specifications, sort_order, china_shipping_yuan, international_shipping_ngn,
      local_delivery_ngn, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, $14, $15, NOW())`,
    [
      id,
      slug,
      primaryFilterSlug,
      name,
      price,
      baseYuan,
      input.image.trim(),
      input.badge?.trim() || null,
      input.description.trim(),
      JSON.stringify(features),
      JSON.stringify(specifications),
      sortOrder,
      shipping.chinaShippingYuan,
      shipping.internationalShippingNgn,
      shipping.localDeliveryNgn,
    ]
  );

  if (storageVariants.length > 0) {
    await replaceProductStorageOptions(id, storageVariants, config, shipping);
  }

  await replaceProductFilterSlugs(id, filterSlugs);

  const colors = input.colors ?? [];
  if (colors.length > 0) {
    const { replaceProductColors } = await import("@/lib/db/colors-repository");
    await replaceProductColors(id, colors);
  }

  return {
    id,
    slug,
    name,
    yuanCost: baseYuan,
    price,
    filterSlug: primaryFilterSlug,
    filterSlugs,
    colors,
  };
}

export async function updateAdminProduct(
  productId: string,
  input: UpdateProductInput
): Promise<AdminProductRecord> {
  const config = await fetchPricingConfig();
  const existing = await fetchProductRowById(productId);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const existingFilterSlugs = await fetchFilterSlugsByProductIds([productId]).then(
    (map) => map.get(productId) ?? (existing.filter_slug ? [existing.filter_slug] : [])
  );
  const nextFilterSlugs =
    input.filterSlugs !== undefined
      ? Array.from(new Set(input.filterSlugs.map((slug) => slug.trim()).filter(Boolean)))
      : existingFilterSlugs;

  if (input.filterSlugs !== undefined && nextFilterSlugs.length === 0) {
    throw new Error("INVALID_FILTER");
  }

  const primaryFilterSlug =
    primaryConditionFilterSlug(nextFilterSlugs) ??
    nextFilterSlugs[0] ??
    existing.filter_slug ??
    "clean";

  let name: string;
  const baseName =
    input.name !== undefined
      ? stripConditionSuffix(input.name.trim())
      : stripConditionSuffix(existing.name);
  name = applyConditionProductName(baseName, primaryFilterSlug);

  const image = input.image !== undefined ? input.image.trim() : existing.image;
  const description =
    input.description !== undefined ? input.description.trim() : existing.description;
  const badge =
    input.badge !== undefined ? input.badge?.trim() || null : existing.badge;
  let features = input.features ?? existing.features ?? [];

  const shouldSyncStorage =
    input.storageVariants !== undefined ||
    input.storage !== undefined ||
    input.yuanCost !== undefined;

  const shouldSyncShipping =
    input.chinaShippingYuan !== undefined ||
    input.internationalShippingNgn !== undefined ||
    input.localDeliveryNgn !== undefined;

  let storageVariantsForSave: Array<{ storage: string; yuan: number }> | undefined;
  let yuanCost =
    input.yuanCost ??
    (existing.yuan_cost != null ? Number(existing.yuan_cost) : undefined);
  let storageInput =
    input.storage !== undefined
      ? input.storage?.trim() || undefined
      : existing.specifications?.Storage;

  if (shouldSyncStorage) {
    if (input.storageVariants !== undefined && input.storageVariants.length > 0) {
      storageVariantsForSave = finalizeStorageVariantsForSave(input.storageVariants);
      yuanCost = storageVariantsForSave[0]?.yuan;
      storageInput = storageVariantsForSave[0]?.storage;
    } else {
      const pricing = resolvePricingFromInput({
        yuanCost,
        storage: storageInput,
        storageVariants: input.storageVariants,
      });
      storageVariantsForSave = pricing.storageVariants;
      yuanCost = pricing.baseYuan;
      storageInput = pricing.storageLabel;
    }
  }

  if (yuanCost == null || !Number.isFinite(yuanCost) || yuanCost <= 0) {
    throw new Error("INVALID_YUAN");
  }

  const shipping = productShippingFromRow({
    china_shipping_yuan:
      input.chinaShippingYuan ?? existing.china_shipping_yuan ?? undefined,
    international_shipping_ngn:
      input.internationalShippingNgn ?? existing.international_shipping_ngn ?? undefined,
    local_delivery_ngn:
      input.localDeliveryNgn ?? existing.local_delivery_ngn ?? undefined,
    name,
  });

  const storage = storageInput;
  const price = priceFromYuan(yuanCost, config, shipping);
  let specifications = resolveProductSpecifications({
    specifications: input.specifications,
    storage,
    productName: name,
    existing: existing.specifications,
  });
  ({ features, specifications } = ensureIphoneProductCopy({
    name,
    features,
    specifications,
  }));

  const previousBaseName = stripConditionSuffix(existing.name);
  const nextBaseName = stripConditionSuffix(name);
  const slug =
    CATALOG_SLUGS[productId] != null
      ? CATALOG_SLUGS[productId]
      : nextBaseName !== previousBaseName
        ? await uniqueSlug(slugifyProductName(name), productId)
        : existing.slug ?? (await uniqueSlug(slugifyProductName(name), productId));

  if (shouldSyncStorage) {
    await replaceProductStorageOptions(
      productId,
      storageVariantsForSave ?? [],
      config,
      shipping
    );
  } else if (shouldSyncShipping) {
    const { rows: storageRows } = await sql<StorageRow>`
      SELECT product_id, storage, price, yuan_cost, sort_order
      FROM product_storage_options
      WHERE product_id = ${productId}
      ORDER BY sort_order ASC
    `;

    if (storageRows.length > 0) {
      const variants = storageRows.map((option) => ({
        storage: option.storage,
        yuan:
          storageOptionYuanCost(productId, option.storage, option.yuan_cost, yuanCost) ?? yuanCost,
      }));
      await replaceProductStorageOptions(productId, variants, config, shipping);
    }
  }

  if (input.filterSlugs !== undefined) {
    await replaceProductFilterSlugs(productId, nextFilterSlugs);
  }

  await persistAdminProductRowUpdate({
    productId,
    slug,
    primaryFilterSlug: primaryFilterSlug || null,
    name,
    price,
    yuanCost,
    image,
    badge,
    description,
    features,
    specifications,
    shipping,
  });

  if (input.colors !== undefined) {
    const { replaceProductColors } = await import("@/lib/db/colors-repository");
    await replaceProductColors(productId, input.colors);
  }

  await syncStorageOptionPrices(productId, yuanCost, config, shipping);

  const products = await fetchAdminProducts();
  const updated = products.find((product) => product.id === productId);
  if (!updated) {
    throw new Error("NOT_FOUND");
  }

  return updated;
}

/** Restore full specifications from catalog-seed for known product ids. */
export async function backfillCatalogSpecifications(): Promise<number> {
  const catalog = buildCatalogProducts();
  let updated = 0;

  for (const seedProduct of catalog) {
    const productId = seedProduct.id;
    const { rows } = await sql<{ id: string }>`
      SELECT id FROM products WHERE id = ${productId} LIMIT 1
    `;
    if (!rows[0]) continue;

    const { rows: storageRows } = await sql<{ id: number; storage: string }>`
      SELECT id, storage
      FROM product_storage_options
      WHERE product_id = ${productId}
      ORDER BY sort_order ASC
    `;

    if (seedProduct.storageOptions?.length) {
      for (let index = 0; index < seedProduct.storageOptions.length; index += 1) {
        const seedOption = seedProduct.storageOptions[index];
        const dbOption = storageRows[index];
        if (dbOption && dbOption.storage !== seedOption.storage) {
          await sql.query(`UPDATE product_storage_options SET storage = $1 WHERE id = $2`, [
            seedOption.storage,
            dbOption.id,
          ]);
        }
      }
    }

    const primaryStorage =
      seedProduct.storageOptions?.[0]?.storage ??
      storageRows[0]?.storage ??
      seedProduct.specifications.Storage;

    const specifications = mergeSpecificationsWithStorage(
      seedProduct.specifications,
      primaryStorage
    );

    await sql.query(
      `UPDATE products SET specifications = $1::jsonb, updated_at = NOW() WHERE id = $2`,
      [JSON.stringify(specifications), productId]
    );
    updated += 1;
  }

  return updated;
}

/** Add Unlocked to features and Connectivity for every iPhone row in Postgres. */
export async function backfillIphoneUnlockedCopy(): Promise<number> {
  const { rows } = await sql<{
    id: string;
    name: string;
    features: string[] | null;
    specifications: Record<string, string> | null;
  }>`
    SELECT id, name, features, specifications
    FROM products
    WHERE name ILIKE '%iphone%'
  `;

  let updated = 0;

  for (const row of rows) {
    const features = Array.isArray(row.features) ? [...row.features] : [];
    const specifications =
      row.specifications && typeof row.specifications === "object"
        ? { ...row.specifications }
        : {};
    const next = ensureIphoneProductCopy({
      name: row.name,
      features,
      specifications,
    });

    const featuresChanged = JSON.stringify(next.features) !== JSON.stringify(features);
    const specificationsChanged =
      JSON.stringify(next.specifications) !== JSON.stringify(specifications);

    if (!featuresChanged && !specificationsChanged) continue;

    await sql.query(
      `UPDATE products
       SET features = $1::jsonb, specifications = $2::jsonb, updated_at = NOW()
       WHERE id = $3`,
      [JSON.stringify(next.features), JSON.stringify(next.specifications), row.id]
    );
    updated += 1;
  }

  return updated;
}

export async function deleteAdminProduct(productId: string): Promise<{ slug: string | null }> {
  const existing = await fetchProductRowById(productId);
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  // Explicit cleanup before row delete (FK cascades should cover this; keeps deletes reliable).
  await sql`DELETE FROM product_filter_assignments WHERE product_id = ${productId}`;
  await sql`DELETE FROM product_storage_options WHERE product_id = ${productId}`;
  await sql`DELETE FROM product_colors WHERE product_id = ${productId}`;
  await sql`DELETE FROM products WHERE id = ${productId}`;

  const { rows } = await sql<{ id: string }>`
    SELECT id FROM products WHERE id = ${productId} LIMIT 1
  `;
  if (rows[0]) {
    throw new Error("DELETE_FAILED");
  }

  return { slug: existing.slug };
}

export interface InsertProductIfAbsentInput {
  id: string;
  slug: string;
  name: string;
  yuanCost: number;
  image: string;
  badge?: string | null;
  description: string;
  features: string[];
  specifications: Record<string, string>;
  filterSlug: string;
  colors: string[];
}

export type InsertProductIfAbsentResult = "inserted" | "skipped";

/** Insert a catalog product only when its id is not already in Postgres. */
export async function insertProductIfAbsent(
  input: InsertProductIfAbsentInput
): Promise<InsertProductIfAbsentResult> {
  const { rows } = await sql<{ id: string }>`
    SELECT id FROM products WHERE id = ${input.id} LIMIT 1
  `;
  if (rows.length > 0) {
    return "skipped";
  }

  const config = await fetchPricingConfig();
  const shipping = defaultShippingForProductName(input.name);
  const price = priceFromYuan(input.yuanCost, config, shipping);
  const sortOrder = await nextSortOrder();

  await sql.query(
    `INSERT INTO products (
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge, description,
      features, specifications, sort_order, china_shipping_yuan, international_shipping_ngn,
      local_delivery_ngn, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13, $14, $15, NOW())`,
    [
      input.id,
      input.slug,
      input.filterSlug,
      input.name,
      price,
      input.yuanCost,
      input.image,
      input.badge ?? null,
      input.description,
      JSON.stringify(input.features),
      JSON.stringify(input.specifications),
      sortOrder,
      shipping.chinaShippingYuan,
      shipping.internationalShippingNgn,
      shipping.localDeliveryNgn,
    ]
  );

  await replaceProductFilterSlugs(input.id, [input.filterSlug]);

  if (input.colors.length > 0) {
    const { replaceProductColors } = await import("@/lib/db/colors-repository");
    await replaceProductColors(input.id, input.colors);
  }

  return "inserted";
}

/** Add iPhone 15 and iPhone 17 rows only; existing products are left unchanged. */
export async function insertNewIphoneProductsIfAbsent(): Promise<
  Array<{ id: string; name: string; result: InsertProductIfAbsentResult; price?: number }>
> {
  const { buildNewIphoneProducts, NEW_IPHONE_PRODUCT_META } = await import(
    "@/lib/new-iphone-products"
  );
  const products = buildNewIphoneProducts();
  const results: Array<{ id: string; name: string; result: InsertProductIfAbsentResult; price?: number }> =
    [];

  for (const product of products) {
    const meta = NEW_IPHONE_PRODUCT_META[product.id];
    if (!meta) continue;

    const result = await insertProductIfAbsent({
      id: product.id,
      slug: meta.slug,
      name: product.name,
      yuanCost: meta.yuan,
      image: product.image,
      badge: product.badge ?? null,
      description: product.description,
      features: product.features,
      specifications: product.specifications,
      filterSlug: meta.filterSlug,
      colors: meta.colors,
    });

    results.push({
      id: product.id,
      name: product.name,
      result,
      price: result === "inserted" ? product.price : undefined,
    });
  }

  return results;
}

import { sql } from "@/lib/db/client";
import { slugForProductId, slugifyProductName } from "@/lib/product-slug";
import { fetchColorsByProductIds, fetchColorsForProduct } from "@/lib/db/colors-repository";
import { fetchPricingConfig } from "@/lib/db/pricing-config-repository";
import { priceFromYuan } from "@/lib/pricing";
import {
  BATTERY_HEALTH_FEATURE,
  BATTERY_HEALTH_SPEC,
} from "@/lib/device-quality-copy";
import type { Product, StorageOption } from "@/lib/product-utils";
import {
  isNewProductFilter,
  normalizeProductName as applyConditionProductName,
  stripConditionSuffix,
} from "@/lib/product-condition-suffix";

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
}

interface StorageRow {
  product_id: string;
  storage: string;
  price: number;
  yuan_cost: string | null;
  sort_order: number;
}

function resolvePrice(yuanCost: number | null, storedPrice: number, config: Awaited<ReturnType<typeof fetchPricingConfig>>): number {
  if (yuanCost != null && !Number.isNaN(yuanCost)) {
    return priceFromYuan(yuanCost, config);
  }
  return storedPrice;
}

function mapRowToProduct(
  row: ProductRow,
  storageRows: StorageRow[],
  colors: string[],
  config: Awaited<ReturnType<typeof fetchPricingConfig>>
): Product {
  const baseYuan = row.yuan_cost != null ? Number(row.yuan_cost) : null;
  const storageOptions: StorageOption[] | undefined =
    storageRows.length > 0
      ? storageRows.map((option) => {
          const yuan = option.yuan_cost != null ? Number(option.yuan_cost) : baseYuan;
          return {
            storage: option.storage,
            price: resolvePrice(yuan, option.price, config),
          };
        })
      : undefined;

  return {
    id: row.id,
    slug: row.slug ?? slugForProductId(row.id, row.name),
    name: row.name,
    price: resolvePrice(baseYuan, row.price, config),
    originalPrice: row.original_price ?? undefined,
    image: row.image,
    badge: row.badge ?? undefined,
    description: row.description,
    features: row.features,
    specifications: row.specifications,
    storageOptions,
    colorOptions: colors.length > 0 ? colors : undefined,
    filterSlug: row.filter_slug ?? undefined,
  };
}

export async function fetchProductsFromDb(): Promise<Product[]> {
  const config = await fetchPricingConfig();

  const { rows: productRows } = await sql<ProductRow>`
    SELECT
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
      description, features, specifications, sort_order
    FROM products
    ORDER BY sort_order ASC, id ASC
  `;

  if (productRows.length === 0) return [];

  const productIds = productRows.map((row) => row.id);

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    ORDER BY product_id ASC, sort_order ASC
  `;

  const colorsByProduct = await fetchColorsByProductIds(productIds);

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
      config
    )
  );
}

export async function fetchProductByIdFromDb(id: string): Promise<Product | undefined> {
  const config = await fetchPricingConfig();

  const { rows } = await sql<ProductRow>`
    SELECT
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
      description, features, specifications, sort_order
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return undefined;

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    WHERE product_id = ${id}
    ORDER BY sort_order ASC
  `;

  const colors = await fetchColorsForProduct(id);

  return mapRowToProduct(row, storageRows, colors, config);
}

export async function fetchProductBySlugFromDb(slug: string): Promise<Product | undefined> {
  const config = await fetchPricingConfig();

  const { rows } = await sql<ProductRow>`
    SELECT
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
      description, features, specifications, sort_order
    FROM products
    WHERE slug = ${slug}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return undefined;

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, yuan_cost, sort_order
    FROM product_storage_options
    WHERE product_id = ${row.id}
    ORDER BY sort_order ASC
  `;

  const colors = await fetchColorsForProduct(row.id);

  return mapRowToProduct(row, storageRows, colors, config);
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

    await sql`DELETE FROM product_storage_options WHERE product_id = ${product.id}`;

    if (product.storageOptions?.length) {
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

  const { rows } = await sql<ProductRow>`
    SELECT
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
      description, features, specifications, sort_order
    FROM products
    ORDER BY sort_order ASC, id ASC
  `;

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

  return rows.map((row) => {
    const yuanCost = row.yuan_cost != null ? Number(row.yuan_cost) : null;
    const options = storageByProduct.get(row.id) ?? [];
    return {
      id: row.id,
      slug: row.slug ?? slugForProductId(row.id, row.name),
      name: row.name,
      yuanCost,
      price: resolvePrice(yuanCost, row.price, config),
      filterSlug: row.filter_slug,
      image: row.image,
      description: row.description,
      badge: row.badge,
      storage: row.specifications?.Storage ?? null,
      features: row.features ?? [],
      storageVariants: options.map((option) => ({
        storage: option.storage,
        yuan: option.yuan_cost != null ? Number(option.yuan_cost) : yuanCost ?? 0,
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
  filterSlug: string;
  slug?: string;
  badge?: string;
  storage?: string;
  colors?: string[];
  features?: string[];
  storageVariants?: Array<{ storage: string; yuan: number }>;
}

export interface AdminProductRecord {
  id: string;
  slug: string;
  name: string;
  yuanCost: number | null;
  price: number;
  filterSlug: string | null;
  image: string;
  description: string;
  badge: string | null;
  storage: string | null;
  features: string[];
  storageVariants: Array<{ storage: string; yuan: number }>;
  colors: string[];
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "slug">>;

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

async function replaceProductStorageOptions(
  productId: string,
  variants: Array<{ storage: string; yuan: number }>,
  config: Awaited<ReturnType<typeof fetchPricingConfig>>
): Promise<void> {
  await sql`DELETE FROM product_storage_options WHERE product_id = ${productId}`;

  for (let index = 0; index < variants.length; index += 1) {
    const variant = variants[index];
    const variantPrice = priceFromYuan(variant.yuan, config);
    await sql.query(
      `INSERT INTO product_storage_options (product_id, storage, price, yuan_cost, sort_order)
       VALUES ($1, $2, $3, $4, $5)`,
      [productId, variant.storage.trim(), variantPrice, variant.yuan, index]
    );
  }
}

export async function createAdminProduct(input: CreateProductInput): Promise<{
  id: string;
  slug: string;
  name: string;
  yuanCost: number;
  price: number;
  filterSlug: string;
  colors: string[];
}> {
  const config = await fetchPricingConfig();
  const id = await nextProductId();
  const sortOrder = await nextSortOrder();
  const name = applyConditionProductName(input.name, input.filterSlug);
  const baseSlug = input.slug?.trim() || slugifyProductName(name);
  const slug = await uniqueSlug(baseSlug);

  const { rows: filterRows } = await sql`
    SELECT slug FROM product_filters WHERE slug = ${input.filterSlug} LIMIT 1
  `;
  if (filterRows.length === 0) {
    throw new Error("INVALID_FILTER");
  }

  const pricing = resolvePricingFromInput({
    yuanCost: input.yuanCost,
    storage: input.storage,
    storageVariants: input.storageVariants,
  });
  const { storageVariants, baseYuan, storageLabel: storage } = pricing;
  const price = priceFromYuan(baseYuan, config);
  const isNew = isNewProductFilter(input.filterSlug);
  const isIphone = /iphone/i.test(name);
  const features =
    input.features?.map((feature) => feature.trim()).filter(Boolean) ??
    (isNew
      ? ["Brand new product", "Inspected, tested, and certified"]
      : isIphone
        ? [BATTERY_HEALTH_FEATURE, "UK Grade A condition with accessories included", "Inspected, tested, and certified"]
        : ["UK Grade A condition with accessories included", "Inspected, tested, and certified"]);
  const specifications = buildProductSpecs({ storage, productName: name });

  await sql.query(
    `INSERT INTO products (
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge, description,
      features, specifications, sort_order, updated_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NULL, $7, $8, $9, $10::jsonb, $11::jsonb, $12, NOW())`,
    [
      id,
      slug,
      input.filterSlug,
      name,
      price,
      baseYuan,
      input.image.trim(),
      input.badge?.trim() || null,
      input.description.trim(),
      JSON.stringify(features),
      JSON.stringify(specifications),
      sortOrder,
    ]
  );

  if (storageVariants.length > 0) {
    await replaceProductStorageOptions(id, storageVariants, config);
  }

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
    filterSlug: input.filterSlug,
    colors,
  };
}

export async function updateAdminProduct(
  productId: string,
  input: UpdateProductInput
): Promise<AdminProductRecord> {
  const config = await fetchPricingConfig();

  const { rows } = await sql<ProductRow>`
    SELECT
      id, slug, filter_slug, name, price, yuan_cost, original_price, image, badge,
      description, features, specifications, sort_order
    FROM products
    WHERE id = ${productId}
    LIMIT 1
  `;

  const existing = rows[0];
  if (!existing) {
    throw new Error("NOT_FOUND");
  }

  const nextFilterSlug = input.filterSlug ?? existing.filter_slug ?? "";
  if (input.filterSlug) {
    const { rows: filterRows } = await sql`
      SELECT slug FROM product_filters WHERE slug = ${input.filterSlug} LIMIT 1
    `;
    if (filterRows.length === 0) {
      throw new Error("INVALID_FILTER");
    }
  }

  let name: string;
  if (input.name !== undefined) {
    name = applyConditionProductName(input.name, nextFilterSlug);
  } else if (input.filterSlug !== undefined && input.filterSlug !== existing.filter_slug) {
    name = applyConditionProductName(stripConditionSuffix(existing.name), nextFilterSlug);
  } else {
    name = existing.name;
  }

  const image = input.image !== undefined ? input.image.trim() : existing.image;
  const description =
    input.description !== undefined ? input.description.trim() : existing.description;
  const badge =
    input.badge !== undefined ? input.badge?.trim() || null : existing.badge;
  const features = input.features ?? existing.features ?? [];

  const shouldSyncStorage =
    input.storageVariants !== undefined ||
    input.storage !== undefined ||
    input.yuanCost !== undefined;

  let storageVariantsForSave: Array<{ storage: string; yuan: number }> | undefined;
  let yuanCost =
    input.yuanCost ??
    (existing.yuan_cost != null ? Number(existing.yuan_cost) : undefined);
  let storageInput =
    input.storage !== undefined
      ? input.storage?.trim() || undefined
      : existing.specifications?.Storage;

  if (shouldSyncStorage) {
    const useVariantsOnly =
      input.storageVariants !== undefined && input.storageVariants.length > 0;

    const pricing = resolvePricingFromInput({
      yuanCost: useVariantsOnly ? input.yuanCost : yuanCost,
      storage: useVariantsOnly ? undefined : storageInput,
      storageVariants: input.storageVariants,
    });
    storageVariantsForSave = pricing.storageVariants;
    yuanCost = pricing.baseYuan;
    storageInput = pricing.storageLabel;
  }

  if (yuanCost == null || !Number.isFinite(yuanCost) || yuanCost <= 0) {
    throw new Error("INVALID_YUAN");
  }

  const storage = storageInput;
  const price = priceFromYuan(yuanCost, config);
  const specifications = buildProductSpecs({
    storage,
    productName: name,
  });

  const slug =
    input.name !== undefined
      ? await uniqueSlug(slugifyProductName(name), productId)
      : existing.slug ?? (await uniqueSlug(slugifyProductName(name), productId));

  await sql.query(
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
    [
      productId,
      slug,
      nextFilterSlug || null,
      name,
      price,
      yuanCost,
      image,
      badge,
      description,
      JSON.stringify(features),
      JSON.stringify(specifications),
    ]
  );

  if (shouldSyncStorage) {
    await replaceProductStorageOptions(productId, storageVariantsForSave ?? [], config);
  }

  if (input.colors !== undefined) {
    const { replaceProductColors } = await import("@/lib/db/colors-repository");
    await replaceProductColors(productId, input.colors);
  }

  const products = await fetchAdminProducts();
  const updated = products.find((product) => product.id === productId);
  if (!updated) {
    throw new Error("NOT_FOUND");
  }

  return updated;
}

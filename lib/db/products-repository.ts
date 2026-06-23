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
  const config = await fetchPricingConfig();

  const { rows } = await sql<{
    id: string;
    name: string;
    price: number;
    yuan_cost: string | null;
    filter_slug: string | null;
  }>`
    SELECT id, name, price, yuan_cost, filter_slug FROM products ORDER BY sort_order ASC, id ASC
  `;

  const colorsByProduct = await fetchColorsByProductIds(rows.map((row) => row.id));

  return rows.map((row) => {
    const yuanCost = row.yuan_cost != null ? Number(row.yuan_cost) : null;
    return {
      id: row.id,
      name: row.name,
      yuanCost,
      price: resolvePrice(yuanCost, row.price, config),
      filterSlug: row.filter_slug,
      colors: colorsByProduct.get(row.id) ?? [],
    };
  });
}

export interface CreateProductInput {
  name: string;
  yuanCost: number;
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

function normalizeProductName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.endsWith("(Clean)")) return trimmed;
  return `${trimmed} (Clean)`;
}

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

async function uniqueSlug(baseSlug: string): Promise<string> {
  let slug = baseSlug;
  let suffix = 2;

  while (true) {
    const { rows } = await sql<{ id: string }>`
      SELECT id FROM products WHERE slug = ${slug} LIMIT 1
    `;
    if (rows.length === 0) return slug;
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
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
  const name = normalizeProductName(input.name);
  const baseSlug = input.slug?.trim() || slugifyProductName(name);
  const slug = await uniqueSlug(baseSlug);

  const { rows: filterRows } = await sql`
    SELECT slug FROM product_filters WHERE slug = ${input.filterSlug} LIMIT 1
  `;
  if (filterRows.length === 0) {
    throw new Error("INVALID_FILTER");
  }

  const price = priceFromYuan(input.yuanCost, config);
  const storage = input.storage?.trim() || undefined;
  const isIphone = input.filterSlug === "iphone";
  const features =
    input.features?.map((feature) => feature.trim()).filter(Boolean) ??
    (isIphone
      ? [BATTERY_HEALTH_FEATURE, "Clean condition with accessories included", "Inspected, tested, and certified"]
      : ["Clean condition with accessories included", "Inspected, tested, and certified"]);
  const specifications: Record<string, string> = {
    ...(storage ? { Storage: storage } : {}),
    ...(isIphone ? { "Battery health": BATTERY_HEALTH_SPEC } : {}),
  };

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
      input.yuanCost,
      input.image.trim(),
      input.badge?.trim() || null,
      input.description.trim(),
      JSON.stringify(features),
      JSON.stringify(specifications),
      sortOrder,
    ]
  );

  if (input.storageVariants?.length) {
    for (let index = 0; index < input.storageVariants.length; index += 1) {
      const variant = input.storageVariants[index];
      const variantPrice = priceFromYuan(variant.yuan, config);
      await sql.query(
        `INSERT INTO product_storage_options (product_id, storage, price, yuan_cost, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, variant.storage.trim(), variantPrice, variant.yuan, index]
      );
    }
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
    yuanCost: input.yuanCost,
    price,
    filterSlug: input.filterSlug,
    colors,
  };
}

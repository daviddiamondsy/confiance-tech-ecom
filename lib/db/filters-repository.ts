import { ensureProductFilterAssignmentsSchema, countProductsUsingFilter } from "@/lib/db/product-filter-assignments";
import { sql, sqlDdl } from "@/lib/db/client";
import { isPostgresErrorCode } from "@/lib/db/postgres-errors";
import { slugifyProductName } from "@/lib/product-slug";
import { normalizeProductName, stripConditionSuffix } from "@/lib/product-condition-suffix";
import type { ProductFilterTag } from "@/lib/product-filter-tags";

/** Idempotent DDL for filter tags on databases that predate product_filters. */
export async function ensureProductFiltersSchema(): Promise<void> {
  await sqlDdl`
    CREATE TABLE IF NOT EXISTS product_filters (
      slug TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sqlDdl`
    ALTER TABLE product_filters
    ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0
  `;
  await sql`
    INSERT INTO product_filters (slug, label, sort_order) VALUES
      ('new', 'New', 0),
      ('clean', 'Like New', 1)
    ON CONFLICT (slug) DO NOTHING
  `;
  await sql`
    UPDATE product_filters SET label = 'Like New' WHERE slug = 'clean'
  `;
  await sql`
    UPDATE products
    SET filter_slug = 'new'
    WHERE filter_slug = 'macbook' OR id = '11'
  `;
  await sql`
    UPDATE products
    SET filter_slug = 'clean'
    WHERE filter_slug IN ('iphone', 'samsung') OR (filter_slug IS NULL AND id != '11')
  `;
  await syncProductNamesWithFilterSlugs();
  await ensureProductFilterAssignmentsSchema();
}

/** Fix product names when filter_slug was migrated without updating condition suffix. */
export async function syncProductNamesWithFilterSlugs(): Promise<number> {
  const { rows } = await sql<{ id: string; name: string; filter_slug: string | null }>`
    SELECT id, name, filter_slug FROM products WHERE filter_slug IS NOT NULL
  `;

  let updated = 0;
  for (const row of rows) {
    const fixed = normalizeProductName(stripConditionSuffix(row.name), row.filter_slug);
    if (fixed !== row.name) {
      await sql`
        UPDATE products SET name = ${fixed}, updated_at = NOW() WHERE id = ${row.id}
      `;
      updated += 1;
    }
  }
  return updated;
}

/** Rename legacy (Clean) suffixes to (Like New) on all Grade A catalog rows. */
export async function backfillLikeNewProductNames(): Promise<number> {
  await sql`
    UPDATE product_filters SET label = 'Like New' WHERE slug = 'clean'
  `;
  return syncProductNamesWithFilterSlugs();
}

/** Adds products.filter_slug when the products table already exists. */
export async function ensureProductsFilterColumn(): Promise<void> {
  try {
    await sqlDdl`
      ALTER TABLE products
      ADD COLUMN IF NOT EXISTS filter_slug TEXT
    `;
  } catch (error) {
    if (isPostgresErrorCode(error, "42P01")) {
      return;
    }
    throw error;
  }
}

interface FilterRow {
  slug: string;
  label: string;
  sort_order: number;
}

function mapRow(row: FilterRow): ProductFilterTag {
  return { slug: row.slug, label: row.label };
}

export async function fetchProductFiltersFromDb(): Promise<ProductFilterTag[]> {
  const { rows } = await sql<FilterRow>`
    SELECT slug, label, sort_order
    FROM product_filters
    ORDER BY sort_order ASC, label ASC
  `;
  return rows.map(mapRow);
}

export async function createProductFilter(input: {
  slug: string;
  label: string;
}): Promise<ProductFilterTag> {
  const slug = input.slug.trim().toLowerCase();
  const label = input.label.trim();

  const { rows } = await sql<{ max_order: number | null }>`
    SELECT COALESCE(MAX(sort_order), -1) + 1 AS max_order FROM product_filters
  `;
  const sortOrder = rows[0]?.max_order ?? 0;

  try {
    await sql`
      INSERT INTO product_filters (slug, label, sort_order)
      VALUES (${slug}, ${label}, ${sortOrder})
    `;
  } catch (error) {
    if (isPostgresErrorCode(error, "23505")) {
      throw new Error("FILTER_EXISTS");
    }
    if (isPostgresErrorCode(error, "42P01")) {
      throw new Error("FILTERS_TABLE_MISSING");
    }
    throw error;
  }

  return { slug, label };
}

export async function updateProductFilter(
  slug: string,
  label: string
): Promise<ProductFilterTag> {
  const normalizedSlug = slug.trim().toLowerCase();
  const normalizedLabel = label.trim();

  await sql`
    UPDATE product_filters
    SET label = ${normalizedLabel}
    WHERE slug = ${normalizedSlug}
  `;

  return { slug: normalizedSlug, label: normalizedLabel };
}

export async function deleteProductFilter(slug: string): Promise<void> {
  const normalizedSlug = slug.trim().toLowerCase();

  const assignmentCount = await countProductsUsingFilter(normalizedSlug);
  if (assignmentCount > 0) {
    throw new Error("FILTER_IN_USE");
  }

  const { rows } = await sql<{ count: number }>`
    SELECT COUNT(*)::int AS count FROM products WHERE filter_slug = ${normalizedSlug}
  `;

  if ((rows[0]?.count ?? 0) > 0) {
    throw new Error("FILTER_IN_USE");
  }

  await sql`DELETE FROM product_filters WHERE slug = ${normalizedSlug}`;
}

export async function seedDefaultProductFilters(
  filters: ProductFilterTag[]
): Promise<void> {
  await ensureProductFiltersSchema();

  for (let index = 0; index < filters.length; index += 1) {
    const filter = filters[index];
    await sql`
      INSERT INTO product_filters (slug, label, sort_order)
      VALUES (${filter.slug}, ${filter.label}, ${index})
      ON CONFLICT (slug) DO NOTHING
    `;
  }
}

export function normalizeFilterSlug(value: string): string {
  return slugifyProductName(value);
}

export async function updateProductFilterSlug(
  productId: string,
  filterSlug: string | null
): Promise<void> {
  await ensureProductsFilterColumn();

  if (filterSlug) {
    const { rows } = await sql`
      SELECT slug FROM product_filters WHERE slug = ${filterSlug} LIMIT 1
    `;
    if (rows.length === 0) {
      throw new Error("INVALID_FILTER");
    }
  }

  await sql`
    UPDATE products
    SET filter_slug = ${filterSlug}, updated_at = NOW()
    WHERE id = ${productId}
  `;

  if (filterSlug) {
    const { rows } = await sql<{ name: string }>`
      SELECT name FROM products WHERE id = ${productId} LIMIT 1
    `;
    const existingName = rows[0]?.name;
    if (existingName) {
      const fixed = normalizeProductName(stripConditionSuffix(existingName), filterSlug);
      if (fixed !== existingName) {
        await sql`
          UPDATE products SET name = ${fixed}, updated_at = NOW() WHERE id = ${productId}
        `;
      }
    }
  }
}

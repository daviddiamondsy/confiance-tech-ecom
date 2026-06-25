import { sql, sqlDdl } from "@/lib/db/client";
import { isPostgresErrorCode } from "@/lib/db/postgres-errors";

export async function ensureProductFilterAssignmentsSchema(): Promise<void> {
  await sqlDdl`
    CREATE TABLE IF NOT EXISTS product_filter_assignments (
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      filter_slug TEXT NOT NULL REFERENCES product_filters(slug) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, filter_slug)
    )
  `;

  await sqlDdl`
    CREATE INDEX IF NOT EXISTS idx_product_filter_assignments_filter_slug
    ON product_filter_assignments (filter_slug)
  `;

  await sql`
    INSERT INTO product_filter_assignments (product_id, filter_slug, sort_order)
    SELECT id, filter_slug, 0
    FROM products
    WHERE filter_slug IS NOT NULL
    ON CONFLICT (product_id, filter_slug) DO NOTHING
  `;
}

export async function fetchFilterSlugsByProductIds(
  productIds: string[]
): Promise<Map<string, string[]>> {
  const result = new Map<string, string[]>();
  if (productIds.length === 0) return result;

  const { rows } = await sql.query<{
    product_id: string;
    filter_slug: string;
    sort_order: number;
  }>(
    `SELECT product_id, filter_slug, sort_order
     FROM product_filter_assignments
     WHERE product_id = ANY($1::text[])
     ORDER BY product_id ASC, sort_order ASC, filter_slug ASC`,
    [productIds]
  );

  for (const row of rows) {
    const list = result.get(row.product_id) ?? [];
    list.push(row.filter_slug);
    result.set(row.product_id, list);
  }

  return result;
}

export async function fetchFilterSlugsForProduct(productId: string): Promise<string[]> {
  const map = await fetchFilterSlugsByProductIds([productId]);
  return map.get(productId) ?? [];
}

async function validateFilterSlugsExist(filterSlugs: string[]): Promise<void> {
  for (const slug of filterSlugs) {
    const { rows } = await sql<{ slug: string }>`
      SELECT slug FROM product_filters WHERE slug = ${slug} LIMIT 1
    `;
    if (rows.length === 0) {
      throw new Error("INVALID_FILTER");
    }
  }
}

export async function replaceProductFilterSlugs(
  productId: string,
  filterSlugs: string[]
): Promise<void> {
  const normalized = Array.from(new Set(filterSlugs.map((slug) => slug.trim()).filter(Boolean)));
  if (normalized.length === 0) {
    throw new Error("INVALID_FILTER");
  }

  await validateFilterSlugsExist(normalized);
  await ensureProductFilterAssignmentsSchema();

  await sql`DELETE FROM product_filter_assignments WHERE product_id = ${productId}`;

  for (let index = 0; index < normalized.length; index += 1) {
    const slug = normalized[index];
    await sql`
      INSERT INTO product_filter_assignments (product_id, filter_slug, sort_order)
      VALUES (${productId}, ${slug}, ${index})
    `;
  }
}

export async function countProductsUsingFilter(filterSlug: string): Promise<number> {
  try {
    const { rows } = await sql<{ count: number }>`
      SELECT COUNT(DISTINCT product_id)::int AS count
      FROM product_filter_assignments
      WHERE filter_slug = ${filterSlug}
    `;
    return rows[0]?.count ?? 0;
  } catch (error) {
    if (isPostgresErrorCode(error, "42P01")) {
      const { rows } = await sql<{ count: number }>`
        SELECT COUNT(*)::int AS count FROM products WHERE filter_slug = ${filterSlug}
      `;
      return rows[0]?.count ?? 0;
    }
    throw error;
  }
}

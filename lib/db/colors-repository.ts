import { sql } from "@/lib/db/client";

export async function fetchColorsForProduct(productId: string): Promise<string[]> {
  const { rows } = await sql<{ color_name: string }>`
    SELECT color_name
    FROM product_colors
    WHERE product_id = ${productId}
    ORDER BY sort_order ASC, color_name ASC
  `;
  return rows.map((row) => row.color_name);
}

export async function fetchColorsByProductIds(
  productIds: string[]
): Promise<Map<string, string[]>> {
  if (productIds.length === 0) return new Map();

  const { rows } = await sql.query<{ product_id: string; color_name: string }>(
    `SELECT product_id, color_name
     FROM product_colors
     WHERE product_id = ANY($1::text[])
     ORDER BY product_id ASC, sort_order ASC, color_name ASC`,
    [productIds]
  );

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.product_id) ?? [];
    list.push(row.color_name);
    map.set(row.product_id, list);
  }
  return map;
}

export async function replaceProductColors(
  productId: string,
  colors: string[]
): Promise<string[]> {
  await sql`DELETE FROM product_colors WHERE product_id = ${productId}`;

  const normalized = colors
    .map((color) => color.trim())
    .filter((color) => color.length > 0);

  for (let index = 0; index < normalized.length; index += 1) {
    await sql`
      INSERT INTO product_colors (product_id, color_name, sort_order)
      VALUES (${productId}, ${normalized[index]}, ${index})
    `;
  }

  return normalized;
}

export async function seedDefaultColors(
  productId: string,
  colors: string[]
): Promise<void> {
  const { rows } = await sql`
    SELECT 1 FROM product_colors WHERE product_id = ${productId} LIMIT 1
  `;
  if (rows.length > 0) return;
  await replaceProductColors(productId, colors);
}

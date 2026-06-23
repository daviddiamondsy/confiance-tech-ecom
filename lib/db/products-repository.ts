import { sql } from "@vercel/postgres";
import type { Product, StorageOption } from "@/lib/product-utils";

interface ProductRow {
  id: string;
  name: string;
  price: number;
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
  sort_order: number;
}

function mapRowToProduct(row: ProductRow, storageRows: StorageRow[]): Product {
  const storageOptions: StorageOption[] | undefined =
    storageRows.length > 0
      ? storageRows.map((option) => ({
          storage: option.storage,
          price: option.price,
        }))
      : undefined;

  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    image: row.image,
    badge: row.badge ?? undefined,
    description: row.description,
    features: row.features,
    specifications: row.specifications,
    storageOptions,
  };
}

export async function fetchProductsFromDb(): Promise<Product[]> {
  const { rows: productRows } = await sql<ProductRow>`
    SELECT
      id,
      name,
      price,
      original_price,
      image,
      badge,
      description,
      features,
      specifications,
      sort_order
    FROM products
    ORDER BY sort_order ASC, id ASC
  `;

  if (productRows.length === 0) {
    return [];
  }

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, sort_order
    FROM product_storage_options
    ORDER BY product_id ASC, sort_order ASC
  `;

  const storageByProduct = new Map<string, StorageRow[]>();
  for (const option of storageRows) {
    const list = storageByProduct.get(option.product_id) ?? [];
    list.push(option);
    storageByProduct.set(option.product_id, list);
  }

  return productRows.map((row) =>
    mapRowToProduct(row, storageByProduct.get(row.id) ?? [])
  );
}

export async function fetchProductByIdFromDb(id: string): Promise<Product | undefined> {
  const { rows } = await sql<ProductRow>`
    SELECT
      id,
      name,
      price,
      original_price,
      image,
      badge,
      description,
      features,
      specifications,
      sort_order
    FROM products
    WHERE id = ${id}
    LIMIT 1
  `;

  const row = rows[0];
  if (!row) return undefined;

  const { rows: storageRows } = await sql<StorageRow>`
    SELECT product_id, storage, price, sort_order
    FROM product_storage_options
    WHERE product_id = ${id}
    ORDER BY sort_order ASC
  `;

  return mapRowToProduct(row, storageRows);
}

export async function upsertCatalogProducts(products: Product[]): Promise<void> {
  for (let index = 0; index < products.length; index += 1) {
    const product = products[index];
    await sql.query(
      `INSERT INTO products (
        id, name, price, original_price, image, badge, description,
        features, specifications, sort_order, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, NOW())
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        price = EXCLUDED.price,
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
        product.name,
        product.price,
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
        await sql`
          INSERT INTO product_storage_options (product_id, storage, price, sort_order)
          VALUES (${product.id}, ${option.storage}, ${option.price}, ${optionIndex})
        `;
      }
    }
  }
}

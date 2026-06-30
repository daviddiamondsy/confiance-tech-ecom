import { config } from "dotenv";
import { buildIphone17CatalogProducts } from "@/lib/iphone-17-catalog";
import { CATALOG_FILTERS, DEFAULT_PRODUCT_COLORS } from "@/lib/catalog-yuan";
import { IPHONE_17_YUAN } from "@/lib/iphone-17-catalog";

config({ path: ".env.local" });

const BASE = process.env.PRODUCTION_BASE_URL?.trim() || "https://confiance.tech";
const password = process.env.ADMIN_PASSWORD?.trim();

const YUAN_BY_ID: Record<string, number> = {
  "16": IPHONE_17_YUAN.clean,
  "17": IPHONE_17_YUAN.new,
  "18": IPHONE_17_YUAN.proClean,
  "19": IPHONE_17_YUAN.proMaxClean,
};

async function main() {
  if (!password) {
    console.error("Set ADMIN_PASSWORD in .env.local (must match production).");
    process.exit(1);
  }

  const loginRes = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password }),
  });

  if (!loginRes.ok) {
    console.error("Login failed:", loginRes.status, await loginRes.text());
    process.exit(1);
  }

  const cookie = loginRes.headers.get("set-cookie")?.split(";")[0];
  if (!cookie) {
    console.error("No session cookie from login.");
    process.exit(1);
  }

  const existingRes = await fetch(`${BASE}/api/admin/products`, {
    headers: { Cookie: cookie },
  });
  const existingPayload = (await existingRes.json()) as {
    products?: Array<{ name: string }>;
  };
  const existingNames = new Set((existingPayload.products ?? []).map((product) => product.name));

  const products = buildIphone17CatalogProducts();

  for (const product of products) {
    if (existingNames.has(product.name)) {
      console.log(`SKIP (exists): ${product.name}`);
      continue;
    }

    const payload = {
      name: product.name,
      image: product.image,
      description: product.description,
      filterSlugs: [CATALOG_FILTERS[product.id]],
      yuanCost: YUAN_BY_ID[product.id],
      storage: "256GB",
      badge: product.badge,
      features: product.features,
      specifications: product.specifications,
      colors: DEFAULT_PRODUCT_COLORS[product.id] ?? [],
    };

    const res = await fetch(`${BASE}/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie },
      body: JSON.stringify(payload),
    });

    const body = (await res.json()) as { error?: string; product?: { slug?: string; id?: string } };
    if (!res.ok) {
      console.error(`FAIL ${product.name}:`, res.status, body);
      process.exit(1);
    }

    console.log(`CREATED ${product.name} -> ${body.product?.slug ?? body.product?.id}`);
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

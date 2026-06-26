import { notFound, redirect } from "next/navigation";
import { productPath } from "@/lib/product-slug";
import { getProductBySlug } from "@/lib/products";

export const dynamic = "force-dynamic";

/** Top-level paths that are not product short links. */
const RESERVED_ROOT_SLUGS = new Set([
  "admin",
  "products",
  "thank-you",
  "payment-success",
  "api-docs",
  "api",
  "refer",
  "r",
]);

interface ProductShortLinkProps {
  params: {
    slug: string;
  };
}

/** Redirect /iphone-13-256gb and /apple-iphone-13 to /products/{slug}. */
export default async function ProductShortLinkPage({ params }: ProductShortLinkProps) {
  const slug = params.slug.trim().toLowerCase();
  if (!slug || RESERVED_ROOT_SLUGS.has(slug)) {
    notFound();
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  redirect(productPath(product));
}

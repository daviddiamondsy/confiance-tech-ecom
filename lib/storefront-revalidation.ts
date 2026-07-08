import { revalidatePath } from "next/cache";
import { bustStaticCatalogCache } from "@/lib/static-catalog";

/** Bust Next.js route cache after admin catalog changes. */
export function revalidateStorefrontCatalog(deletedSlug?: string | null): void {
  bustStaticCatalogCache();

  revalidatePath("/", "layout");
  revalidatePath("/products", "layout");

  const slug = deletedSlug?.trim();
  if (slug) {
    revalidatePath(`/products/${slug}`, "page");
    revalidatePath(`/products/${slug}`, "layout");
  }
}

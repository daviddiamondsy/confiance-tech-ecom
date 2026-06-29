import { revalidatePath } from "next/cache";

/** Bust Next.js route cache after admin catalog changes. */
export function revalidateStorefrontCatalog(deletedSlug?: string | null): void {
  revalidatePath("/");
  revalidatePath("/products");

  const slug = deletedSlug?.trim();
  if (slug) {
    revalidatePath(`/products/${slug}`);
  }
}

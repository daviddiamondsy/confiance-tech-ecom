import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/product-utils";
import {
  catalogFilterHref,
  getCatalogFilterOptions,
  getHomeCollectionProducts,
} from "@/lib/product-catalog-utils";
import type { ProductFilterTag } from "@/lib/product-filters";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HomeProductCollectionsProps {
  products: Product[];
  filterTags: ProductFilterTag[];
}

export default function HomeProductCollections({
  products,
  filterTags,
}: HomeProductCollectionsProps) {
  const collections = getCatalogFilterOptions(products, filterTags)
    .map((tag) => ({
      tag,
      ...getHomeCollectionProducts(products, tag.slug),
    }))
    .filter((collection) => collection.items.length > 0);

  if (collections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-16 md:space-y-20">
      {collections.map(({ tag, items }) => (
        <section key={tag.slug} aria-labelledby={`collection-${tag.slug}`}>
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="section-label">Collection</span>
              <h2
                id={`collection-${tag.slug}`}
                className="font-display text-2xl md:text-3xl font-bold text-slate-900 mt-2 tracking-tight"
              >
                {tag.label}
              </h2>
            </div>
            <Link
                href={catalogFilterHref(tag.slug)}
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
              >
                See more
                <ArrowRight className="h-4 w-4" />
              </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

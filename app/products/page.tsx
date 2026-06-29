import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Suspense } from "react";
import ProductsCatalog from "@/components/ProductsCatalog";
import { Home, ChevronRight, Package, Sparkles } from "lucide-react";
import { getProductFilterTags } from "@/lib/product-filters";
import { getProducts } from "@/lib/products";
import { STOREFRONT_CATALOG_COPY } from "@/lib/device-quality-copy";
import Link from "next/link";

export const dynamic = "force-dynamic";

function CatalogSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-24 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="aspect-square bg-slate-100" />
            <div className="p-5 space-y-3">
              <div className="h-4 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProductsPage() {
  const [allProducts, filterTags] = await Promise.all([getProducts(), getProductFilterTags()]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      {/* Hero */}
      <div className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-hero-mesh opacity-60" />
        <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/50 to-transparent" />
        <div className="absolute top-1/2 right-16 -translate-y-1/2 h-48 w-48 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
            <Link href="/" className="flex items-center gap-1 hover:text-slate-300 transition-colors">
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-600" />
            <span className="text-slate-300 font-medium">Products</span>
          </nav>

          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <Package className="h-5 w-5 text-primary-300" />
                </div>
                <span className="section-label text-primary-400">Catalog</span>
              </div>
              <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight mb-3">
                All Products
              </h1>
              <p className="text-slate-400 max-w-lg leading-relaxed text-sm md:text-base">
                {STOREFRONT_CATALOG_COPY}
              </p>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 rounded-full text-xs text-primary-300 font-medium border border-white/10">
                <Sparkles className="h-3 w-3" />
                {allProducts.length} devices available
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <Suspense fallback={<CatalogSkeleton />}>
          <ProductsCatalog products={allProducts} filterTags={filterTags} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

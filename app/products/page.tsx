import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductsCatalog from "@/components/ProductsCatalog";
import { Package } from "lucide-react";
import { getProductFilterTags } from "@/lib/product-filters";
import { getProducts } from "@/lib/products";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const [allProducts, filterTags] = await Promise.all([getProducts(), getProductFilterTags()]);

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      <div className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-hero-mesh opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 md:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
              <Package className="h-5 w-5 text-primary-300" />
            </div>
            <span className="text-sm font-medium text-slate-400 uppercase tracking-wider">
              Catalog
            </span>
          </div>
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight">
            All Products
          </h1>
          <p className="text-slate-400 mt-3 max-w-lg">
            Explore our range of clean Grade A computing devices with accessories included
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        <Suspense
          fallback={
            <p className="text-sm text-slate-500">Loading products...</p>
          }
        >
          <ProductsCatalog products={allProducts} filterTags={filterTags} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Filter, Grid3X3, List, ChevronDown, Package } from "lucide-react";

const allProducts = [
  {
    id: "3",
    name: "Apple iPhone 12 128GB",
    price: 599.99,
    originalPrice: 799.99,
    rating: 4.8,
    reviews: 892,
    image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&h=500&fit=crop",
    badge: "Popular",
  },
  {
    id: "4",
    name: "Dell Latitude 3190 Laptop",
    price: 349.99,
    originalPrice: 499.99,
    rating: 4.5,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
  },
  {
    id: "5",
    name: "Dell Latitude 3189 Laptop",
    price: 349.99,
    originalPrice: 449.99,
    rating: 4.4,
    reviews: 98,
    image: "/dell-3189-images/dell-latitude-3189-2.jpg.webp",
    badge: "New",
  },
];

const categories = [
  "All Products",
  "Audio",
  "Wearables",
  "Accessories",
  "Storage",
  "Gaming",
  "Smart Home",
];

export default function ProductsPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      {/* Page Header */}
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
            Browse our complete collection of premium refurbished tech products
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Filters & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl font-medium text-sm shadow-soft flex-shrink-0">
              <Filter className="h-4 w-4" />
              Filters
            </button>
            {categories.map((category, index) => (
              <button
                key={category}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  index === 0
                    ? "bg-primary-100 text-primary-700 ring-1 ring-primary-200"
                    : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Sort by:</span>
              <button className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
                Featured
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1">
              <button className="p-2 bg-slate-100 rounded-lg text-slate-900">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          Showing <span className="font-medium text-slate-900">{allProducts.length}</span> products
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-14">
          <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-400 hover:bg-white transition-colors text-sm font-medium disabled:opacity-50">
            Previous
          </button>
          {[1, 2, 3, "...", 8].map((page, index) => (
            <button
              key={index}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                page === 1
                  ? "bg-primary-600 text-white shadow-soft"
                  : "border border-slate-200 text-slate-600 hover:bg-white"
              }`}
            >
              {page}
            </button>
          ))}
          <button className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white transition-colors text-sm font-medium">
            Next
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

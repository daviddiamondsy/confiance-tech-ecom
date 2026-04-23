import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { Filter, Grid3X3, List, ChevronDown } from "lucide-react";

const allProducts = [
  {
    id: "1",
    name: "Premium Wireless Headphones Pro",
    price: 299.99,
    originalPrice: 399.99,
    rating: 4.8,
    reviews: 256,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop",
    badge: "Best Seller",
  },
  {
    id: "2",
    name: "Smart Watch Ultra Series 5",
    price: 449.99,
    originalPrice: 549.99,
    rating: 4.9,
    reviews: 189,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop",
    badge: "New",
  },
  {
    id: "3",
    name: "Portable Bluetooth Speaker Max",
    price: 129.99,
    originalPrice: 179.99,
    rating: 4.7,
    reviews: 342,
    image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop",
  },
  {
    id: "4",
    name: "4K Ultra HD Webcam Pro",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.6,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
    badge: "Popular",
  },
  {
    id: "5",
    name: "Mechanical Gaming Keyboard RGB",
    price: 159.99,
    originalPrice: 199.99,
    rating: 4.8,
    reviews: 215,
    image: "https://images.unsplash.com/photo-1595225476474-87563907a212?w=500&h=500&fit=crop",
  },
  {
    id: "6",
    name: "Wireless Ergonomic Mouse Elite",
    price: 89.99,
    originalPrice: 119.99,
    rating: 4.5,
    reviews: 178,
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop",
  },
  {
    id: "7",
    name: "USB-C Hub 7-in-1 Adapter",
    price: 59.99,
    originalPrice: 79.99,
    rating: 4.7,
    reviews: 423,
    image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=500&h=500&fit=crop",
  },
  {
    id: "8",
    name: "Portable SSD 1TB External",
    price: 119.99,
    originalPrice: 149.99,
    rating: 4.9,
    reviews: 267,
    image: "https://images.unsplash.com/photo-1597872252165-4827a235d8be?w=500&h=500&fit=crop",
    badge: "Hot Deal",
  },
  {
    id: "9",
    name: "Noise Cancelling Earbuds Pro",
    price: 249.99,
    originalPrice: 299.99,
    rating: 4.7,
    reviews: 312,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
  },
  {
    id: "10",
    name: "Wireless Charging Pad Fast",
    price: 39.99,
    originalPrice: 59.99,
    rating: 4.4,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1586816879360-004f5b0c51e3?w=500&h=500&fit=crop",
  },
  {
    id: "11",
    name: "Laptop Stand Adjustable Aluminum",
    price: 49.99,
    originalPrice: 69.99,
    rating: 4.6,
    reviews: 198,
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop",
  },
  {
    id: "12",
    name: "Smart Home Hub Controller",
    price: 179.99,
    originalPrice: 229.99,
    rating: 4.5,
    reviews: 87,
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=500&h=500&fit=crop",
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
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">All Products</h1>
          <p className="text-gray-600 mt-2">
            Browse our complete collection of premium tech products
          </p>
        </div>
      </div>

      {/* Products Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters & Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium">
              <Filter className="h-4 w-4" />
              Filters
            </button>
            {categories.map((category, index) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  index === 0
                    ? "bg-primary-100 text-primary-700"
                    : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Sort by:</span>
              <button className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50">
                Featured
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
              <button className="p-2 bg-gray-100 rounded text-gray-900">
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button className="p-2 hover:bg-gray-50 rounded text-gray-500">
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <p className="text-sm text-gray-600 mb-6">
          Showing {allProducts.length} products
        </p>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-12">
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50">
            Previous
          </button>
          {[1, 2, 3, "...", 8].map((page, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded-lg font-medium ${
                page === 1
                  ? "bg-primary-600 text-white"
                  : "border border-gray-200 text-gray-700 hover:bg-gray-50"
              }`}
            >
              {page}
            </button>
          ))}
          <button className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50">
            Next
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}

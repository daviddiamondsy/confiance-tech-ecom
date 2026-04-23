import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { ArrowRight, Truck, Shield, Headphones, Zap } from "lucide-react";
import Link from "next/link";

const products = [
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
    id: "13",
    name: "Apple iPhone 12 128GB",
    price: 599.99,
    originalPrice: 799.99,
    rating: 4.8,
    reviews: 892,
    image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&h=500&fit=crop",
    badge: "Popular",
  },
  {
    id: "14",
    name: "Dell Latitude 3190 Laptop",
    price: 349.99,
    originalPrice: 499.99,
    rating: 4.5,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
  },
];

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "On orders over $50",
  },
  {
    icon: Shield,
    title: "2 Year Warranty",
    description: "Full coverage protection",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round the clock help",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "2-3 business days",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-900 to-gray-900 opacity-90" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550009158-9ebf69056955?w=1920&q=80')] bg-cover bg-center opacity-20" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1 bg-primary-500/20 text-primary-300 text-sm font-medium rounded-full mb-6">
              New Collection 2026
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Premium Tech for
              <span className="text-primary-400"> Modern Life</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg">
              Discover cutting-edge electronics designed to elevate your everyday experience. Quality meets innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Shop Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
              >
                View Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <feature.icon className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-sm text-gray-500">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-primary-600 font-semibold text-sm uppercase tracking-wider">
              Our Collection
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mt-2 mb-4">
              Featured Products
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Browse our carefully curated selection of premium tech products, designed to enhance your digital lifestyle.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-8 py-3 border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-colors"
            >
              View All Products
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600">
              Got questions? We have got answers.
            </p>
          </div>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How do I place an order?</h3>
              <p className="text-gray-600">Simply browse our products, click on the one you like, and fill out the order form with your name, address, state, and phone number. We will contact you to confirm your order.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept bank transfers, mobile money, and cash on delivery. Payment details will be shared when we contact you to confirm your order.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How long does delivery take?</h3>
              <p className="text-gray-600">Delivery typically takes 2-5 business days depending on your location. We will provide an estimated delivery date when confirming your order.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">Can I return a product?</h3>
              <p className="text-gray-600">Yes, we offer a 7-day return policy for defective or damaged items. Please contact us immediately if you receive a faulty product.</p>
            </div>
            <div className="border border-gray-200 rounded-lg p-6">
              <h3 className="font-semibold text-gray-900 mb-2">How can I contact you?</h3>
              <p className="text-gray-600">You can reach us via WhatsApp or call at +234 9035696604, or email us at daviddiamondsy@gmail.com.</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

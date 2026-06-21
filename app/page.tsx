import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import FaqAccordion from "@/components/FaqAccordion";
import { ArrowRight, Truck, Headphones, Zap, Shield, Sparkles } from "lucide-react";
import Link from "next/link";

const products = [
  {
    id: "3",
    name: "Apple iPhone 12 128GB (UK Used)",
    price: 329000,
    originalPrice: 380000,
    rating: 4.8,
    reviews: 892,
    image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=500&h=500&fit=crop",
    badge: "Popular",
  },
  {
    id: "4",
    name: "Dell Latitude 3190 Laptop (UK Used)",
    price: 195000,
    originalPrice: 230000,
    rating: 4.5,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop",
  },
  {
    id: "5",
    name: "Dell Latitude 3189 Laptop (UK Used)",
    price: 200000,
    originalPrice: 250000,
    rating: 4.4,
    reviews: 98,
    image: "/dell-3189-images/dell-latitude-3189-2.jpg.webp",
    badge: "New",
  },
];

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "No extra fees on all orders",
  },
  {
    icon: Shield,
    title: "Quality Guaranteed",
    description: "Tested and certified devices",
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
    <div className="min-h-screen bg-surface-muted">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550009158-9ebf69056955?w=1920&q=80')] bg-cover bg-center opacity-[0.07]" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-surface-muted to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-3xl animate-slide-up">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-primary-300 text-sm font-medium rounded-full mb-8 border border-white/10 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              New Collection 2026
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
              Premium Tech for
              <span className="block mt-1 bg-gradient-to-r from-primary-400 via-violet-400 to-primary-300 bg-clip-text text-transparent">
                Modern Life
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
              Discover cutting-edge refurbished electronics designed to elevate your everyday experience. Quality meets innovation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/products" className="btn-primary px-8 py-4 text-base">
                Shop Now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="#products" className="btn-secondary px-8 py-4 text-base">
                View Products
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative -mt-8 z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="card-elevated p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:-translate-y-0.5"
            >
              <div className="h-11 w-11 bg-gradient-to-br from-primary-500 to-violet-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-glow">
                <feature.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold text-slate-900 text-sm">{feature.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Products Section */}
      <section id="products" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="section-label">Our Collection</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-4 tracking-tight">
              Featured Products
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Premium refurbished and UK-used tech products at unbeatable prices. Quality tested, certified, and backed by our guarantee.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/products" className="btn-outline px-8 py-3.5">
              View All Products
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label">Support</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600">Got questions? We have got answers.</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      <Footer />
    </div>
  );
}

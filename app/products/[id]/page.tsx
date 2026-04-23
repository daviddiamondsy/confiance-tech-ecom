import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomerForm from "@/components/CustomerForm";
import ProductCard from "@/components/ProductCard";
import { Star, ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw, Check } from "lucide-react";
import Image from "next/image";

const product = {
  id: "1",
  name: "Premium Wireless Headphones Pro",
  price: 299.99,
  originalPrice: 399.99,
  rating: 4.8,
  reviews: 256,
  image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop",
  badge: "Best Seller",
  description: "Experience crystal-clear audio with our Premium Wireless Headphones Pro. Featuring active noise cancellation, 40-hour battery life, and premium comfort for all-day wear.",
  features: [
    "Active Noise Cancellation",
    "40-hour Battery Life",
    "Premium Comfort Fit",
    "Bluetooth 5.3 Connectivity",
    "Spatial Audio Support",
    "Quick Charge (5 min = 3 hours)",
  ],
  specifications: {
    "Driver Size": "40mm Dynamic",
    "Frequency Response": "20Hz - 40kHz",
    "Battery Life": "40 hours (ANC on)",
    "Charging": "USB-C Fast Charge",
    "Weight": "250g",
    "Connectivity": "Bluetooth 5.3, 3.5mm",
  },
};

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
    { id: "6" },
    { id: "7" },
    { id: "8" },
    { id: "9" },
    { id: "10" },
    { id: "11" },
    { id: "12" },
  ];
}

const relatedProducts = [
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
    id: "9",
    name: "Noise Cancelling Earbuds Pro",
    price: 249.99,
    originalPrice: 299.99,
    rating: 4.7,
    reviews: 312,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop",
  },
  {
    id: "4",
    name: "4K Ultra HD Webcam Pro",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.6,
    reviews: 128,
    image: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&h=500&fit=crop",
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
];

export default function ProductPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <span className="hover:text-gray-900 cursor-pointer">Home</span>
            <span>/</span>
            <span className="hover:text-gray-900 cursor-pointer">Products</span>
            <span>/</span>
            <span className="text-gray-900 font-medium">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-4 py-2 bg-primary-600 text-white font-semibold rounded-full">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    i < Math.floor(product.rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="text-sm text-gray-600 ml-2">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                ${product.price.toFixed(2)}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
              )}
              {product.originalPrice && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  Save ${(product.originalPrice - product.price).toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-gray-600 text-lg mb-8">{product.description}</p>

            {/* Features List */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 mb-4">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-600">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <button className="flex-1 py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2 text-lg">
                <ShoppingCart className="h-5 w-5" />
                Add to Cart
              </button>
              <button className="py-4 px-6 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center gap-2">
                <Heart className="h-5 w-5" />
                Wishlist
              </button>
              <button className="py-4 px-6 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:border-gray-900 hover:text-gray-900 transition-colors flex items-center justify-center gap-2">
                <Share2 className="h-5 w-5" />
                Share
              </button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-center">
                <Truck className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">2 Year Warranty</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">30-Day Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-b border-gray-200 mb-8">
            <div className="flex gap-8">
              <button className="pb-4 border-b-2 border-primary-600 text-primary-600 font-semibold">
                Description
              </button>
              <button className="pb-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium">
                Specifications
              </button>
              <button className="pb-4 border-b-2 border-transparent text-gray-600 hover:text-gray-900 font-medium">
                Reviews ({product.reviews})
              </button>
            </div>
          </div>

          {/* Description Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Premium Sound, Unmatched Comfort
              </h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                Immerse yourself in exceptional audio quality with our Premium Wireless Headphones Pro. 
                Engineered for audiophiles and casual listeners alike, these headphones deliver 
                rich, detailed sound across all frequencies. The advanced 40mm dynamic drivers 
                produce deep bass, clear mids, and crisp highs that bring your music to life.
              </p>
              <p className="text-gray-600 mb-6 leading-relaxed">
                The active noise cancellation technology intelligently adapts to your environment, 
                blocking out unwanted noise so you can focus on what matters. Whether you are 
                commuting, working, or relaxing at home, enjoy pure, uninterrupted sound.
              </p>
              
              {/* Headline Section */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white my-12">
                <h3 className="text-3xl font-bold mb-4">
                  Transform Your Listening Experience Today
                </h3>
                <p className="text-primary-100 text-lg">
                  Join over 50,000 satisfied customers who have made the switch to premium audio. 
                  Experience the difference that professional-grade sound quality can make in your daily life.
                </p>
              </div>

              {/* Video Section */}
              <div className="my-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">See It In Action</h3>
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden relative">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=675&fit=crop"
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-gray-600 mt-4">
                  Watch our product demonstration to see how the Premium Wireless Headphones Pro 
                  deliver exceptional audio quality and comfort in real-world scenarios.
                </p>
              </div>

              {/* First Customer Form */}
              <div className="my-12">
                <CustomerForm 
                  title="Interested in This Product?"
                  subtitle="Fill out the form below and our team will contact you with exclusive offers and availability information."
                />
              </div>

              {/* Product Copy */}
              <div className="my-12">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Designed for Your Lifestyle
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">All-Day Comfort</h4>
                    <p className="text-gray-600">
                      Memory foam ear cushions and an adjustable headband ensure a perfect fit 
                      for extended listening sessions without fatigue.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Seamless Connectivity</h4>
                    <p className="text-gray-600">
                      Bluetooth 5.3 provides a stable connection up to 30 feet, with support 
                      for multipoint pairing to two devices simultaneously.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Intelligent Sound</h4>
                    <p className="text-gray-600">
                      Adaptive EQ automatically tunes music to your ears, while spatial audio 
                      with dynamic head tracking creates an immersive theater-like experience.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Premium Build</h4>
                    <p className="text-gray-600">
                      Crafted from high-quality materials including anodized aluminum and 
                      vegan leather for durability and sustainability.
                    </p>
                  </div>
                </div>
                <p className="text-gray-600 leading-relaxed">
                  Whether you are a music enthusiast, a professional working from home, or someone 
                  who simply appreciates great sound, these headphones are designed to exceed your 
                  expectations. The combination of cutting-edge technology, premium materials, and 
                  thoughtful design makes this an investment in your daily audio experience that 
                  you will appreciate every time you put them on.
                </p>
              </div>

              {/* Second Customer Form */}
              <div className="my-12">
                <CustomerForm 
                  title="Ready to Order?"
                  subtitle="Complete this form to secure your Premium Wireless Headphones Pro with priority shipping. Limited stock available."
                />
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-semibold text-gray-900 mb-4">Specifications</h3>
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-6 bg-primary-50 rounded-xl">
                  <h4 className="font-semibold text-primary-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-primary-700 mb-4">
                    Our product specialists are here to answer your questions.
                  </p>
                  <button className="w-full py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors">
                    Chat with Us
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products */}
      <section className="bg-gray-100 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

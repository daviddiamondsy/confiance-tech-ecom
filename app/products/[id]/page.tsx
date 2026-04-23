import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomerForm from "@/components/CustomerForm";
import { Star, Truck, Shield, RotateCcw, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

const products = [
  {
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
  },
  {
    id: "2",
    name: "Wireless Earbuds Pro",
    price: 199.99,
    originalPrice: 249.99,
    rating: 4.7,
    reviews: 412,
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop",
    badge: "New",
    description: "Immerse yourself in pure sound with Wireless Earbuds Pro. Active noise cancellation, crystal-clear calls, and a compact charging case that fits in your pocket.",
    features: [
      "Active Noise Cancellation",
      "30-hour Total Battery Life",
      "IPX5 Water Resistant",
      "Transparency Mode",
      "Touch Controls",
      "Wireless Charging Case",
    ],
    specifications: {
      "Driver Size": "11mm Dynamic",
      "Frequency Response": "20Hz - 20kHz",
      "Battery Life": "6 hours + 24 with case",
      "Charging": "USB-C & Wireless",
      "Water Resistance": "IPX5",
      "Connectivity": "Bluetooth 5.2",
    },
  },
  {
    id: "3",
    name: "Apple iPhone 12 128GB (UK Used)",
    price: 329000,
    originalPrice: 380000,
    rating: 4.8,
    reviews: 892,
    image: "https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=800&h=800&fit=crop",
    badge: "Popular",
    description: "The iPhone 12 pushes the boundaries of what's possible. 5G speed, A14 Bionic chip, and the most advanced dual-camera system ever in an iPhone. UK used, tested and certified.",
    features: [
      "Super Retina XDR Display",
      "A14 Bionic Chip",
      "5G Capable",
      "Dual 12MP Camera System",
      "MagSafe Compatible",
      "Face ID Security",
    ],
    specifications: {
      "Display": "6.1-inch Super Retina XDR",
      "Processor": "A14 Bionic chip",
      "Storage": "128GB",
      "Camera": "Dual 12MP Ultra Wide + Wide",
      "Battery": "Up to 17 hours video",
      "Connectivity": "5G, Wi-Fi 6, Bluetooth 5.0",
    },
  },
  {
    id: "4",
    name: "Dell Latitude 3190 Laptop (UK Used)",
    price: 195000,
    originalPrice: 230000,
    rating: 4.5,
    reviews: 156,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&h=800&fit=crop",
    description: "The Dell Latitude 3190 is built for education and productivity. Rugged design with all-day battery life for students and professionals alike. UK used, tested and certified.",
    features: [
      "11.6-inch HD Anti-Glare Display",
      "Intel Celeron Processor",
      "4GB RAM + 128GB SSD",
      "Ruggedized Rubber Bumpers",
      "All-Day Battery Life",
      "Windows 10 Pro Pre-installed",
    ],
    specifications: {
      "Display": "11.6-inch HD (1366x768)",
      "Processor": "Intel Celeron N4100",
      "Memory": "4GB DDR4",
      "Storage": "128GB SSD",
      "Battery": "Up to 10 hours",
      "Weight": "2.9 lbs",
    },
  },
];

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
  ];
}

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = products.find((p) => p.id === params.id);

  if (!product) {
    notFound();
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/" className="hover:text-gray-900 cursor-pointer">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-gray-900 cursor-pointer">Products</Link>
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
                ₦{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  ₦{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.originalPrice && (
                <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">
                  Save ₦{(product.originalPrice - product.price).toLocaleString()}
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

          {/* Content with Sticky Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {/* Product Description */}
              <div className="mb-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Product Description</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
                
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                      <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form 1 */}
              <div className="my-16">
                <CustomerForm 
                  title="Get This Product Today"
                  subtitle="Limited stock available. Fill out the form now and we will contact you within 24 hours."
                />
              </div>

              {/* Video Section */}
              <div className="my-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">See It In Action</h3>
                <div className="aspect-video bg-gray-900 rounded-2xl overflow-hidden relative">
                  <video
                    className="w-full h-full object-cover"
                    controls
                    poster={product.image}
                  >
                    <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <p className="text-gray-600 mt-4">
                  Watch how this product performs in real-world scenarios.
                </p>
              </div>

              {/* Form 2 */}
              <div className="my-16">
                <CustomerForm 
                  title="Do not Miss Out - Order Now"
                  subtitle="Join thousands of satisfied customers. Secure your {product.name} today."
                />
              </div>

              {/* Selling Copywriting */}
              <div className="my-16">
                <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white mb-8">
                  <h3 className="text-3xl font-bold mb-4">Why Choose {product.name}?</h3>
                  <p className="text-primary-100 text-lg">
                    This is not just another product - it is an investment in quality and convenience that will transform your daily experience.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Premium Quality Guaranteed</h4>
                    <p className="text-gray-600">
                      Every product is thoroughly tested and comes with our quality guarantee. We only sell items we would use ourselves.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Fast Delivery Nationwide</h4>
                    <p className="text-gray-600">
                      Get your order delivered within 1-3 business days anywhere in Nigeria. Track your package every step of the way.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">7-Day Return Policy</h4>
                    <p className="text-gray-600">
                      Not satisfied? Return within 7 days for a full refund. Your satisfaction is our priority.
                    </p>
                  </div>
                  <div className="p-6 bg-gray-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">24/7 Customer Support</h4>
                    <p className="text-gray-600">
                      Have questions? Our team is available around the clock to assist you via WhatsApp, phone, or email.
                    </p>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-xl p-8">
                  <h4 className="text-xl font-bold text-gray-900 mb-4">What Our Customers Say</h4>
                  <blockquote className="text-gray-600 italic border-l-4 border-primary-500 pl-4">
                    "Amazing product! The quality exceeded my expectations and the delivery was super fast. Will definitely order again!"
                    <footer className="text-gray-500 mt-2 not-italic font-semibold">- Happy Customer</footer>
                  </blockquote>
                </div>
              </div>

              {/* Specifications */}
              <div className="my-16 lg:hidden">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Specifications</h3>
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="text-gray-600">{key}</span>
                      <span className="font-medium text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Form */}
              <div className="my-16">
                <div className="bg-primary-50 rounded-2xl p-8">
                  <CustomerForm 
                    title="Ready to Order?"
                    subtitle="Complete this form now to secure your {product.name}. Stock is limited - order today!"
                  />
                </div>
              </div>
            </div>

            {/* Sticky Sidebar */}
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

      <Footer />
    </div>
  );
}

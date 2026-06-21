import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CustomerForm from "@/components/CustomerForm";
import MetaPixelViewContent from "@/components/MetaPixel";
import ImageCarousel from "@/components/ImageCarousel";
import { Star, Truck, Shield, RotateCcw, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOLDAM_DELIVERY_DAYS } from "@/lib/delivery-deadline";

const products = [


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
    video: "/videos/dell-3190.mp4",
    description: "The Dell Latitude 3190 is built for education and productivity. Rugged design with all-day battery life for students and professionals alike. UK used, tested and certified.",
    features: [
      "11.6-inch HD Touchscreen Display",
      "Intel Celeron Processor",
      "4GB RAM + 128GB SSD",
      "360° Foldable Design",
      "All-Day Battery Life",
      "Windows 10 Pro Pre-installed",
    ],
    specifications: {
      "Display": "11.6-inch HD Touchscreen (1366x768)",
      "Processor": "Intel Celeron N4100",
      "Memory": "4GB DDR4",
      "Storage": "128GB SSD",
      "Form Factor": "360° Foldable (2-in-1)",
      "Battery": "Up to 10 hours",
      "Weight": "2.9 lbs",
    },
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
    images: [
      "/dell-3189-images/dell-latitude-3189-2.jpg.webp",
      "/dell-3189-images/dell-latitude-3189-7.jpg.webp",
      "/dell-3189-images/83df5907fb7f19d85bd4490ae81d9b0b.jpg",
      "/dell-3189-images/IMG_20220801_111418_714.webp",
      "/dell-3189-images/315783314-600x450-1.jpeg",
      "/dell-3189-images/giant_206446.jpg",
      "/dell-3189-images/02nqluymzt46hiplfd6qha8-12-hero-image-gallery.webp",
    ],
    description: "The Dell Latitude 3189 is a versatile 2-in-1 laptop designed for education and productivity. Features a durable build, long battery life, and responsive performance for students and professionals. UK used, tested and certified.",
    features: [
      "11.6-inch HD Touchscreen Display",
      "Intel Celeron Processor",
      "4GB RAM + 128GB SSD",
      "360° Hinge Design",
      "All-Day Battery Life",
      "Windows 10 Pro Pre-installed",
    ],
    specifications: {
      "Display": "11.6-inch HD Touchscreen (1366x768)",
      "Processor": "Intel Celeron N4100",
      "Memory": "4GB DDR4",
      "Storage": "128GB SSD",
      "Form Factor": "360° Hinge (2-in-1)",
      "Battery": "Up to 10 hours",
      "Weight": "3.0 lbs",
    },
  },
];

export function generateStaticParams() {
  return [
    { id: "1" },
    { id: "2" },
    { id: "3" },
    { id: "4" },
    { id: "5" },
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
    <div className="min-h-screen bg-surface-muted">
      {/* Meta Pixel ViewContent Tracking */}
      <MetaPixelViewContent
        contentName={product.name}
        contentIds={[product.id]}
        value={product.price}
        currency="NGN"
      />
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Image */}
          <div className="relative">
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative shadow-card border border-slate-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-full shadow-soft">
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
                      ? "fill-amber-400 text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
              <span className="text-sm text-slate-500 ml-2">
                {product.rating} ({product.reviews} reviews)
              </span>
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                ₦{product.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-slate-400 line-through">
                  ₦{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.originalPrice && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                  Save ₦{(product.originalPrice - product.price).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-slate-600 text-lg mb-8 leading-relaxed">{product.description}</p>

            {/* Features List */}
            <div className="mb-8">
              <h3 className="font-display font-semibold text-slate-900 mb-4">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-slate-600">
                    <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>


            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft">
              <div className="text-center">
                <Truck className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">Quality Tested</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">7-Day Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Details Tabs */}
      <div className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-b border-slate-200 mb-8">
            <div className="flex gap-8">
              <button className="pb-4 border-b-2 border-primary-600 text-primary-600 font-semibold font-display">
                Description
              </button>
            
            </div>
          </div>

          {/* Content with Sticky Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              {/* Product Description */}
              <div className="mb-12">
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Product Description</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">{product.description}</p>
                
                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {product.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Form 1 */}
              <div className="my-16">
                <CustomerForm 
                  title="Get This Product Today"
                  subtitle="Limited stock available. Fill out the form now and we will contact you within 24 hours."
                  productPrice={product.price}
                  productName={product.name}
                  productId={product.id}
                  deliveryDays={HOLDAM_DELIVERY_DAYS}
                />
              </div>

              {/* Video or Image Carousel Section */}
              <div className="my-16">
                {product.video ? (
                  <>
                    <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">See It In Action</h3>
                    <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden relative shadow-card">
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster={product.image}
                      >
                        <source src={product.video} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                    <p className="text-slate-600 mt-4">
                      Watch how this product performs in real-world scenarios.
                    </p>
                  </>
                ) : product.images && product.images.length > 0 ? (
                  <>
                    <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">Product Gallery</h3>
                    <ImageCarousel images={product.images} productName={product.name} />
                  </>
                ) : null}
              </div>

              {/* Form 2 */}
              <div className="my-16">
                <CustomerForm 
                  title="Do not Miss Out - Order Now"
                  subtitle={`Join thousands of satisfied customers. Secure your ${product.name} today.`}
                  productPrice={product.price}
                  productName={product.name}
                  productId={product.id}
                  deliveryDays={HOLDAM_DELIVERY_DAYS}
                />
              </div>

              {/* Selling Copywriting */}
              <div className="my-16">
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 rounded-2xl p-8 text-white mb-8 shadow-glow">
                  <h3 className="font-display text-3xl font-bold mb-4">Why Choose {product.name}?</h3>
                  <p className="text-primary-100 text-lg leading-relaxed">
                    This is not just another product - it is an investment in quality and convenience that will transform your daily experience.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-soft">
                    <h4 className="font-display font-semibold text-slate-900 mb-2">Premium Quality Guaranteed</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Every product is thoroughly tested and comes with our quality guarantee. We only sell items we would use ourselves.
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-soft">
                    <h4 className="font-display font-semibold text-slate-900 mb-2">Fast Delivery Nationwide</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Get your order delivered within 1-3 business days anywhere in Nigeria. Track your package every step of the way.
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-soft">
                    <h4 className="font-display font-semibold text-slate-900 mb-2">7-Day Return Policy</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Not satisfied? Return within 7 days for a full refund. Your satisfaction is our priority.
                    </p>
                  </div>
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-soft">
                    <h4 className="font-display font-semibold text-slate-900 mb-2">24/7 Customer Support</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Have questions? Our team is available around the clock to assist you via WhatsApp, phone, or email.
                    </p>
                  </div>
                </div>
                
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                  <h4 className="font-display text-xl font-bold text-slate-900 mb-4">What Our Customers Say</h4>
                  <blockquote className="text-slate-600 italic border-l-4 border-primary-500 pl-4 leading-relaxed">
                    &ldquo;Amazing product! The quality exceeded my expectations and the delivery was super fast. Will definitely order again!&rdquo;
                    <footer className="text-slate-500 mt-3 not-italic font-semibold">- Happy Customer</footer>
                  </blockquote>
                </div>
              </div>

              {/* Specifications */}
              <div className="my-16 lg:hidden">
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">Specifications</h3>
                <div className="card-elevated p-6 space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-500">{key}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Final Form */}
              <div className="my-16">
                <div className="bg-primary-50/80 rounded-2xl p-8 border border-primary-100">
                  <CustomerForm 
                    title="Ready to Order?"
                    subtitle={`Complete this form now to secure your ${product.name}. Stock is limited - order today!`}
                    productPrice={product.price}
                    productName={product.name}
                    productId={product.id}
                    deliveryDays={HOLDAM_DELIVERY_DAYS}
                  />
                </div>
              </div>
            </div>

            {/* Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-display font-semibold text-slate-900 mb-4">Specifications</h3>
                <div className="card-elevated p-6 space-y-4">
                  {Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-slate-100 last:border-0">
                      <span className="text-slate-500">{key}</span>
                      <span className="font-medium text-slate-900">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 p-6 bg-gradient-to-br from-primary-50 to-violet-50 rounded-2xl border border-primary-100">
                  <h4 className="font-display font-semibold text-primary-900 mb-2">Need Help?</h4>
                  <p className="text-sm text-primary-700 mb-4 leading-relaxed">
                    Our product specialists are here to answer your questions.
                  </p>
                  <button className="btn-primary w-full text-sm py-2.5">
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

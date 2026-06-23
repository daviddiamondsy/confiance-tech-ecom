"use client";

import { useMemo, useState } from "react";
import CustomerForm from "@/components/CustomerForm";
import ImageCarousel from "@/components/ImageCarousel";
import ProductSpecifications from "@/components/ProductSpecifications";
import { Truck, Shield, RotateCcw, Check } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/lib/product-utils";
import { getSelectedVariant, getDisplaySpecs } from "@/lib/product-utils";

interface ProductDetailViewProps {
  product: Product;
  deliveryDays: number;
}

export default function ProductDetailView({ product, deliveryDays }: ProductDetailViewProps) {
  const [selectedStorageIndex, setSelectedStorageIndex] = useState(0);

  const variant = useMemo(
    () => getSelectedVariant(product, selectedStorageIndex),
    [product, selectedStorageIndex]
  );

  const displaySpecs = useMemo(
    () => getDisplaySpecs(product, variant.storage),
    [product, variant.storage]
  );

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="relative">
            <div className="aspect-square bg-slate-100 rounded-2xl overflow-hidden relative shadow-card border border-slate-100">
              <Image
                src={product.image}
                alt={variant.displayName}
                fill
                className="object-contain p-6"
              />
              {product.badge && (
                <span className="absolute top-4 left-4 px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-full shadow-soft">
                  {product.badge}
                </span>
              )}
            </div>
          </div>

          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-4 tracking-tight">
              {variant.displayName}
            </h1>

            {product.storageOptions && product.storageOptions.length > 1 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-3">Storage</p>
                <div className="flex flex-wrap gap-3">
                  {product.storageOptions.map((option, index) => (
                    <button
                      key={option.storage}
                      type="button"
                      onClick={() => setSelectedStorageIndex(index)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                        selectedStorageIndex === index
                          ? "border-primary-600 bg-primary-50 text-primary-700 shadow-soft"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                      }`}
                    >
                      {option.storage}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-primary-600">
                ₦{variant.price.toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-xl text-slate-400 line-through">
                  ₦{product.originalPrice.toLocaleString()}
                </span>
              )}
              {product.originalPrice && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-semibold rounded-full">
                  Save ₦{(product.originalPrice - variant.price).toLocaleString()}
                </span>
              )}
            </div>

            <p className="text-slate-600 text-lg mb-8 leading-relaxed">{product.description}</p>

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

            <div className="grid grid-cols-3 gap-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-soft">
              <div className="text-center">
                <Truck className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">Clean & Tested</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 text-primary-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-900">7-Day Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="border-b border-slate-200 mb-8">
            <div className="flex gap-8">
              <button className="pb-4 border-b-2 border-primary-600 text-primary-600 font-semibold font-display">
                Description
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <div className="mb-12">
                <h2 className="font-display text-2xl font-bold text-slate-900 mb-4">Product Description</h2>
                <p className="text-slate-600 mb-6 leading-relaxed">{product.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {product.features.map((feature, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <Check className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-slate-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="my-16">
                <CustomerForm
                  title="Get This Product Today"
                  subtitle="Limited stock available. Fill out the form now and we will contact you within 24 hours."
                  productPrice={variant.price}
                  productName={variant.displayName}
                  productId={product.id}
                  deliveryDays={deliveryDays}
                />
              </div>

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
                    <ImageCarousel images={product.images} productName={variant.displayName} />
                  </>
                ) : null}
              </div>

              <div className="my-16">
                <CustomerForm
                  title="Do not Miss Out - Order Now"
                  subtitle={`Join thousands of satisfied customers. Secure your ${variant.displayName} today.`}
                  productPrice={variant.price}
                  productName={variant.displayName}
                  productId={product.id}
                  deliveryDays={deliveryDays}
                />
              </div>

              <div className="my-16">
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 rounded-2xl p-8 text-white mb-8 shadow-glow">
                  <h3 className="font-display text-3xl font-bold mb-4">Why Choose {variant.displayName}?</h3>
                  <p className="text-primary-100 text-lg leading-relaxed">
                    Reliable tech in clean condition, with accessories included and a team that stands behind every order.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 bg-white rounded-2xl border border-slate-100 shadow-soft">
                    <h4 className="font-display font-semibold text-slate-900 mb-2">Clean Condition</h4>
                    <p className="text-slate-600 leading-relaxed">
                      Every device is clean, fully functional, and checked before it leaves our hands. We only sell units we would use ourselves.
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

              <div className="my-16 lg:hidden">
                <h3 className="font-display text-2xl font-bold text-slate-900 mb-4">Specifications</h3>
                <div className="card-elevated p-6">
                  <ProductSpecifications specs={displaySpecs} />
                </div>
              </div>

              <div className="my-16">
                <div className="bg-primary-50/80 rounded-2xl p-8 border border-primary-100">
                  <CustomerForm
                    title="Ready to Order?"
                    subtitle={`Complete this form now to secure your ${variant.displayName}. Stock is limited - order today!`}
                    productPrice={variant.price}
                    productName={variant.displayName}
                    productId={product.id}
                    deliveryDays={deliveryDays}
                  />
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-display font-semibold text-slate-900 mb-4">Specifications</h3>
                <div className="card-elevated p-6">
                  <ProductSpecifications specs={displaySpecs} />
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
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import ReferralDiscountBanner from "@/components/ReferralDiscountBanner";
import ImageCarousel from "@/components/ImageCarousel";
import ProductSpecifications from "@/components/ProductSpecifications";
import TrustFeaturesGrid from "@/components/TrustFeaturesGrid";
import { Check, ShoppingBag } from "lucide-react";
import Image from "next/image";
import type { Product } from "@/lib/product-utils";
import {
  getSelectedVariant,
  getDisplaySpecs,
  getVariantPickerLabel,
} from "@/lib/product-utils";
import { storefrontProductBadge } from "@/lib/product-condition-suffix";
import { PRODUCT_DETAIL_TRUST_FEATURES } from "@/lib/storefront-trust-features";
import { STOREFRONT_PRODUCT_DETAIL_TRUST_COPY } from "@/lib/device-quality-copy";
import {
  bundledLocalDeliveryNgn,
  storefrontDisplayPrice,
  storefrontCatalogIncludesLocalDelivery,
} from "@/lib/storefront-display-price";

interface ProductDetailViewProps {
  product: Product;
  deliveryDays?: number;
}

export default function ProductDetailView({ product }: ProductDetailViewProps) {
  const [selectedStorageIndex, setSelectedStorageIndex] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);

  const variant = useMemo(
    () => getSelectedVariant(product, selectedStorageIndex, selectedColorIndex),
    [product, selectedStorageIndex, selectedColorIndex]
  );

  const displaySpecs = useMemo(
    () => getDisplaySpecs(product, variant.storage),
    [product, variant.storage]
  );

  const badge = storefrontProductBadge(product);

  const buyHref = useMemo(() => {
    const params = new URLSearchParams();
    if (variant.storage) params.set("storage", variant.storage);
    if (variant.color) params.set("color", variant.color);
    const qs = params.toString();
    return `/order/${product.slug}${qs ? `?${qs}` : ""}`;
  }, [product.slug, variant.storage, variant.color]);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* Image */}
          <div className="relative">
            <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 rounded-3xl overflow-hidden relative shadow-card border border-slate-100">
              <Image
                src={product.image}
                alt={variant.displayName}
                fill
                className="object-contain p-8"
              />
              {badge && (
                <span className="absolute top-4 left-4 px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-full shadow-soft tracking-wide">
                  {badge}
                </span>
              )}
            </div>


            <Link
              href={buyHref}
              className="mt-4 inline-flex items-center justify-center gap-2.5 w-full py-4 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold rounded-2xl transition-colors shadow-soft text-base"
            >
              <ShoppingBag className="h-5 w-5" />
              Order Now - ₦{storefrontDisplayPrice(variant.price, product).toLocaleString()}
            </Link>
          </div>

          {/* Info */}
          <div>
            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 tracking-tight leading-tight">
              {variant.displayName}
            </h1>

            {product.storageOptions && product.storageOptions.length > 0 && (
              <div className="mb-5">
                <p className="input-label">{getVariantPickerLabel(product)}</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.storageOptions.map((option, index) => (
                    <button
                      key={option.storage}
                      type="button"
                      onClick={() => setSelectedStorageIndex(index)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedStorageIndex === index
                          ? "border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/50"
                      }`}
                    >
                      <span className="block">{option.storage}</span>
                      <span
                        className={`block text-xs font-semibold mt-0.5 ${
                          selectedStorageIndex === index ? "text-primary-600" : "text-slate-500"
                        }`}
                      >
                        ₦{storefrontDisplayPrice(option.price, product).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.colorOptions && product.colorOptions.length > 0 && (
              <div className="mb-5">
                <p className="input-label">Color</p>
                <div className="flex flex-wrap gap-2.5">
                  {product.colorOptions.map((color, index) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColorIndex(index)}
                      className={`px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedColorIndex === index
                          ? "border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/50"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ReferralDiscountBanner catalogPriceNgn={variant.price} />

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl md:text-4xl font-bold text-slate-900">
                ₦{storefrontDisplayPrice(variant.price, product).toLocaleString()}
              </span>
              {product.originalPrice && (
                <span className="text-lg text-slate-400 line-through">
                  ₦{storefrontDisplayPrice(product.originalPrice, product).toLocaleString()}
                </span>
              )}
            </div>
            {product.originalPrice && (
              <div className="mb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 text-sm font-bold rounded-full">
                  Save ₦{(storefrontDisplayPrice(product.originalPrice, product) - storefrontDisplayPrice(variant.price, product)).toLocaleString()}
                </span>
              </div>
            )}
            {storefrontCatalogIncludesLocalDelivery(product) && (
              <p className="text-xs text-slate-400 mb-5">
                Includes ₦{bundledLocalDeliveryNgn(product).toLocaleString()} door delivery in catalog price
              </p>
            )}

            <p className="text-slate-600 leading-relaxed mb-6">{product.description}</p>

            <div className="mb-6">
              <h3 className="font-display font-semibold text-slate-900 mb-3 text-sm uppercase tracking-wider text-primary-600">Key Features</h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-slate-600 text-sm">
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <TrustFeaturesGrid variant="product-detail" className="mb-6" />

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

              <div id="order-form" className="my-16">
                <div className="bg-gradient-to-r from-primary-600 to-violet-600 rounded-3xl p-8 text-white text-center shadow-glow">
                  <h3 className="font-display text-2xl font-bold mb-2">Get This Product Today</h3>
                  <p className="text-primary-100 mb-6 leading-relaxed">
                    Limited stock available. Place your order now and get it delivered to your door.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                      href={buyHref}
                      className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-2xl hover:bg-primary-50 transition-colors shadow-soft"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Order Now - ₦{storefrontDisplayPrice(variant.price, product).toLocaleString()}
                    </Link>
                  </div>
                </div>
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
                <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 rounded-2xl p-8 text-white mb-8 shadow-glow">
                  <h3 className="font-display text-3xl font-bold mb-4">Why Choose {variant.displayName}?</h3>
                  <p className="text-primary-100 text-lg leading-relaxed">
                    {STOREFRONT_PRODUCT_DETAIL_TRUST_COPY}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {PRODUCT_DETAIL_TRUST_FEATURES.map((feature) => (
                    <div
                      key={feature.title}
                      className="p-6 bg-white rounded-2xl border border-slate-100 shadow-soft"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <feature.icon className="h-5 w-5 text-primary-600 flex-shrink-0" />
                        <h4 className="font-display font-semibold text-slate-900">{feature.title}</h4>
                      </div>
                      {feature.description ? (
                        <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100">
                  <h4 className="font-display text-xl font-bold text-slate-900 mb-4">What Our Customers Say</h4>
                  <blockquote className="text-slate-600 italic border-l-4 border-primary-500 pl-4 leading-relaxed">
                    &ldquo;Amazing product! The quality exceeded my expectations and the delivery was super fast. Will definitely order again!&rdquo;
                    <footer className="text-slate-500 mt-3 not-italic font-semibold">- Cherish</footer>
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
                <div className="bg-primary-50/80 rounded-2xl p-8 border border-primary-100 text-center">
                  <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Ready to Order?</h3>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    Stock is limited - secure your {variant.displayName} today.
                  </p>
                  <Link
                    href={buyHref}
                    className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-colors shadow-glow"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    Place My Order - ₦{storefrontDisplayPrice(variant.price, product).toLocaleString()}
                  </Link>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <h3 className="font-display font-semibold text-slate-900 mb-4">Specifications</h3>
                <div className="card-elevated p-6">
                  <ProductSpecifications specs={displaySpecs} />
                </div>

                <div className="mt-6 p-6 bg-gradient-to-br from-primary-600 to-violet-700 rounded-2xl text-white shadow-glow">
                  <h4 className="font-display font-semibold text-white mb-1.5">Need Help?</h4>
                  <p className="text-sm text-primary-100 mb-4 leading-relaxed">
                    Our product specialists are ready to answer your questions.
                  </p>
                  <Link
                    href={buyHref}
                    className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:bg-primary-50 transition-colors"
                  >
                    Order Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

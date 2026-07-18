"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Check, Truck, Shield, Clock, ArrowLeft } from "lucide-react";
import CustomerForm from "@/components/CustomerForm";
import ReferralDiscountBanner from "@/components/ReferralDiscountBanner";
import { useReferralDiscount } from "@/components/useReferralDiscount";
import type { Product } from "@/lib/product-utils";
import { getSelectedVariant } from "@/lib/product-utils";
import { storefrontProductBadge } from "@/lib/product-condition-suffix";
import { DELIVERY_ESTIMATE_COPY } from "@/lib/delivery-deadline";
import { productPath } from "@/lib/product-slug";
import {
  storefrontDisplayPrice,
  storefrontDoorDeliveryLineFee,
  storefrontCheckoutDoorFeeNgn,
  storefrontOrderTotal,
  STOREFRONT_DOOR_DELIVERY_FEE_NGN,
} from "@/lib/storefront-display-price";
import { storefrontOrderTotalAfterReferral } from "@/lib/referral/display-price";
import { formatNgn } from "@/lib/referral/config";

interface PurchasePageProps {
  product: Product;
  initialStorage?: string;
  initialColor?: string;
  deliveryDays: number;
}

export default function PurchasePage({
  product,
  initialStorage,
  initialColor,
  deliveryDays,
}: PurchasePageProps) {
  const initialStorageIndex = useMemo(() => {
    if (!initialStorage || !product.storageOptions) return 0;
    const idx = product.storageOptions.findIndex((o) => o.storage === initialStorage);
    return idx >= 0 ? idx : 0;
  }, [product.storageOptions, initialStorage]);

  const initialColorIndex = useMemo(() => {
    if (!initialColor || !product.colorOptions) return 0;
    const idx = product.colorOptions.findIndex((c) => c === initialColor);
    return idx >= 0 ? idx : 0;
  }, [product.colorOptions, initialColor]);

  const [selectedStorageIndex, setSelectedStorageIndex] = useState(initialStorageIndex);
  const [selectedColorIndex, setSelectedColorIndex] = useState(initialColorIndex);
  const [doorDelivery, setDoorDelivery] = useState(true);

  const variant = useMemo(
    () => getSelectedVariant(product, selectedStorageIndex, selectedColorIndex),
    [product, selectedStorageIndex, selectedColorIndex]
  );

  const devicePrice = storefrontDisplayPrice(variant.price, product);
  const deliveryFee = storefrontDoorDeliveryLineFee(product, doorDelivery);
  const { discountNgn } = useReferralDiscount(variant.price);
  const undiscountedTotal = storefrontOrderTotal(variant.price, product, doorDelivery);
  const total = storefrontOrderTotalAfterReferral(devicePrice, deliveryFee, discountNgn);

  const badge = storefrontProductBadge(product);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 pb-16">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6 lg:gap-10 items-start">

        {/* Left: Product summary + order details */}
        <div className="order-2 lg:order-1 space-y-4">

          {/* Back link */}
          <Link
            href={productPath(product)}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to product
          </Link>

          {/* Product card */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <div className="flex gap-4 items-start">
              <div className="relative h-24 w-24 flex-shrink-0 bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl overflow-hidden border border-slate-100">
                <Image
                  src={product.image}
                  alt={variant.displayName}
                  fill
                  className="object-contain p-2.5"
                />
                {badge && (
                  <span className="absolute top-1.5 left-1.5 text-[9px] font-bold bg-primary-600 text-white px-1.5 py-0.5 rounded-full leading-none">
                    {badge}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display font-bold text-slate-900 text-base leading-snug">
                  {variant.displayName}
                </h2>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                  {product.description}
                </p>
                <div className="mt-2">
                  <ReferralDiscountBanner catalogPriceNgn={variant.price} />
                </div>
              </div>
            </div>
          </div>

          {/* Variant pickers */}
          {product.storageOptions && product.storageOptions.length > 1 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="input-label mb-3">
                {product.variantDimension === "size" ? "Size" : "Storage"}
              </p>
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
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <p className="input-label mb-3">Color</p>
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

          {/* Order summary */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
            <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-primary-600 mb-4">
              Order Summary
            </h3>

            <div className="space-y-3">
              {/* Device price row */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600 truncate pr-4">{variant.displayName}</span>
                <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
                  ₦{devicePrice.toLocaleString()}
                </span>
              </div>

              {discountNgn > 0 && (
                <div className="flex items-center justify-between text-sm text-emerald-700">
                  <span>Referral discount</span>
                  <span className="font-semibold flex-shrink-0">-{formatNgn(discountNgn)}</span>
                </div>
              )}

              {/* Door delivery toggle */}
              <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-primary-300 hover:bg-primary-50/40 transition-all select-none">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={doorDelivery}
                    onChange={(e) => setDoorDelivery(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-800">
                      <Truck className="h-3.5 w-3.5 text-primary-600" />
                      Door delivery
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{DELIVERY_ESTIMATE_COPY}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-900 flex-shrink-0">
                  +₦{STOREFRONT_DOOR_DELIVERY_FEE_NGN.toLocaleString()}
                </span>
              </label>

              {/* Total */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <span className="font-display font-bold text-slate-900">Total</span>
                <div className="text-right">
                  <span className="font-display text-2xl font-bold text-slate-900">
                    ₦{total.toLocaleString()}
                  </span>
                  {discountNgn > 0 && (
                    <p className="text-xs text-slate-400 line-through">
                      ₦{undiscountedTotal.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Trust signals */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <Shield className="h-4 w-4 text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-medium text-emerald-800 leading-snug">
                Payment secured by escrow
              </span>
            </div>
            <div className="flex items-center gap-2.5 p-3.5 bg-blue-50 rounded-xl border border-blue-100">
              <Clock className="h-4 w-4 text-blue-600 flex-shrink-0" />
              <span className="text-xs font-medium text-blue-800 leading-snug">
                Delivery in {DELIVERY_ESTIMATE_COPY}
              </span>
            </div>
          </div>

          {/* Key features (compact) */}
          {product.features.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-card p-5">
              <h3 className="font-display font-semibold text-sm uppercase tracking-wider text-primary-600 mb-3">
                What You Get
              </h3>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {product.features.slice(0, 6).map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="flex-shrink-0 h-4 w-4 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                      <Check className="h-2.5 w-2.5 text-emerald-600" />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right: Customer form */}
        <div className="order-1 lg:order-2 lg:sticky lg:top-24">
          <CustomerForm
            title="Your Delivery Details"
            subtitle="Fill in your details and we will confirm your order within 24 hours."
            productPrice={variant.price}
            productName={variant.displayName}
            productId={product.id}
            productSlug={product.slug}
            productStorage={variant.storage}
            productColor={variant.color}
            deliveryDays={deliveryDays}
            doorDeliveryFee={storefrontCheckoutDoorFeeNgn(product, doorDelivery)}
          />
        </div>
      </div>
    </div>
  );
}

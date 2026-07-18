"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CustomerForm from "@/components/CustomerForm";
import ReferralDiscountBanner from "@/components/ReferralDiscountBanner";
import { useReferralDiscount } from "@/components/useReferralDiscount";
import { type Product, getSelectedVariant } from "@/lib/product-utils";
import { productPath } from "@/lib/product-slug";
import { storefrontProductBadge } from "@/lib/product-condition-suffix";
import {
  storefrontDisplayPrice,
  storefrontDoorDeliveryLineFee,
  storefrontCheckoutDoorFeeNgn,
  storefrontOrderTotal,
  STOREFRONT_DOOR_DELIVERY_FEE_NGN,
} from "@/lib/storefront-display-price";
import { storefrontOrderTotalAfterReferral } from "@/lib/referral/display-price";
import { formatNgn } from "@/lib/referral/config";
import { ShoppingCart, Truck } from "lucide-react";

interface OrderPageViewProps {
  product: Product;
  deliveryDays: number;
  initialStorage?: string;
  initialColor?: string;
}

export default function OrderPageView({
  product,
  deliveryDays,
  initialStorage,
  initialColor,
}: OrderPageViewProps) {
  const initialStorageIndex = useMemo(() => {
    if (!initialStorage || !product.storageOptions) return 0;
    const idx = product.storageOptions.findIndex(
      (opt) => opt.storage.toLowerCase() === initialStorage.toLowerCase()
    );
    return idx >= 0 ? idx : 0;
  }, [product, initialStorage]);

  const initialColorIndex = useMemo(() => {
    if (!initialColor || !product.colorOptions) return 0;
    const idx = product.colorOptions.findIndex(
      (c) => c.toLowerCase() === initialColor.toLowerCase()
    );
    return idx >= 0 ? idx : 0;
  }, [product, initialColor]);

  const [selectedStorageIndex, setSelectedStorageIndex] = useState(initialStorageIndex);
  const [selectedColorIndex, setSelectedColorIndex] = useState(initialColorIndex);
  const [doorDelivery, setDoorDelivery] = useState(true);

  const variant = useMemo(
    () => getSelectedVariant(product, selectedStorageIndex, selectedColorIndex),
    [product, selectedStorageIndex, selectedColorIndex]
  );

  const badge = storefrontProductBadge(product);
  const { discountNgn } = useReferralDiscount(variant.price);
  const productDisplayPrice = storefrontDisplayPrice(variant.price, product);
  const deliveryFee = storefrontDoorDeliveryLineFee(product, doorDelivery);
  const undiscountedTotal = storefrontOrderTotal(variant.price, product, doorDelivery);
  const totalPrice = storefrontOrderTotalAfterReferral(
    productDisplayPrice,
    deliveryFee,
    discountNgn
  );

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 md:py-14">
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900 mb-1">
          Complete Your Order
        </h1>
        <p className="text-slate-500 text-sm">
          Fill in your delivery details below to place your order securely.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 lg:gap-14">
        {/* Left: Product summary + price breakdown */}
        <div className="order-2 lg:order-1 lg:col-span-2">
          <div className="sticky top-24 space-y-4">
            <ReferralDiscountBanner catalogPriceNgn={variant.price} />

            {/* Product card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft overflow-hidden">
              <div className="aspect-square bg-gradient-to-br from-slate-50 to-slate-100 relative">
                <Image
                  src={product.image}
                  alt={variant.displayName}
                  fill
                  className="object-contain p-8"
                />
                {badge && (
                  <span className="absolute top-3 left-3 px-2.5 py-1 bg-primary-600 text-white text-xs font-bold rounded-full shadow-soft">
                    {badge}
                  </span>
                )}
              </div>
              <div className="p-5">
                <h2 className="font-display text-base font-bold text-slate-900 mb-1.5 leading-snug">
                  {variant.displayName}
                </h2>
                <Link
                  href={productPath(product)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  View product details
                </Link>
              </div>
            </div>

            {/* Variant: storage/size */}
            {product.storageOptions && product.storageOptions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  {product.variantDimension === "size" ? "Size" : "Storage"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.storageOptions.map((option, index) => (
                    <button
                      key={option.storage}
                      type="button"
                      onClick={() => setSelectedStorageIndex(index)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedStorageIndex === index
                          ? "border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/40"
                      }`}
                    >
                      <span className="block">{option.storage}</span>
                      <span
                        className={`block text-xs font-semibold mt-0.5 ${
                          selectedStorageIndex === index ? "text-primary-600" : "text-slate-400"
                        }`}
                      >
                        ₦{storefrontDisplayPrice(option.price, product).toLocaleString()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Variant: color */}
            {product.colorOptions && product.colorOptions.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Color
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.colorOptions.map((color, index) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColorIndex(index)}
                      className={`px-3.5 py-2 rounded-xl text-sm font-semibold border-2 transition-all ${
                        selectedColorIndex === index
                          ? "border-primary-600 bg-primary-50 text-primary-700 ring-2 ring-primary-100"
                          : "border-slate-200 bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50/40"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Order summary with price breakdown */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-soft p-5">
              <div className="flex items-center gap-2 mb-4">
                <ShoppingCart className="h-4 w-4 text-primary-600" />
                <h3 className="font-display font-semibold text-slate-900 text-sm">Order Summary</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Product</span>
                  <span className="font-semibold text-slate-900">
                    ₦{productDisplayPrice.toLocaleString()}
                  </span>
                </div>

                {discountNgn > 0 && (
                  <div className="flex items-center justify-between text-sm text-emerald-700">
                    <span>Referral discount</span>
                    <span className="font-semibold">-{formatNgn(discountNgn)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={doorDelivery}
                      onChange={(e) => setDoorDelivery(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="flex items-center gap-1.5 text-slate-600 group-hover:text-slate-800 transition-colors">
                      <Truck className="h-3.5 w-3.5" />
                      Door delivery
                    </span>
                  </label>
                  <span
                    className={`font-semibold tabular-nums transition-colors ${
                      deliveryFee > 0 ? "text-slate-900" : "text-slate-400 line-through"
                    }`}
                  >
                    ₦{STOREFRONT_DOOR_DELIVERY_FEE_NGN.toLocaleString()}
                  </span>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-baseline justify-between">
                  <span className="font-display font-bold text-slate-900 text-sm">Total</span>
                  <div className="text-right">
                    <span className="font-display text-2xl font-bold text-primary-700 tabular-nums">
                      ₦{totalPrice.toLocaleString()}
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
          </div>
        </div>

        {/* Right: Customer form */}
        <div className="order-1 lg:order-2 lg:col-span-3">
          <CustomerForm
            title="Delivery Details"
            subtitle="We will contact you to confirm your order before processing payment."
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

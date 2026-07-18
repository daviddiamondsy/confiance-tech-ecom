"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Truck, ShieldCheck, Package } from "lucide-react";
import CustomerForm from "@/components/CustomerForm";
import ReferralDiscountBanner from "@/components/ReferralDiscountBanner";
import { useReferralDiscount } from "@/components/useReferralDiscount";
import { getSelectedVariant } from "@/lib/product-utils";
import {
  storefrontDisplayPrice,
  storefrontDoorDeliveryLineFee,
  storefrontCheckoutDoorFeeNgn,
  storefrontOrderTotal,
  STOREFRONT_DOOR_DELIVERY_FEE_NGN,
} from "@/lib/storefront-display-price";
import { storefrontOrderTotalAfterReferral } from "@/lib/referral/display-price";
import { formatNgn } from "@/lib/referral/config";
import { DELIVERY_ESTIMATE_COPY } from "@/lib/delivery-deadline";
import type { Product } from "@/lib/product-utils";

interface CheckoutViewProps {
  product: Product;
  selectedStorage?: string;
  selectedColor?: string;
  deliveryDays: number;
}

export default function CheckoutView({
  product,
  selectedStorage,
  selectedColor,
  deliveryDays,
}: CheckoutViewProps) {
  const [doorDelivery, setDoorDelivery] = useState(true);

  const { storageIndex, colorIndex } = useMemo(() => {
    const si =
      selectedStorage && product.storageOptions
        ? Math.max(
            0,
            product.storageOptions.findIndex((o) => o.storage === selectedStorage)
          )
        : 0;
    const ci =
      selectedColor && product.colorOptions
        ? Math.max(
            0,
            product.colorOptions.findIndex((c) => c === selectedColor)
          )
        : 0;
    return { storageIndex: si, colorIndex: ci };
  }, [product, selectedStorage, selectedColor]);

  const variant = useMemo(
    () => getSelectedVariant(product, storageIndex, colorIndex),
    [product, storageIndex, colorIndex]
  );

  const { discountNgn } = useReferralDiscount(variant.price);
  const productDisplayPrice = storefrontDisplayPrice(variant.price, product);
  const deliveryFee = storefrontDoorDeliveryLineFee(product, doorDelivery);
  const undiscountedTotal = storefrontOrderTotal(variant.price, product, doorDelivery);
  const totalPrice = storefrontOrderTotalAfterReferral(
    productDisplayPrice,
    deliveryFee,
    discountNgn
  );

  const changeVariantHref = useMemo(() => {
    const base = `/products/${product.slug}`;
    const params = new URLSearchParams();
    if (variant.storage) params.set("storage", variant.storage);
    if (variant.color) params.set("color", variant.color);
    const qs = params.toString();
    return qs ? `${base}?${qs}` : base;
  }, [product.slug, variant.storage, variant.color]);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href={`/products/${product.slug}`}
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-primary-600 transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to product
      </Link>

      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-slate-900">
          Place Your Order
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Review your order and complete your delivery details below.
        </p>
      </div>

      <ReferralDiscountBanner catalogPriceNgn={variant.price} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <div className="order-2 lg:order-1 lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden sticky top-24">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
              <h2 className="font-display text-base font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-slate-300" />
                Order Summary
              </h2>
            </div>

            <div className="p-6">
              <div className="flex gap-4 mb-6 pb-6 border-b border-slate-100">
                <div className="relative h-20 w-20 flex-shrink-0 bg-slate-50 rounded-xl overflow-hidden border border-slate-100">
                  <Image
                    src={product.image}
                    alt={variant.displayName}
                    fill
                    className="object-contain p-2"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm leading-tight">
                    {variant.displayName}
                  </p>
                  {(variant.storage || variant.color) && (
                    <p className="text-xs text-slate-500 mt-1">
                      {[variant.storage, variant.color].filter(Boolean).join(" - ")}
                    </p>
                  )}
                  <Link
                    href={changeVariantHref}
                    className="text-xs text-primary-600 hover:text-primary-700 underline-offset-2 hover:underline mt-1 inline-block"
                  >
                    Change
                  </Link>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Product price</span>
                  <span className="font-medium text-slate-900">
                    &#8358;{productDisplayPrice.toLocaleString()}
                  </span>
                </div>

                {discountNgn > 0 && (
                  <div className="flex items-center justify-between text-emerald-700">
                    <span>Referral discount</span>
                    <span className="font-medium">-{formatNgn(discountNgn)}</span>
                  </div>
                )}

                <label className="flex items-center justify-between gap-3 cursor-pointer group rounded-xl border border-slate-100 bg-slate-50/60 p-3 hover:border-primary-200 hover:bg-primary-50/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={doorDelivery}
                      onChange={(e) => setDoorDelivery(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer flex-shrink-0"
                    />
                    <div>
                      <span className="text-slate-700 font-medium flex items-center gap-1.5">
                        <Truck className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        Door delivery
                      </span>
                      <span className="text-xs text-slate-400">{DELIVERY_ESTIMATE_COPY}</span>
                    </div>
                  </div>
                  <span className="font-medium text-emerald-700 flex-shrink-0">
                    +&#8358;{STOREFRONT_DOOR_DELIVERY_FEE_NGN.toLocaleString()}
                  </span>
                </label>

                <div className="border-t border-slate-200 pt-3 flex items-center justify-between">
                  <span className="font-semibold text-slate-900 text-base">Total</span>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-slate-900">
                      &#8358;{totalPrice.toLocaleString()}
                    </span>
                    {discountNgn > 0 && (
                      <p className="text-xs text-slate-400 line-through">
                        &#8358;{undiscountedTotal.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5">
                <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-700 leading-relaxed">
                  Your payment is protected by escrow. Funds are held safely and only released once you confirm delivery.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 lg:order-2 lg:col-span-3">
          <CustomerForm
            title="Delivery Details"
            subtitle="Enter your delivery information to complete your order."
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

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productPath } from "@/lib/product-slug";
import { storefrontProductBadge } from "@/lib/product-condition-suffix";
import type { Product } from "@/lib/product-utils";
import { storefrontDisplayPrice } from "@/lib/storefront-display-price";

interface ProductCardProps {
  product: Product;
  variant?: "grid" | "list";
}

export default function ProductCard({ product, variant = "grid" }: ProductCardProps) {
  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null;
  const badge = storefrontProductBadge(product);

  if (variant === "list") {
    return (
      <article className="group card-elevated overflow-hidden hover:-translate-y-0.5">
        <div className="flex flex-col sm:flex-row">
          <Link
            href={productPath(product)}
            className="relative aspect-square sm:aspect-auto sm:w-48 sm:min-h-[180px] bg-slate-100 flex-shrink-0"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
            />
            {badge && (
              <span className="absolute top-3 left-3 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-soft">
                {badge}
              </span>
            )}
          </Link>

          <div className="flex flex-1 flex-col justify-between p-5">
            <div>
              <Link href={productPath(product)}>
                <h3 className="font-display font-semibold text-slate-900 mb-2 group-hover:text-primary-600 transition-colors leading-snug">
                  {product.name}
                </h3>
              </Link>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-xl font-bold text-slate-900">
                  ₦{storefrontDisplayPrice(product.price, product).toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ₦{product.originalPrice.toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            <Link href={productPath(product)}>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700">
                View Product
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group card-elevated overflow-hidden hover:-translate-y-1.5 hover:shadow-card-hover flex flex-col h-full transition-all duration-300">
      <Link href={productPath(product)} className="block">
        <div className="relative aspect-square bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-5 group-hover:scale-[1.07] transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
            {badge && (
              <span className="px-2.5 py-1 bg-primary-600 text-white text-[11px] font-bold rounded-full shadow-soft tracking-wide">
                {badge}
              </span>
            )}
            {discount && (
              <span className={`px-2.5 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-full shadow-soft tracking-wide ${!badge ? "ml-auto" : ""}`}>
                -{discount}%
              </span>
            )}
          </div>
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link href={productPath(product)}>
          <h3 className="font-display font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug text-sm">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mb-4 mt-auto pt-2">
          <span className="text-xl font-bold text-slate-900">
            ₦{storefrontDisplayPrice(product.price, product).toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-slate-400 line-through">
              ₦{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <Link href={productPath(product)}>
          <span className="w-full py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-primary-600 hover:shadow-glow transition-all duration-200 flex items-center justify-center gap-2 group/btn">
            View Product
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
          </span>
        </Link>
      </div>
    </article>
  );
}

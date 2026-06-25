import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { productPath } from "@/lib/product-slug";
import { storefrontProductBadge } from "@/lib/product-condition-suffix";

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  badge?: string;
}

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
                  ₦{product.price.toLocaleString()}
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
    <article className="group card-elevated overflow-hidden hover:-translate-y-1 flex flex-col h-full">
      <Link href={productPath(product)} className="block">
        <div className="relative aspect-square bg-slate-100 overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4 group-hover:scale-105 transition-transform duration-500 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {badge && (
            <span className="absolute top-3 left-3 px-3 py-1 bg-primary-600 text-white text-xs font-semibold rounded-full shadow-soft">
              {badge}
            </span>
          )}
          {discount && (
            <span className="absolute top-3 right-3 px-3 py-1 bg-rose-500 text-white text-xs font-semibold rounded-full shadow-soft">
              -{discount}%
            </span>
          )}
        </div>
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link href={productPath(product)}>
          <h3 className="font-display font-semibold text-slate-900 mb-3 line-clamp-2 group-hover:text-primary-600 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-xl font-bold text-slate-900">
            ₦{product.price.toLocaleString()}
          </span>
          {product.originalPrice && (
            <span className="text-sm text-slate-400 line-through">
              ₦{product.originalPrice.toLocaleString()}
            </span>
          )}
        </div>

        <Link href={productPath(product)} className="mt-auto">
          <span className="w-full py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-primary-600 transition-all duration-200 flex items-center justify-center gap-2 group/btn">
            View Product
            <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      </div>
    </article>
  );
}

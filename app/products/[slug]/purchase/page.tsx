import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PurchasePage from "@/components/PurchasePage";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HOLDAM_DELIVERY_DAYS } from "@/lib/delivery-deadline";
import { productPath } from "@/lib/product-slug";
import { getProductBySlug } from "@/lib/products";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface ProductPurchasePageProps {
  params: {
    slug: string;
  };
  searchParams: {
    storage?: string;
    color?: string;
  };
}

export default async function ProductPurchasePage({
  params,
  searchParams,
}: ProductPurchasePageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  if (product.slug.toLowerCase() !== params.slug.trim().toLowerCase()) {
    const base = productPath(product);
    const qs = new URLSearchParams();
    if (searchParams.storage) qs.set("storage", searchParams.storage);
    if (searchParams.color) qs.set("color", searchParams.color);
    const queryString = qs.toString();
    redirect(`${base}/purchase${queryString ? `?${queryString}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <Link href="/products" className="hover:text-primary-600 transition-colors">
              Products
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <Link
              href={productPath(product)}
              className="hover:text-primary-600 transition-colors truncate max-w-[10rem] sm:max-w-[14rem]"
            >
              {product.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 flex-shrink-0" />
            <span className="text-slate-900 font-medium">Order</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3 md:py-5">
        <h1 className="font-display text-xl md:text-2xl font-bold text-slate-900">
          Complete Your Order
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your selection and enter your delivery details below.
        </p>
      </div>

      <PurchasePage
        product={product}
        initialStorage={searchParams.storage}
        initialColor={searchParams.color}
        deliveryDays={HOLDAM_DELIVERY_DAYS}
      />

      <Footer />
    </div>
  );
}

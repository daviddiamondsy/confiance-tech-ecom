import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderPageView from "@/components/OrderPageView";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import { HOLDAM_DELIVERY_DAYS } from "@/lib/delivery-deadline";
import { productPath } from "@/lib/product-slug";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: { slug: string };
  searchParams: { storage?: string; color?: string };
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link href="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <Link
              href={productPath(product)}
              className="hover:text-primary-600 transition-colors truncate max-w-[180px]"
            >
              {product.name}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-slate-900 font-medium">Order</span>
          </nav>
        </div>
      </div>

      <OrderPageView
        product={product}
        deliveryDays={HOLDAM_DELIVERY_DAYS}
        initialStorage={searchParams.storage}
        initialColor={searchParams.color}
      />

      <Footer />
    </div>
  );
}

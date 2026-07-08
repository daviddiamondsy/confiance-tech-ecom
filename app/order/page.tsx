import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrderPageView from "@/components/OrderPageView";
import { getProductBySlug } from "@/lib/products";
import { HOLDAM_DELIVERY_DAYS } from "@/lib/delivery-deadline";
import { productPath } from "@/lib/product-slug";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  searchParams: {
    slug?: string;
    storage?: string;
    color?: string;
  };
}

export default async function OrderPage({ searchParams }: OrderPageProps) {
  const { slug, storage, color } = searchParams;

  if (!slug) redirect("/products");

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500 flex-wrap">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            <span className="text-slate-300">/</span>
            <Link
              href={productPath(product)}
              className="hover:text-primary-600 transition-colors truncate max-w-[140px]"
            >
              {product.name}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">Order</span>
          </nav>
        </div>
      </div>

      <OrderPageView
        product={product}
        initialStorage={storage}
        initialColor={color}
        deliveryDays={HOLDAM_DELIVERY_DAYS}
      />

      <Footer />
    </div>
  );
}

import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CheckoutView from "@/components/CheckoutView";
import { getProductBySlug } from "@/lib/products";
import { HOLDAM_DELIVERY_DAYS } from "@/lib/delivery-deadline";

export const dynamic = "force-dynamic";

interface BuyPageProps {
  params: {
    slug: string;
  };
  searchParams: {
    storage?: string;
    color?: string;
  };
}

export default async function BuyPage({ params, searchParams }: BuyPageProps) {
  const product = await getProductBySlug(params.slug);

  if (!product) {
    notFound();
  }

  if (product.slug.toLowerCase() !== params.slug.trim().toLowerCase()) {
    const qs = new URLSearchParams();
    if (searchParams.storage) qs.set("storage", searchParams.storage);
    if (searchParams.color) qs.set("color", searchParams.color);
    const query = qs.toString();
    redirect(`/products/${product.slug}/buy${query ? `?${query}` : ""}`);
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">
              Home
            </Link>
            <span className="text-slate-300">/</span>
            <Link href="/products" className="hover:text-primary-600 transition-colors">
              Products
            </Link>
            <span className="text-slate-300">/</span>
            <Link
              href={`/products/${product.slug}`}
              className="hover:text-primary-600 transition-colors truncate max-w-[160px]"
            >
              {product.name}
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium">Order</span>
          </nav>
        </div>
      </div>

      <CheckoutView
        product={product}
        selectedStorage={searchParams.storage}
        selectedColor={searchParams.color}
        deliveryDays={HOLDAM_DELIVERY_DAYS}
      />

      <Footer />
    </div>
  );
}

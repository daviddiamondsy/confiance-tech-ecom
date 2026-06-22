import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MetaPixelViewContent from "@/components/MetaPixel";
import ProductDetailView from "@/components/ProductDetailView";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HOLDAM_DELIVERY_DAYS } from "@/lib/delivery-deadline";
import { products, getProductById } from "@/lib/products";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

interface ProductPageProps {
  params: {
    id: string;
  };
}

export default function ProductPage({ params }: ProductPageProps) {
  const product = getProductById(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <MetaPixelViewContent
        contentName={product.name}
        contentIds={[product.id]}
        value={product.price}
        currency="NGN"
      />
      <Header />

      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center gap-2 text-sm text-slate-500">
            <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
            <span className="text-slate-300">/</span>
            <Link href="/products" className="hover:text-primary-600 transition-colors">Products</Link>
            <span className="text-slate-300">/</span>
            <span className="text-slate-900 font-medium truncate">{product.name}</span>
          </nav>
        </div>
      </div>

      <ProductDetailView product={product} deliveryDays={HOLDAM_DELIVERY_DAYS} />

      <Footer />
    </div>
  );
}

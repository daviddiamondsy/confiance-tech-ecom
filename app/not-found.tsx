import Link from "next/link";
import { Home, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden text-center">
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 h-2" />
          <div className="p-10 md:p-14">
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="font-display text-2xl font-black text-slate-400">404</span>
            </div>
            <span className="section-label mb-4 block">Page not found</span>
            <h1 className="font-display text-3xl font-bold text-slate-900 mb-3 tracking-tight">
              Oops, nothing here
            </h1>
            <p className="text-slate-500 mb-8 leading-relaxed max-w-sm mx-auto">
              The page you are looking for does not exist or may have moved. Head back and browse our devices.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/" className="btn-primary w-full sm:w-auto">
                <Home className="h-4 w-4" />
                Go home
              </Link>
              <Link href="/products" className="btn-outline w-full sm:w-auto">
                <Package className="h-4 w-4" />
                Browse products
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

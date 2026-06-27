import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card-elevated p-10 text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchX className="h-10 w-10 text-slate-400" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-600 mb-3">
            404
          </p>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">
            Page not found
          </h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            The page you are looking for does not exist or may have moved. Check the URL or head
            back to browse our devices.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/" className="btn-primary w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Go to home
            </Link>
            <Link href="/products" className="btn-outline w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
              Browse products
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

import Link from "next/link";
import { CheckCircle, ArrowLeft, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card-elevated p-10 text-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-500" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            Order Received
          </span>
          <h1 className="font-display text-3xl font-bold text-slate-900 mb-3">
            Thank You For Your Order!
          </h1>
          <p className="text-slate-600 mb-8 leading-relaxed">
            Your order has been received successfully and sent to our team. We will contact you shortly to confirm delivery details.
          </p>
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 mb-8">
            <p className="text-sm text-emerald-700">
              Please keep your phone nearby. Our team will reach out using the details you submitted.
            </p>
          </div>
          <Link href="/products" className="btn-primary">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );
}

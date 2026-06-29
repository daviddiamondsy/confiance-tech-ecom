import Link from "next/link";
import { CheckCircle, ArrowLeft, Gift, Phone, Package } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function ThankYouPage() {
  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        {/* Main card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
          {/* Top accent */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2" />

          <div className="p-8 md:p-12 text-center">
            {/* Icon */}
            <div className="relative inline-flex items-center justify-center mb-6">
              <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-emerald-500" />
              </div>
              <div className="absolute -top-1 -right-1 w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center shadow-glow">
                <Package className="h-4 w-4 text-white" />
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full mb-4 uppercase tracking-wider">
              Order Confirmed
            </span>

            <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
              Thank You!
            </h1>
            <p className="text-slate-600 leading-relaxed mb-8 max-w-md mx-auto">
              Your order has been received and sent to our team. We will contact you shortly to confirm your delivery details.
            </p>

            {/* Next steps */}
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 mb-8 text-left">
              <h3 className="font-display font-semibold text-slate-900 mb-4 text-sm uppercase tracking-wider">What happens next</h3>
              <div className="space-y-3">
                {[
                  { icon: Phone, text: "Our team calls to confirm your order and delivery address." },
                  { icon: Package, text: "Your device is carefully packaged and dispatched." },
                  { icon: CheckCircle, text: "You receive your premium device at your door." },
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="flex-shrink-0 h-8 w-8 rounded-xl bg-primary-100 flex items-center justify-center">
                      <step.icon className="h-4 w-4 text-primary-600" />
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed pt-1">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/products" className="btn-outline">
                <ArrowLeft className="h-4 w-4" />
                Browse more products
              </Link>
              <Link href="/refer" className="btn-primary">
                <Gift className="h-4 w-4" />
                Refer &amp; Earn
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

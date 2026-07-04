import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HomeProductCollections from "@/components/HomeProductCollections";
import HomeReferAndEarn from "@/components/HomeReferAndEarn";
import FaqAccordion from "@/components/FaqAccordion";
import TrustFeaturesGrid from "@/components/TrustFeaturesGrid";
import { ArrowRight, Gift, MessageCircle, Sparkles, ShieldCheck, Star, Zap } from "lucide-react";
import Link from "next/link";
import { getProducts } from "@/lib/products";
import { STOREFRONT_HERO_COPY, STOREFRONT_FEATURED_COPY } from "@/lib/device-quality-copy";
import { STOREFRONT_SOCIAL_LINKS } from "@/lib/storefront-contact";

export const dynamic = "force-dynamic";

export default async function Home() {
  const products = await getProducts();

  return (
    <div className="min-h-screen bg-surface-muted">
      <Header />

      {/* Hero Section */}
      <section className="relative bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 bg-hero-mesh" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550009158-9ebf69056955?w=1920&q=80')] bg-cover bg-center opacity-[0.07]" />
        {/* Decorative orbs */}
        <div className="absolute top-1/4 right-1/4 h-80 w-80 rounded-full bg-primary-500/10 blur-3xl pointer-events-none animate-float" />
        <div className="absolute -bottom-20 right-10 h-64 w-64 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-surface-muted to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 md:py-40">
          <div className="max-w-3xl animate-slide-up">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-primary-300 text-sm font-medium rounded-full mb-8 border border-white/10 backdrop-blur-sm">
                <Sparkles className="h-4 w-4" />
                Trusted Tech, Built to Last
              </span>
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.1] tracking-tight">
                Computing You Can
                <span className="block mt-1 bg-gradient-to-r from-primary-400 via-violet-400 to-primary-300 bg-clip-text text-transparent">
                  Count On
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-400 mb-10 max-w-xl leading-relaxed">
                {STOREFRONT_HERO_COPY}
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link href="/products" className="btn-primary px-8 py-4 text-base">
                  Shop Now
                  <ArrowRight className="h-5 w-5" />
                </Link>
                {/* <a
                  href={STOREFRONT_SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-6 py-4 text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Chat with us
                </a> */}
                <Link href="/refer" className="btn-secondary px-6 py-4 text-base">
                  <Gift className="h-5 w-5" />
                  Refer &amp; Earn
                </Link>
              </div>

              {/* Social proof stats */}
              <div className="mt-12 flex flex-wrap gap-6">
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/10">
                    <ShieldCheck className="h-4 w-4 text-primary-300" />
                  </span>
                  <span className="text-slate-300 font-medium">Verified Quality</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/10">
                    <Zap className="h-4 w-4 text-amber-400" />
                  </span>
                  <span className="text-slate-300 font-medium">Fast Nationwide Delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-white/10">
                    <Star className="h-4 w-4 text-yellow-400" />
                  </span>
                  <span className="text-slate-300 font-medium">Top-Rated Service</span>
                </div>
              </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative -mt-8 z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <TrustFeaturesGrid />
      </section>

      {/* Product collections by filter tag */}
      <section id="products" className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="section-label">Our Collections</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-4 tracking-tight">
              Featured Products
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto leading-relaxed">
              {STOREFRONT_FEATURED_COPY}
            </p>
          </div>

          <HomeProductCollections products={products} />
        </div>
      </section>

      <HomeReferAndEarn />

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white border-y border-slate-100">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="section-label">Support</span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mt-3 mb-4 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600">Got questions? We have got answers.</p>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-700 to-violet-700 text-white text-center shadow-glow">
            <div className="absolute inset-0 bg-hero-mesh opacity-30 pointer-events-none" />
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
            <div className="relative px-6 py-16 md:py-20">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 text-primary-100 text-sm font-medium rounded-full mb-6 border border-white/20">
                <Sparkles className="h-4 w-4" />
                Ready to upgrade?
              </span>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
                Find Your Next Device Today
              </h2>
              <p className="text-primary-100 text-lg max-w-xl mx-auto mb-8 leading-relaxed">
                Browse our curated selection of premium tech. Every device ships with accessories and a 7-day return guarantee.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-soft text-base"
                >
                  Browse All Products
                  <ArrowRight className="h-5 w-5" />
                </Link>
                <a
                  href={STOREFRONT_SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary px-6 py-4 text-base"
                >
                  <MessageCircle className="h-5 w-5" />
                  Ask a question
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

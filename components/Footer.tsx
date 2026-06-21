import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Mail, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-400 overflow-hidden">
      <div className="absolute inset-0 bg-hero-mesh opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-5">
              <div className="relative h-9 w-9 rounded-lg overflow-hidden ring-1 ring-white/10">
                <Image
                  src="/logo.png"
                  alt="Confiance Tech Logo"
                  fill
                  className="object-contain"
                />
              </div>
              <span className="font-display text-lg font-bold text-white tracking-tight">
                Confiance Tech
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              Your trusted source for premium refurbished tech. Quality tested, certified, and backed by our guarantee.
            </p>
            <div className="flex gap-3">
              <Link
                href="#"
                className="p-2.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Facebook className="h-4 w-4" />
              </Link>
              <Link
                href="https://instagram.com/confiance_tech"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <Instagram className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Quick Links
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-white transition-colors">
                  Products
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Customer Service
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Shipping
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Returns
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-white transition-colors">
                  Support
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-5">
              Contact Us
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 p-2 rounded-lg bg-primary-500/10">
                  <Phone className="h-4 w-4 text-primary-400" />
                </span>
                <span>+234 9035696604</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="flex-shrink-0 p-2 rounded-lg bg-primary-500/10">
                  <Mail className="h-4 w-4 text-primary-400" />
                </span>
                <span>daviddiamondsy@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Confiance Tech. All rights reserved.</p>
          <p className="text-xs">Premium refurbished tech, delivered nationwide.</p>
        </div>
      </div>
    </footer>
  );
}

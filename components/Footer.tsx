import Link from "next/link";
import { Facebook, Instagram, Phone } from "lucide-react";
import CompanyLogo from "@/components/CompanyLogo";
import { STOREFRONT_FOOTER_COPY } from "@/lib/device-quality-copy";
import {
  STOREFRONT_CALL_URL,
  STOREFRONT_PHONE,
  STOREFRONT_SOCIAL_LINKS,
  STOREFRONT_WHATSAPP_PHONE,
} from "@/lib/storefront-contact";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.098-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.883 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const socialLinkClassName =
  "inline-flex shrink-0 items-center justify-center p-2.5 rounded-lg bg-white/5 text-slate-400 hover:bg-white/10 transition-all";

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-400 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary-500/60 to-transparent" />
      <div className="absolute inset-0 bg-hero-mesh opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
          <div className="lg:col-span-1">
            <div className="mb-5 flex items-center gap-2">
              <CompanyLogo size={26} />
              <span className="font-display text-lg font-bold text-white tracking-tight">
                Confiance Tech
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6">
              {STOREFRONT_FOOTER_COPY}
            </p>
            <div className="relative z-10 flex flex-wrap gap-3">
              <a
                href={STOREFRONT_SOCIAL_LINKS.facebook}
                className={`${socialLinkClassName} hover:text-white`}
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={STOREFRONT_SOCIAL_LINKS.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className={`${socialLinkClassName} hover:text-green-400`}
                aria-label="WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <a
                href={STOREFRONT_SOCIAL_LINKS.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className={`${socialLinkClassName} hover:text-white`}
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
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
                <a href={STOREFRONT_CALL_URL} className="hover:text-white transition-colors">
                  {STOREFRONT_PHONE}
                </a>
              </li>
              <li>
                <a
                  href={STOREFRONT_SOCIAL_LINKS.whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-green-400 transition-colors"
                >
                  <WhatsAppIcon className="h-4 w-4" />
                  WhatsApp {STOREFRONT_WHATSAPP_PHONE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Confiance Tech. All rights reserved.</p>
          <p className="text-xs">Brand new and UK Grade A devices with accessories, shipped nationwide.</p>
        </div>
      </div>
    </footer>
  );
}

"use client";

import { Menu, X, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CompanyLogo from "@/components/CompanyLogo";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/refer", label: "Refer & Earn" },
    { href: "/#faq", label: "FAQ" },
  ];

  const isActive = (href: string) => {
    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        scrolled
          ? "bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-soft"
          : "glass-header"
      )}
    >
      {/* Announcement bar */}
      <div className="bg-gradient-to-r from-primary-600 via-violet-600 to-primary-600 text-white text-center py-1.5 px-4 text-xs font-medium">
        <span className="inline-flex items-center gap-1.5">
          <Zap className="h-3 w-3 text-yellow-300" />
          Fast nationwide delivery · Brand new &amp; UK Grade A devices
          <Zap className="h-3 w-3 text-yellow-300" />
        </span>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="group flex items-center gap-2">
            <CompanyLogo size={28} priority className="group-hover:scale-105 transition-transform duration-200" />
            <span className="font-display text-lg font-bold text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">
              Confiance<span className="text-primary-600 group-hover:text-slate-900 transition-colors"> Tech</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isActive(link.href)
                    ? "text-primary-600 bg-primary-50"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary-600" />
                )}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all duration-200 shadow-soft"
            >
              Shop Now
            </Link>
          </div>

          <button
            className="md:hidden p-2.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-slate-100 bg-white/98 backdrop-blur-xl transition-all duration-300 overflow-hidden",
          mobileMenuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col px-4 py-3 gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={cn(
                "py-3 px-3 text-sm font-medium rounded-xl transition-colors",
                isActive(link.href)
                  ? "text-primary-600 bg-primary-50"
                  : "text-slate-700 hover:text-primary-600 hover:bg-slate-50"
              )}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products"
            onClick={() => setMobileMenuOpen(false)}
            className="mt-2 btn-primary w-full text-sm py-3"
          >
            Shop Now
          </Link>
        </nav>
      </div>
    </header>
  );
}

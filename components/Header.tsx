"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/products", label: "Products" },
    { href: "/#faq", label: "FAQ" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full glass-header">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-9 w-9 rounded-lg overflow-hidden ring-1 ring-slate-200/80 group-hover:ring-primary-300 transition-all">
              <Image
                src="/logo.png"
                alt="Confiance Tech Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <span className="font-display text-lg font-bold text-slate-900 tracking-tight">
              Confiance Tech
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 rounded-lg hover:bg-primary-50 transition-all duration-200"
              >
                {link.label}
              </Link>
            ))}
            <Link href="/products" className="ml-3 btn-primary text-sm py-2.5 px-5">
              Shop Now
            </Link>
          </nav>

          <button
            className="md:hidden p-2.5 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "md:hidden border-t border-slate-100 bg-white/95 backdrop-blur-xl transition-all duration-300",
          mobileMenuOpen ? "max-h-72 opacity-100" : "max-h-0 opacity-0 overflow-hidden"
        )}
      >
        <nav className="flex flex-col px-4 py-3">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="py-3 px-2 text-sm font-medium text-slate-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/products"
            className="mt-2 btn-primary text-sm py-3"
            onClick={() => setMobileMenuOpen(false)}
          >
            Shop Now
          </Link>
        </nav>
      </div>
    </header>
  );
}

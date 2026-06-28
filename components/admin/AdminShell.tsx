"use client";

import Link from "next/link";
import {
  DollarSign,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Package,
  Tags,
  Gift,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminTab = "overview" | "pricing" | "filters" | "products" | "referrals" | "orders";

interface AdminShellProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { id: AdminTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "filters", label: "Filter tags", icon: Tags },
  { id: "products", label: "Products", icon: Package },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "referrals", label: "Referrals", icon: Gift },
];

export default function AdminShell({
  activeTab,
  onTabChange,
  onLogout,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="glass-header sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 mb-0.5">
              Confiance Tech
            </p>
            <h1 className="font-display text-xl font-bold text-slate-900">Store admin</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="btn-outline text-sm py-2 px-4 hidden sm:inline-flex"
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              View store
            </Link>
            <button type="button" onClick={onLogout} className="btn-outline text-sm py-2 px-4">
              <LogOut className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>

        <nav
          className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-0 flex gap-1 overflow-x-auto"
          aria-label="Admin sections"
        >
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === id
                  ? "border-primary-600 text-primary-700"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
              )}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">{children}</main>
    </div>
  );
}

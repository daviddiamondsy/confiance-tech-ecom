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
  ShieldCheck,
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
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "products", label: "Products", icon: Package },
  { id: "pricing", label: "Pricing", icon: DollarSign },
  { id: "filters", label: "Filter tags", icon: Tags },
  { id: "referrals", label: "Referrals", icon: Gift },
];

export default function AdminShell({
  activeTab,
  onTabChange,
  onLogout,
  children,
}: AdminShellProps) {
  const activeLabel = NAV_ITEMS.find((item) => item.id === activeTab)?.label ?? "";

  return (
    <div className="min-h-screen bg-surface-muted flex flex-col lg:flex-row">
      {/* ── Sidebar (desktop) ── */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-white border-r border-slate-100 shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-6 border-b border-slate-100">
          <div className="flex items-center gap-2.5 mb-0.5">
            <div className="rounded-lg bg-primary-600 p-1.5">
              <ShieldCheck className="h-4 w-4 text-white" aria-hidden />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary-600">
              Confiance
            </span>
          </div>
          <p className="font-display text-base font-bold text-slate-900 mt-2 leading-tight">
            Store Admin
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5" aria-label="Admin sections">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTabChange(id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                activeTab === id
                  ? "bg-primary-50 text-primary-700 shadow-sm"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              aria-current={activeTab === id ? "page" : undefined}
            >
              <Icon
                className={cn("h-4 w-4 shrink-0", activeTab === id ? "text-primary-600" : "text-slate-400")}
                aria-hidden
              />
              {label}
            </button>
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-slate-100 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-all duration-150"
          >
            <ExternalLink className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            View store
          </Link>
          <button
            type="button"
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150"
          >
            <LogOut className="h-4 w-4 text-slate-400 shrink-0" aria-hidden />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar + tab strip ── */}
      <div className="lg:hidden">
        <header className="glass-header sticky top-0 z-20">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary-600 p-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-white" aria-hidden />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 leading-none">
                  Confiance Tech
                </p>
                <h1 className="font-display text-sm font-bold text-slate-900 leading-tight">
                  Store Admin
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Link
                href="/"
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <ExternalLink className="h-3 w-3" aria-hidden />
                <span className="hidden sm:inline">Store</span>
              </Link>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
              >
                <LogOut className="h-3 w-3" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          <nav
            className="px-4 sm:px-6 pb-0 flex gap-0.5 overflow-x-auto scrollbar-none"
            aria-label="Admin sections"
          >
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTabChange(id)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap",
                  activeTab === id
                    ? "border-primary-600 text-primary-700"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
                aria-current={activeTab === id ? "page" : undefined}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {label}
              </button>
            ))}
          </nav>
        </header>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 min-w-0">
        {/* Desktop page header */}
        <div className="hidden lg:flex items-center justify-between px-8 pt-8 pb-2">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest mb-1">
              Admin / {activeLabel}
            </p>
            <h1 className="font-display text-2xl font-bold text-slate-900">{activeLabel}</h1>
          </div>
        </div>

        <main className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8 max-w-5xl">{children}</main>
      </div>
    </div>
  );
}

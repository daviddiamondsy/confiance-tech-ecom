"use client";

import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/product-utils";
import {
  ALL_PRODUCTS_FILTER,
  PRODUCTS_PAGE_SIZE,
  SORT_LABELS,
  filterProducts,
  getCatalogFilterOptions,
  getPaginationRange,
  paginateProducts,
  parseCatalogFilter,
  parseCatalogSearch,
  parsePage,
  parseProductSort,
  parseProductView,
  searchProducts,
  sortProducts,
  type ProductSort,
  type ProductView,
} from "@/lib/product-catalog-utils";
import type { ProductFilterTag } from "@/lib/product-filter-tags";
import { ChevronDown, Grid3X3, List, Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

interface ProductsCatalogProps {
  products: Product[];
  filterTags: ProductFilterTag[];
}

export default function ProductsCatalog({ products, filterTags }: ProductsCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter = parseCatalogFilter(searchParams.get("category"));
  const searchQuery = parseCatalogSearch(searchParams.get("q"));
  const sort = parseProductSort(searchParams.get("sort"));
  const view = parseProductView(searchParams.get("view"));
  const page = parsePage(searchParams.get("page"));
  const [searchInput, setSearchInput] = useState(searchQuery);

  const updateQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value == null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      const query = params.toString();
      router.push(query ? `/products?${query}` : "/products", { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (searchInput === searchQuery) return;
      updateQuery({
        q: searchInput.trim() || null,
        page: null,
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, searchQuery, updateQuery]);

  const catalogFilters = useMemo(
    () => getCatalogFilterOptions(products, filterTags),
    [products, filterTags]
  );

  const filtered = useMemo(() => {
    const categoryFiltered = filterProducts(products, activeFilter);
    const searchFiltered = searchProducts(categoryFiltered, searchQuery);
    return sortProducts(searchFiltered, sort);
  }, [products, activeFilter, searchQuery, sort]);

  const pagination = useMemo(
    () => paginateProducts(filtered, page, PRODUCTS_PAGE_SIZE),
    [filtered, page]
  );

  const pageNumbers = useMemo(
    () => getPaginationRange(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

  function handleFilterChange(nextFilter: string) {
    updateQuery({
      category: nextFilter === ALL_PRODUCTS_FILTER ? null : nextFilter,
      page: null,
    });
  }

  function handleSortChange(nextSort: ProductSort) {
    updateQuery({
      sort: nextSort === "featured" ? null : nextSort,
      page: null,
    });
  }

  function handleViewChange(nextView: ProductView) {
    updateQuery({
      view: nextView === "grid" ? null : nextView,
    });
  }

  function handlePageChange(nextPage: number) {
    updateQuery({
      page: nextPage <= 1 ? null : String(nextPage),
    });
  }

  function handleClearSearch() {
    setSearchInput("");
    updateQuery({
      q: null,
      page: null,
    });
  }

  function handleClearFilters() {
    setSearchInput("");
    updateQuery({
      category: null,
      q: null,
      page: null,
    });
  }

  const hasActiveSearch = searchQuery.length > 0;
  const hasActiveFilter = activeFilter !== ALL_PRODUCTS_FILTER;

  const showingFrom =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  return (
    <>
      {/* Filter + Search row */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Filter pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => handleFilterChange(ALL_PRODUCTS_FILTER)}
              className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === ALL_PRODUCTS_FILTER
                  ? "bg-primary-600 text-white shadow-soft"
                  : "bg-white text-slate-600 hover:bg-primary-50 hover:text-primary-600 border border-slate-200 hover:border-primary-200"
              }`}
            >
              All Products
            </button>
            {catalogFilters.map((filter) => (
              <button
                key={filter.slug}
                type="button"
                onClick={() => handleFilterChange(filter.slug)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                  activeFilter === filter.slug
                    ? "bg-primary-600 text-white shadow-soft"
                    : "bg-white text-slate-600 hover:bg-primary-50 hover:text-primary-600 border border-slate-200 hover:border-primary-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64 flex-shrink-0">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search products…"
              aria-label="Search products"
              className="w-full pl-10 pr-9 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400 transition-all"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* Sort + View row */}
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-slate-500">
            {pagination.totalItems === 0 ? (
              hasActiveSearch
                ? <span>No results for <span className="font-semibold text-slate-700">&ldquo;{searchQuery}&rdquo;</span></span>
                : "No products match this filter."
            ) : (
              <>
                Showing{" "}
                <span className="font-semibold text-slate-900">{showingFrom}–{showingTo}</span>{" "}
                of <span className="font-semibold text-slate-900">{pagination.totalItems}</span> products
              </>
            )}
          </p>

          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative hidden sm:block">
              <select
                id="product-sort"
                value={sort}
                onChange={(event) => handleSortChange(event.target.value as ProductSort)}
                className="appearance-none pl-3 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400"
              >
                {(Object.keys(SORT_LABELS) as ProductSort[]).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-0.5">
              <button
                type="button"
                aria-label="Grid view"
                onClick={() => handleViewChange("grid")}
                className={`p-2 rounded-lg transition-all ${
                  view === "grid"
                    ? "bg-primary-600 text-white shadow-soft"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                aria-label="List view"
                onClick={() => handleViewChange("list")}
                className={`p-2 rounded-lg transition-all ${
                  view === "list"
                    ? "bg-primary-600 text-white shadow-soft"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {pagination.items.length > 0 ? (
        <div
          className={
            view === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
              : "flex flex-col gap-4"
          }
        >
          {pagination.items.map((product) => (
            <ProductCard key={product.id} product={product} variant={view} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-14 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="h-7 w-7 text-slate-400" />
          </div>
          <h3 className="font-display font-semibold text-slate-900 mb-2">
            {hasActiveSearch ? `No results for "${searchQuery}"` : "No products found"}
          </h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs mx-auto">
            {hasActiveSearch || hasActiveFilter
              ? "Try adjusting your search or clearing your filters."
              : "No products are available right now. Check back soon."}
          </p>
          {(hasActiveSearch || hasActiveFilter) && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="btn-primary text-sm"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-12 flex-wrap">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>

          {pageNumbers.map((pageNumber, index) =>
            pageNumber === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400 font-medium">
                ···
              </span>
            ) : (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handlePageChange(pageNumber)}
                className={`min-w-[42px] px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pageNumber === pagination.page
                    ? "bg-primary-600 text-white shadow-soft"
                    : "bg-white border border-slate-200 text-slate-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50"
                }`}
              >
                {pageNumber}
              </button>
            )
          )}

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => handlePageChange(pagination.page + 1)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </>
  );
}

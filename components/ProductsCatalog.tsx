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
  parsePage,
  parseProductSort,
  parseProductView,
  sortProducts,
  type ProductSort,
  type ProductView,
} from "@/lib/product-catalog-utils";
import type { ProductFilterTag } from "@/lib/product-filters";
import { ChevronDown, Grid3X3, List } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";

interface ProductsCatalogProps {
  products: Product[];
  filterTags: ProductFilterTag[];
}

export default function ProductsCatalog({ products, filterTags }: ProductsCatalogProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeFilter = parseCatalogFilter(searchParams.get("category"));
  const sort = parseProductSort(searchParams.get("sort"));
  const view = parseProductView(searchParams.get("view"));
  const page = parsePage(searchParams.get("page"));

  const catalogFilters = useMemo(
    () => getCatalogFilterOptions(products, filterTags),
    [products, filterTags]
  );

  const filtered = useMemo(
    () => sortProducts(filterProducts(products, activeFilter), sort),
    [products, activeFilter, sort]
  );

  const pagination = useMemo(
    () => paginateProducts(filtered, page, PRODUCTS_PAGE_SIZE),
    [filtered, page]
  );

  const pageNumbers = useMemo(
    () => getPaginationRange(pagination.page, pagination.totalPages),
    [pagination.page, pagination.totalPages]
  );

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

  const showingFrom =
    pagination.totalItems === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const showingTo = Math.min(pagination.page * pagination.pageSize, pagination.totalItems);

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          <button
            type="button"
            onClick={() => handleFilterChange(ALL_PRODUCTS_FILTER)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
              activeFilter === ALL_PRODUCTS_FILTER
                ? "bg-primary-100 text-primary-700 ring-1 ring-primary-200"
                : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
            }`}
          >
            All Products
          </button>
          {catalogFilters.map((filter) => (
            <button
              key={filter.slug}
              type="button"
              onClick={() => handleFilterChange(filter.slug)}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all flex-shrink-0 ${
                activeFilter === filter.slug
                  ? "bg-primary-100 text-primary-700 ring-1 ring-primary-200"
                  : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label htmlFor="product-sort" className="text-sm text-slate-500">
              Sort by:
            </label>
            <div className="relative">
              <select
                id="product-sort"
                value={sort}
                onChange={(event) => handleSortChange(event.target.value as ProductSort)}
                className="appearance-none pl-3 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors cursor-pointer"
              >
                {(Object.keys(SORT_LABELS) as ProductSort[]).map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
              <ChevronDown className="h-4 w-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-0.5 bg-white border border-slate-200 rounded-xl p-1">
            <button
              type="button"
              aria-label="Grid view"
              onClick={() => handleViewChange("grid")}
              className={`p-2 rounded-lg transition-colors ${
                view === "grid" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="List view"
              onClick={() => handleViewChange("list")}
              className={`p-2 rounded-lg transition-colors ${
                view === "list" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <p className="text-sm text-slate-500 mb-6">
        {pagination.totalItems === 0 ? (
          "No products match this filter."
        ) : (
          <>
            Showing{" "}
            <span className="font-medium text-slate-900">
              {showingFrom}-{showingTo}
            </span>{" "}
            of <span className="font-medium text-slate-900">{pagination.totalItems}</span> products
          </>
        )}
      </p>

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
        <div className="card-elevated p-10 text-center">
          <p className="text-slate-600 mb-4">Try another category or clear your filters.</p>
          <button
            type="button"
            onClick={() => handleFilterChange(ALL_PRODUCTS_FILTER)}
            className="btn-primary text-sm py-2.5 px-5"
          >
            View all products
          </button>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-14 flex-wrap">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => handlePageChange(pagination.page - 1)}
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {pageNumbers.map((pageNumber, index) =>
            pageNumber === "ellipsis" ? (
              <span key={`ellipsis-${index}`} className="px-2 text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={pageNumber}
                type="button"
                onClick={() => handlePageChange(pageNumber)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  pageNumber === pagination.page
                    ? "bg-primary-600 text-white shadow-soft"
                    : "border border-slate-200 text-slate-600 hover:bg-white"
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
            className="px-4 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-white transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </>
  );
}

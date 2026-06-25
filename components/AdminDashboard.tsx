"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import ProductFormFields from "@/components/admin/ProductFormFields";
import {
  adminProductToForm,
  emptyProductForm,
  primaryYuanFromForm,
  productFormPayloadForSave,
  storageVariantsFieldError,
  type ProductFormState,
} from "@/lib/admin-product-form";
import { priceFromYuan, sellingMarkupForYuan } from "@/lib/pricing";
import type { AdminProductRecord } from "@/lib/db/products-repository";

interface PricingConfig {
  yuanToNaira: number;
  shippingNgn: number;
  sellingMarkup: number;
  expensiveYuanThreshold?: number | null;
  expensiveSellingMarkup?: number | null;
}

interface ProductFilterTag {
  slug: string;
  label: string;
}

const emptyFilterForm = {
  label: "",
  slug: "",
};

function previewFromForm(form: ProductFormState, pricing: PricingConfig) {
  const yuan = primaryYuanFromForm(form);
  if (yuan == null) {
    return { previewPrice: null, previewMarkup: null };
  }
  return {
    previewPrice: priceFromYuan(yuan, pricing),
    previewMarkup: sellingMarkupForYuan(yuan, pricing),
  };
}

export default function AdminDashboard() {
  const router = useRouter();

  const [pricing, setPricing] = useState<PricingConfig>({
    yuanToNaira: 207,
    shippingNgn: 30000,
    sellingMarkup: 1.2,
    expensiveYuanThreshold: 3500,
    expensiveSellingMarkup: 1.15,
  });
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [filterTags, setFilterTags] = useState<ProductFilterTag[]>([]);
  const [filterForm, setFilterForm] = useState(emptyFilterForm);
  const [draftFilterLabels, setDraftFilterLabels] = useState<Record<string, string>>({});
  const [editForms, setEditForms] = useState<Record<string, ProductFormState>>({});
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [pricingMessage, setPricingMessage] = useState("");
  const [filterMessages, setFilterMessages] = useState<Record<string, string>>({});
  const [editMessages, setEditMessages] = useState<Record<string, string>>({});
  const [filterFormMessage, setFilterFormMessage] = useState("");
  const [filterFormError, setFilterFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingEditId, setSavingEditId] = useState<string | null>(null);
  const [creatingFilter, setCreatingFilter] = useState(false);
  const [applyingSchema, setApplyingSchema] = useState(false);
  const [importingCatalog, setImportingCatalog] = useState(false);
  const [deletingFilterSlug, setDeletingFilterSlug] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const createPreview = useMemo(
    () => previewFromForm(productForm, pricing),
    [productForm, pricing]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pricingRes, productsRes, filtersRes] = await Promise.all([
        fetch("/api/admin/pricing"),
        fetch("/api/admin/products"),
        fetch("/api/admin/filters"),
      ]);

      if (
        pricingRes.status === 401 ||
        productsRes.status === 401 ||
        filtersRes.status === 401
      ) {
        router.push("/admin/login");
        return;
      }

      if (pricingRes.ok) {
        setPricing(await pricingRes.json());
      }

      let loadedFilters: ProductFilterTag[] = [];
      if (filtersRes.ok) {
        const filterData = await filtersRes.json();
        loadedFilters = filterData.filters ?? [];
        setFilterTags(loadedFilters);
        const labelDrafts: Record<string, string> = {};
        for (const filter of loadedFilters) {
          labelDrafts[filter.slug] = filter.label;
        }
        setDraftFilterLabels(labelDrafts);
      }

      if (productsRes.ok) {
        const data = await productsRes.json();
        const list: AdminProductRecord[] = data.products ?? [];
        setProducts(list);
        const nextEditForms: Record<string, ProductFormState> = {};
        for (const product of list) {
          nextEditForms[product.id] = adminProductToForm(product);
        }
        setEditForms(nextEditForms);
        setProductForm((prev) => ({
          ...prev,
          filterSlug: prev.filterSlug || loadedFilters[0]?.slug || "",
        }));
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handlePricingSubmit(event: FormEvent) {
    event.preventDefault();
    setPricingMessage("");
    setSavingPricing(true);

    try {
      const response = await fetch("/api/admin/pricing", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pricing),
      });

      if (!response.ok) {
        const data = await response.json();
        setPricingMessage(data.error ?? "Could not save pricing");
        return;
      }

      setPricing(await response.json());
      setPricingMessage("Pricing updated. All catalog prices were recalculated.");
    } catch {
      setPricingMessage("Could not reach the server. Try again.");
    } finally {
      setSavingPricing(false);
    }
  }

  async function handleCreateProduct(event: FormEvent) {
    event.preventDefault();
    setCreateMessage("");
    setCreateError("");

    const storageVariantsError = storageVariantsFieldError(productForm.storageVariants);
    if (storageVariantsError) {
      setCreateError(storageVariantsError);
      return;
    }

    setCreatingProduct(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productFormPayloadForSave(productForm)),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(
          data.detail
            ? `${data.error ?? "Could not create product"}: ${data.detail}`
            : (data.error ?? "Could not create product")
        );
        return;
      }

      const created = data.product as AdminProductRecord;
      setProducts((prev) => [...prev, created]);
      setEditForms((prev) => ({
        ...prev,
        [created.id]: adminProductToForm(created),
      }));
      setProductForm({
        ...emptyProductForm,
        filterSlug: filterTags[0]?.slug ?? "",
      });
      setCreateMessage(
        `Added ${created.name} at ₦${created.price.toLocaleString()} (yuan ${created.yuanCost}).`
      );
    } catch {
      setCreateError("Could not reach the server. Try again.");
    } finally {
      setCreatingProduct(false);
    }
  }

  async function handleImportCatalog() {
    setFilterFormMessage("");
    setFilterFormError("");
    setImportingCatalog(true);

    try {
      const response = await fetch("/api/admin/seed", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setFilterFormError(
          data.detail
            ? `${data.error ?? "Could not import catalog"}: ${data.detail}`
            : (data.error ?? "Could not import catalog")
        );
        return;
      }

      setFilterFormMessage(data.message ?? "Default catalog imported.");
      await loadData();
    } catch {
      setFilterFormError("Could not reach the server. Try again.");
    } finally {
      setImportingCatalog(false);
    }
  }

  async function handleApplySchema() {
    setFilterFormMessage("");
    setFilterFormError("");
    setApplyingSchema(true);

    try {
      const response = await fetch("/api/admin/setup", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setFilterFormError(
          data.detail
            ? `${data.error ?? "Could not apply schema"}: ${data.detail}`
            : (data.error ?? "Could not apply schema")
        );
        return;
      }

      setFilterFormMessage(data.message ?? "Database schema applied.");
      await loadData();
    } catch {
      setFilterFormError("Could not reach the server. Try again.");
    } finally {
      setApplyingSchema(false);
    }
  }

  async function handleCreateFilter(event: FormEvent) {
    event.preventDefault();
    setFilterFormMessage("");
    setFilterFormError("");
    setCreatingFilter(true);

    try {
      const response = await fetch("/api/admin/filters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filterForm),
      });
      const data = await response.json();

      if (!response.ok) {
        setFilterFormError(
          data.detail
            ? `${data.error ?? "Could not create filter tag"}: ${data.detail}`
            : (data.error ?? "Could not create filter tag")
        );
        return;
      }

      const created = data.filter as ProductFilterTag;
      setFilterTags((prev) => [...prev, created]);
      setDraftFilterLabels((prev) => ({ ...prev, [created.slug]: created.label }));
      setFilterForm(emptyFilterForm);
      setProductForm((prev) => ({ ...prev, filterSlug: prev.filterSlug || created.slug }));
      setFilterFormMessage(`Added filter tag "${created.label}".`);
    } catch {
      setFilterFormError("Could not reach the server. Try again.");
    } finally {
      setCreatingFilter(false);
    }
  }

  async function handleFilterLabelSave(slug: string) {
    setFilterMessages((prev) => ({ ...prev, [slug]: "" }));

    try {
      const response = await fetch("/api/admin/filters", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, label: draftFilterLabels[slug] ?? "" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFilterMessages((prev) => ({
          ...prev,
          [slug]: data.error ?? "Could not save filter label",
        }));
        return;
      }

      const updated = data.filter as ProductFilterTag;
      setFilterTags((prev) =>
        prev.map((filter) => (filter.slug === slug ? updated : filter))
      );
      setFilterMessages((prev) => ({
        ...prev,
        [slug]: "Filter label saved.",
      }));
    } catch {
      setFilterMessages((prev) => ({
        ...prev,
        [slug]: "Could not reach the server. Try again.",
      }));
    }
  }

  async function handleDeleteFilter(slug: string) {
    setFilterMessages((prev) => ({ ...prev, [slug]: "" }));
    setDeletingFilterSlug(slug);

    try {
      const response = await fetch(`/api/admin/filters?slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        setFilterMessages((prev) => ({
          ...prev,
          [slug]: data.error ?? "Could not delete filter tag",
        }));
        return;
      }

      setFilterTags((prev) => prev.filter((filter) => filter.slug !== slug));
      setFilterFormMessage(`Removed filter tag "${slug}".`);
    } catch {
      setFilterMessages((prev) => ({
        ...prev,
        [slug]: "Could not reach the server. Try again.",
      }));
    } finally {
      setDeletingFilterSlug(null);
    }
  }

  function formatStorageVariantSummary(
    variants: AdminProductRecord["storageVariants"]
  ): string {
    if (variants.length === 0) return "Single price";
    return variants.map((variant) => `${variant.storage} (${variant.yuan}¥)`).join(", ");
  }

  async function handleProductUpdate(event: FormEvent, productId: string) {
    event.preventDefault();
    setEditMessages((prev) => ({ ...prev, [productId]: "" }));
    setSavingEditId(productId);

    const form = editForms[productId];
    if (!form) return;

    const storageVariantsError = storageVariantsFieldError(form.storageVariants);
    if (storageVariantsError) {
      setEditMessages((prev) => ({ ...prev, [productId]: storageVariantsError }));
      setSavingEditId(null);
      return;
    }

    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, ...productFormPayloadForSave(form) }),
      });
      const data = await response.json();

      if (!response.ok) {
        setEditMessages((prev) => ({
          ...prev,
          [productId]: data.error ?? "Could not update product",
        }));
        return;
      }

      const updated = data.product as AdminProductRecord;
      setProducts((prev) =>
        prev.map((product) => (product.id === productId ? updated : product))
      );
      setEditForms((prev) => ({
        ...prev,
        [productId]: adminProductToForm(updated),
      }));
      setEditMessages((prev) => ({
        ...prev,
        [productId]: `Saved ${updated.name} at ₦${updated.price.toLocaleString()}.${
          updated.storageVariants.length > 0
            ? ` ${updated.storageVariants.length} storage variant(s): ${updated.storageVariants
                .map((variant) => variant.storage)
                .join(", ")}.`
            : ""
        }`,
      }));
    } catch {
      setEditMessages((prev) => ({
        ...prev,
        [productId]: "Could not reach the server. Try again.",
      }));
    } finally {
      setSavingEditId(null);
    }
  }

  function filterLabel(slug: string | null): string {
    if (!slug) return "None";
    return filterTags.find((filter) => filter.slug === slug)?.label ?? slug;
  }

  async function handleLogout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-600">
        Loading admin panel...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-muted">
      <header className="glass-header sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-slate-900">Catalog admin</h1>
            <p className="text-sm text-slate-600">Pricing, filters, products, and colors</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/" className="btn-outline text-sm py-2 px-4">
              Return to store
            </Link>
            <button type="button" onClick={handleLogout} className="btn-outline text-sm py-2 px-4">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Pricing formula</h2>
          <p className="text-sm text-slate-600 mb-6">
            Selling price = (yuan x yuan-to-naira rate + shipping) x markup, then rounded to charm
            pricing (ends in 9999). Items at or above the yuan threshold use the lower expensive-item
            markup (default 1.15 = 15%).
          </p>

          <form onSubmit={handlePricingSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="yuanToNaira" className="block text-sm font-medium text-slate-700 mb-2">
                Yuan to naira rate
              </label>
              <input
                id="yuanToNaira"
                type="number"
                step="0.01"
                min="0.01"
                className="input-field"
                value={pricing.yuanToNaira}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    yuanToNaira: Number(event.target.value),
                  }))
                }
                required
              />
            </div>

            <div>
              <label htmlFor="shippingNgn" className="block text-sm font-medium text-slate-700 mb-2">
                Shipping (NGN)
              </label>
              <input
                id="shippingNgn"
                type="number"
                step="1"
                min="0"
                className="input-field"
                value={pricing.shippingNgn}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    shippingNgn: Number(event.target.value),
                  }))
                }
                required
              />
            </div>

            <div>
              <label htmlFor="sellingMarkup" className="block text-sm font-medium text-slate-700 mb-2">
                Standard markup multiplier
              </label>
              <input
                id="sellingMarkup"
                type="number"
                step="0.01"
                min="0.01"
                className="input-field"
                value={pricing.sellingMarkup}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    sellingMarkup: Number(event.target.value),
                  }))
                }
                required
              />
              <p className="text-xs text-slate-500 mt-1">Default 1.2 = 20% markup</p>
            </div>

            <div>
              <label
                htmlFor="expensiveYuanThreshold"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Expensive-item yuan threshold
              </label>
              <input
                id="expensiveYuanThreshold"
                type="number"
                step="1"
                min="1"
                className="input-field"
                value={pricing.expensiveYuanThreshold ?? ""}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    expensiveYuanThreshold:
                      event.target.value === "" ? null : Number(event.target.value),
                  }))
                }
              />
              <p className="text-xs text-slate-500 mt-1">
                At or above this yuan cost, use the expensive markup. Leave blank to disable.
              </p>
            </div>

            <div>
              <label
                htmlFor="expensiveSellingMarkup"
                className="block text-sm font-medium text-slate-700 mb-2"
              >
                Expensive-item markup multiplier
              </label>
              <input
                id="expensiveSellingMarkup"
                type="number"
                step="0.01"
                min="0.01"
                className="input-field"
                value={pricing.expensiveSellingMarkup ?? ""}
                onChange={(event) =>
                  setPricing((prev) => ({
                    ...prev,
                    expensiveSellingMarkup:
                      event.target.value === "" ? null : Number(event.target.value),
                  }))
                }
              />
              <p className="text-xs text-slate-500 mt-1">Default 1.15 = 15% markup</p>
            </div>

            <div className="sm:col-span-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <button type="submit" className="btn-primary" disabled={savingPricing}>
                {savingPricing ? "Saving..." : "Save pricing"}
              </button>
              {pricingMessage && (
                <p className="text-sm text-emerald-700" role="status">
                  {pricingMessage}
                </p>
              )}
            </div>
          </form>
        </section>

        <section className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Product filter tags</h2>
          <p className="text-sm text-slate-600 mb-6">
            These tags power the filters on the All Products page. Assign a tag when adding or
            editing a product.
          </p>

          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 mb-6">
            <button
              type="button"
              className="btn-outline text-sm py-2 px-4"
              disabled={applyingSchema}
              onClick={handleApplySchema}
            >
              {applyingSchema ? "Applying schema..." : "Apply database schema"}
            </button>
            <button
              type="button"
              className="btn-outline text-sm py-2 px-4"
              disabled={importingCatalog}
              onClick={handleImportCatalog}
            >
              {importingCatalog ? "Importing..." : "Import default catalog"}
            </button>
            <p className="text-xs text-slate-500">
              Import loads all iPhones and MacBook from the built-in catalog into Postgres.
            </p>
          </div>

          <form onSubmit={handleCreateFilter} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label htmlFor="filterLabel" className="block text-sm font-medium text-slate-700 mb-2">
                Filter label
              </label>
              <input
                id="filterLabel"
                type="text"
                className="input-field"
                placeholder="iPad"
                value={filterForm.label}
                onChange={(event) =>
                  setFilterForm((prev) => ({ ...prev, label: event.target.value }))
                }
                required
              />
            </div>
            <div>
              <label htmlFor="filterSlug" className="block text-sm font-medium text-slate-700 mb-2">
                Slug (optional)
              </label>
              <input
                id="filterSlug"
                type="text"
                className="input-field"
                placeholder="ipad"
                value={filterForm.slug}
                onChange={(event) =>
                  setFilterForm((prev) => ({ ...prev, slug: event.target.value }))
                }
              />
              <p className="text-xs text-slate-500 mt-1">Auto-generated from label if left blank.</p>
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full sm:w-auto" disabled={creatingFilter}>
                {creatingFilter ? "Adding..." : "Add filter tag"}
              </button>
            </div>
          </form>

          {(filterFormMessage || filterFormError) && (
            <p
              className={`text-sm mb-4 ${filterFormError ? "text-red-600" : "text-emerald-700"}`}
              role={filterFormError ? "alert" : "status"}
            >
              {filterFormError || filterFormMessage}
            </p>
          )}

          <div className="space-y-4">
            {filterTags.map((filter) => (
              <div
                key={filter.slug}
                className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 flex flex-col sm:flex-row gap-3 sm:items-center"
              >
                <code className="text-xs text-slate-500 sm:w-28">{filter.slug}</code>
                <input
                  type="text"
                  className="input-field flex-1"
                  value={draftFilterLabels[filter.slug] ?? filter.label}
                  onChange={(event) =>
                    setDraftFilterLabels((prev) => ({
                      ...prev,
                      [filter.slug]: event.target.value,
                    }))
                  }
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="btn-primary text-sm py-2 px-4"
                    onClick={() => handleFilterLabelSave(filter.slug)}
                  >
                    Save label
                  </button>
                  <button
                    type="button"
                    className="btn-outline text-sm py-2 px-4"
                    disabled={deletingFilterSlug === filter.slug}
                    onClick={() => handleDeleteFilter(filter.slug)}
                  >
                    {deletingFilterSlug === filter.slug ? "Deleting..." : "Delete"}
                  </button>
                </div>
                {filterMessages[filter.slug] && (
                  <p className="text-sm text-emerald-700 sm:col-span-3" role="status">
                    {filterMessages[filter.slug]}
                  </p>
                )}
              </div>
            ))}

            {filterTags.length === 0 && (
              <p className="text-sm text-slate-600">
                No filter tags yet. Add one above, or run <code className="text-xs">npm run db:seed</code>.
              </p>
            )}
          </div>
        </section>

        <section className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Products</h2>
          <p className="text-sm text-slate-600 mb-6">
            View and edit catalog products. Price is recalculated from yuan when you save.
          </p>

          {products.length === 0 ? (
            <p className="text-sm text-slate-600">
              No products in the database. Run <code className="text-xs">npm run db:seed</code> after
              migrating, or add one below.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-slate-100">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-medium">Product</th>
                      <th className="px-4 py-3 font-medium">Filter</th>
                      <th className="px-4 py-3 font-medium">Storage</th>
                      <th className="px-4 py-3 font-medium">Yuan</th>
                      <th className="px-4 py-3 font-medium">Price</th>
                      <th className="px-4 py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map((product) => (
                      <tr key={product.id} className="bg-white">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={product.image}
                              alt=""
                              className="h-10 w-10 rounded-lg object-contain bg-slate-50 border border-slate-100"
                            />
                            <div>
                              <p className="font-medium text-slate-900">{product.name}</p>
                              <p className="text-xs text-slate-500">{product.slug}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-700">{filterLabel(product.filterSlug)}</td>
                        <td className="px-4 py-3 text-slate-700 text-xs">
                          {formatStorageVariantSummary(product.storageVariants)}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {product.yuanCost != null ? product.yuanCost : "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          ₦{product.price.toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            className="btn-outline text-sm py-2 px-3"
                            onClick={() =>
                              setEditingProductId((current) =>
                                current === product.id ? null : product.id
                              )
                            }
                          >
                            {editingProductId === product.id ? "Close" : "Edit"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {products.map((product) => {
                if (editingProductId !== product.id) return null;
                const form = editForms[product.id];
                if (!form) return null;
                const editPreview = previewFromForm(form, pricing);

                return (
                  <form
                    key={`edit-${product.id}`}
                    onSubmit={(event) => handleProductUpdate(event, product.id)}
                    className="border border-primary-100 rounded-xl p-5 bg-primary-50/30 space-y-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium text-slate-900">Edit {product.name}</h3>
                      <p className="text-xs text-slate-500">ID {product.id}</p>
                    </div>

                    <ProductFormFields
                      idPrefix={`edit-${product.id}`}
                      form={form}
                      filterTags={filterTags}
                      previewPrice={editPreview.previewPrice}
                      previewMarkup={editPreview.previewMarkup}
                      onChange={(updates) =>
                        setEditForms((prev) => ({
                          ...prev,
                          [product.id]: { ...prev[product.id], ...updates },
                        }))
                      }
                    />

                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <button
                        type="submit"
                        className="btn-primary"
                        disabled={savingEditId === product.id}
                      >
                        {savingEditId === product.id ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        type="button"
                        className="btn-outline"
                        onClick={() => {
                          setEditForms((prev) => ({
                            ...prev,
                            [product.id]: adminProductToForm(product),
                          }));
                          setEditMessages((prev) => ({ ...prev, [product.id]: "" }));
                        }}
                      >
                        Reset
                      </button>
                      {editMessages[product.id] && (
                        <p
                          className={`text-sm ${
                            editMessages[product.id].startsWith("Could not")
                              ? "text-red-600"
                              : "text-emerald-700"
                          }`}
                          role="status"
                        >
                          {editMessages[product.id]}
                        </p>
                      )}
                    </div>
                  </form>
                );
              })}
            </div>
          )}
        </section>

        <section className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Add product</h2>
          <p className="text-sm text-slate-600 mb-6">
            Enter the yuan cost and product details. Selling price is calculated from the pricing
            formula above. Requires Postgres.
          </p>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <ProductFormFields
              idPrefix="create"
              form={productForm}
              filterTags={filterTags}
              previewPrice={createPreview.previewPrice}
              previewMarkup={createPreview.previewMarkup}
              onChange={(updates) => setProductForm((prev) => ({ ...prev, ...updates }))}
            />

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <button type="submit" className="btn-primary" disabled={creatingProduct}>
                {creatingProduct ? "Adding..." : "Add product"}
              </button>
              {createMessage && (
                <p className="text-sm text-emerald-700" role="status">
                  {createMessage}
                </p>
              )}
              {createError && (
                <p className="text-sm text-red-600" role="alert">
                  {createError}
                </p>
              )}
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

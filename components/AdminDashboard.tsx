"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { priceFromYuan, sellingMarkupForYuan } from "@/lib/pricing";

interface PricingConfig {
  yuanToNaira: number;
  shippingNgn: number;
  sellingMarkup: number;
  expensiveYuanThreshold?: number | null;
  expensiveSellingMarkup?: number | null;
}

interface AdminProduct {
  id: string;
  name: string;
  yuanCost: number | null;
  price: number;
  filterSlug: string | null;
  colors: string[];
}

interface ProductFilterTag {
  slug: string;
  label: string;
}

const emptyProductForm = {
  name: "",
  yuanCost: "",
  image: "/product-images/",
  description: "",
  filterSlug: "",
  badge: "",
  storage: "",
  storageVariants: "",
  colors: "",
  features: "",
};

const emptyFilterForm = {
  label: "",
  slug: "",
};

export default function AdminDashboard() {
  const router = useRouter();

  const [pricing, setPricing] = useState<PricingConfig>({
    yuanToNaira: 207,
    shippingNgn: 30000,
    sellingMarkup: 1.2,
    expensiveYuanThreshold: 3500,
    expensiveSellingMarkup: 1.15,
  });
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [filterTags, setFilterTags] = useState<ProductFilterTag[]>([]);
  const [filterForm, setFilterForm] = useState(emptyFilterForm);
  const [draftFilterLabels, setDraftFilterLabels] = useState<Record<string, string>>({});
  const [draftProductFilters, setDraftProductFilters] = useState<Record<string, string>>({});
  const [draftColors, setDraftColors] = useState<Record<string, string>>({});
  const [pricingMessage, setPricingMessage] = useState("");
  const [colorMessages, setColorMessages] = useState<Record<string, string>>({});
  const [filterMessages, setFilterMessages] = useState<Record<string, string>>({});
  const [filterFormMessage, setFilterFormMessage] = useState("");
  const [filterFormError, setFilterFormError] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingProductId, setSavingProductId] = useState<string | null>(null);
  const [savingFilterSlug, setSavingFilterSlug] = useState<string | null>(null);
  const [creatingFilter, setCreatingFilter] = useState(false);
  const [deletingFilterSlug, setDeletingFilterSlug] = useState<string | null>(null);
  const [productForm, setProductForm] = useState(emptyProductForm);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createMessage, setCreateMessage] = useState("");
  const [createError, setCreateError] = useState("");

  const previewPrice = useMemo(() => {
    const yuan = Number(productForm.yuanCost);
    if (!Number.isFinite(yuan) || yuan <= 0) return null;
    return priceFromYuan(yuan, pricing);
  }, [productForm.yuanCost, pricing]);

  const previewMarkup = useMemo(() => {
    const yuan = Number(productForm.yuanCost);
    if (!Number.isFinite(yuan) || yuan <= 0) return null;
    return sellingMarkupForYuan(yuan, pricing);
  }, [productForm.yuanCost, pricing]);

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
        const list: AdminProduct[] = data.products ?? [];
        setProducts(list);
        const colorDrafts: Record<string, string> = {};
        const productFilterDrafts: Record<string, string> = {};
        for (const product of list) {
          colorDrafts[product.id] = product.colors.join(", ");
          productFilterDrafts[product.id] = product.filterSlug ?? loadedFilters[0]?.slug ?? "";
        }
        setDraftColors(colorDrafts);
        setDraftProductFilters(productFilterDrafts);
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
    setCreatingProduct(true);

    try {
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productForm),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateError(data.error ?? "Could not create product");
        return;
      }

      const created = data.product as AdminProduct;
      setProducts((prev) => [...prev, created]);
      setDraftColors((prev) => ({
        ...prev,
        [created.id]: created.colors.join(", "),
      }));
      setDraftProductFilters((prev) => ({
        ...prev,
        [created.id]: created.filterSlug ?? productForm.filterSlug,
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
        setFilterFormError(data.error ?? "Could not create filter tag");
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

  async function handleProductFilterSave(productId: string) {
    setFilterMessages((prev) => ({ ...prev, [`product-${productId}`]: "" }));
    setSavingFilterSlug(productId);

    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          filterSlug: draftProductFilters[productId] ?? null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setFilterMessages((prev) => ({
          ...prev,
          [`product-${productId}`]: data.error ?? "Could not save filter tag",
        }));
        return;
      }

      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId
            ? { ...product, filterSlug: data.filterSlug ?? null }
            : product
        )
      );
      setFilterMessages((prev) => ({
        ...prev,
        [`product-${productId}`]: "Filter tag saved.",
      }));
    } catch {
      setFilterMessages((prev) => ({
        ...prev,
        [`product-${productId}`]: "Could not reach the server. Try again.",
      }));
    } finally {
      setSavingFilterSlug(null);
    }
  }

  async function handleColorsSave(productId: string) {
    setColorMessages((prev) => ({ ...prev, [productId]: "" }));
    setSavingProductId(productId);

    const colors = (draftColors[productId] ?? "")
      .split(",")
      .map((color) => color.trim())
      .filter(Boolean);

    try {
      const response = await fetch("/api/admin/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, colors }),
      });

      if (!response.ok) {
        const data = await response.json();
        setColorMessages((prev) => ({
          ...prev,
          [productId]: data.error ?? "Could not save colors",
        }));
        return;
      }

      const data = await response.json();
      setProducts((prev) =>
        prev.map((product) =>
          product.id === productId ? { ...product, colors: data.colors } : product
        )
      );
      setDraftColors((prev) => ({
        ...prev,
        [productId]: data.colors.join(", "),
      }));
      setColorMessages((prev) => ({
        ...prev,
        [productId]: "Colors saved. This does not change price.",
      }));
    } catch {
      setColorMessages((prev) => ({
        ...prev,
        [productId]: "Could not reach the server. Try again.",
      }));
    } finally {
      setSavingProductId(null);
    }
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
          <button type="button" onClick={handleLogout} className="btn-outline text-sm py-2 px-4">
            Sign out
          </button>
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
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Add product</h2>
          <p className="text-sm text-slate-600 mb-6">
            Enter the yuan cost and product details. Selling price is calculated from the pricing
            formula above. Requires Postgres.
          </p>

          <form onSubmit={handleCreateProduct} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="productName" className="block text-sm font-medium text-slate-700 mb-2">
                  Product name
                </label>
                <input
                  id="productName"
                  type="text"
                  className="input-field"
                  placeholder="Apple iPhone 16 Pro Max 256GB"
                  value={productForm.name}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
                <p className="text-xs text-slate-500 mt-1">“(Clean)” is added automatically if missing.</p>
              </div>

              <div>
                <label htmlFor="productYuan" className="block text-sm font-medium text-slate-700 mb-2">
                  Yuan cost
                </label>
                <input
                  id="productYuan"
                  type="number"
                  step="1"
                  min="1"
                  className="input-field"
                  value={productForm.yuanCost}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, yuanCost: event.target.value }))
                  }
                  required
                />
                {previewPrice != null && (
                  <p className="text-xs text-primary-700 mt-1">
                    Estimated price: ₦{previewPrice.toLocaleString()}
                    {previewMarkup != null && ` (markup x${previewMarkup})`}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="productFilter" className="block text-sm font-medium text-slate-700 mb-2">
                  Filter tag
                </label>
                <select
                  id="productFilter"
                  className="input-field"
                  value={productForm.filterSlug}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, filterSlug: event.target.value }))
                  }
                  required
                >
                  <option value="" disabled>
                    Select a filter tag
                  </option>
                  {filterTags.map((filter) => (
                    <option key={filter.slug} value={filter.slug}>
                      {filter.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="productStorage" className="block text-sm font-medium text-slate-700 mb-2">
                  Storage label (optional)
                </label>
                <input
                  id="productStorage"
                  type="text"
                  className="input-field"
                  placeholder="256GB"
                  value={productForm.storage}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, storage: event.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="productImage" className="block text-sm font-medium text-slate-700 mb-2">
                  Image path or URL
                </label>
                <input
                  id="productImage"
                  type="text"
                  className="input-field"
                  placeholder="/product-images/iphone-16.png"
                  value={productForm.image}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, image: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="productDescription"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="productDescription"
                  className="input-field min-h-[120px]"
                  value={productForm.description}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, description: event.target.value }))
                  }
                  required
                />
              </div>

              <div>
                <label htmlFor="productBadge" className="block text-sm font-medium text-slate-700 mb-2">
                  Badge (optional)
                </label>
                <input
                  id="productBadge"
                  type="text"
                  className="input-field"
                  placeholder="New"
                  value={productForm.badge}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, badge: event.target.value }))
                  }
                />
              </div>

              <div>
                <label htmlFor="productColors" className="block text-sm font-medium text-slate-700 mb-2">
                  Colors (optional)
                </label>
                <input
                  id="productColors"
                  type="text"
                  className="input-field"
                  placeholder="Midnight, Starlight, Blue"
                  value={productForm.colors}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, colors: event.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="productStorageVariants"
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Storage variants with yuan (optional)
                </label>
                <input
                  id="productStorageVariants"
                  type="text"
                  className="input-field"
                  placeholder="256GB:3500, 512GB:3900"
                  value={productForm.storageVariants}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, storageVariants: event.target.value }))
                  }
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="productFeatures" className="block text-sm font-medium text-slate-700 mb-2">
                  Features (optional, one per line)
                </label>
                <textarea
                  id="productFeatures"
                  className="input-field min-h-[100px]"
                  placeholder={"6.7-inch display\nA18 Pro chip"}
                  value={productForm.features}
                  onChange={(event) =>
                    setProductForm((prev) => ({ ...prev, features: event.target.value }))
                  }
                />
              </div>
            </div>

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

        <section className="card-elevated p-6">
          <h2 className="font-display text-lg font-bold text-slate-900 mb-1">Manage products</h2>
          <p className="text-sm text-slate-600 mb-6">
            Update each product filter tag and color list. Colors are display-only and do not affect
            price.
          </p>

          <div className="space-y-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="border border-slate-100 rounded-xl p-4 bg-slate-50/50 space-y-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">{product.name}</p>
                  <p className="text-sm text-slate-600">
                    {product.yuanCost != null ? `Yuan ${product.yuanCost}` : "No yuan cost"} · ₦
                    {product.price.toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="input-field sm:max-w-xs"
                    value={draftProductFilters[product.id] ?? ""}
                    onChange={(event) =>
                      setDraftProductFilters((prev) => ({
                        ...prev,
                        [product.id]: event.target.value,
                      }))
                    }
                  >
                    <option value="">No filter tag</option>
                    {filterTags.map((filter) => (
                      <option key={filter.slug} value={filter.slug}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="btn-outline sm:w-auto w-full text-sm py-2.5"
                    disabled={savingFilterSlug === product.id}
                    onClick={() => handleProductFilterSave(product.id)}
                  >
                    {savingFilterSlug === product.id ? "Saving..." : "Save filter tag"}
                  </button>
                </div>
                {filterMessages[`product-${product.id}`] && (
                  <p className="text-sm text-emerald-700" role="status">
                    {filterMessages[`product-${product.id}`]}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    className="input-field flex-1"
                    value={draftColors[product.id] ?? ""}
                    onChange={(event) =>
                      setDraftColors((prev) => ({
                        ...prev,
                        [product.id]: event.target.value,
                      }))
                    }
                    placeholder="Midnight, Starlight, Blue"
                  />
                  <button
                    type="button"
                    className="btn-primary sm:w-auto w-full"
                    disabled={savingProductId === product.id}
                    onClick={() => handleColorsSave(product.id)}
                  >
                    {savingProductId === product.id ? "Saving..." : "Save colors"}
                  </button>
                </div>
                {colorMessages[product.id] && (
                  <p className="text-sm text-emerald-700" role="status">
                    {colorMessages[product.id]}
                  </p>
                )}
              </div>
            ))}

            {products.length === 0 && (
              <p className="text-sm text-slate-600">
                No products in the database. Run <code className="text-xs">npm run db:seed</code>{" "}
                after migrating.
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

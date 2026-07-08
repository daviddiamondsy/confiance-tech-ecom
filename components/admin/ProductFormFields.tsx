"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { ProductFormState, VariantPricePreview } from "@/lib/admin-product-form";
import {
  applyGeneratedProductCopyToForm,
  usesStorageVariantsField,
} from "@/lib/admin-product-form";
import {
  variantLabelFieldPlaceholder,
  variantLinesPlaceholder,
  variantPickerLabel,
} from "@/lib/variant-dimension";
import {
  CHINA_SHIPPING_YUAN_OPTIONS,
  INTERNATIONAL_SHIPPING_NGN_OPTIONS,
  INTERNATIONAL_SHIPPING_USD_OPTIONS,
  LOCAL_DELIVERY_NGN_OPTIONS,
} from "@/lib/product-shipping";
import {
  costCurrencyLabel,
  formatSupplierCost,
  SUPPLIER_COST_CURRENCIES,
  type SupplierCostCurrency,
} from "@/lib/pricing";

interface ProductFilterTag {
  slug: string;
  label: string;
}

interface ProductFormFieldsProps {
  idPrefix: string;
  form: ProductFormState;
  filterTags: ProductFilterTag[];
  previewPrice: number | null;
  previewMarkup: number | null;
  variantPreviews?: VariantPricePreview[];
  onChange: (updates: Partial<ProductFormState>) => void;
}

export default function ProductFormFields({
  idPrefix,
  form,
  filterTags,
  previewPrice,
  previewMarkup,
  variantPreviews = [],
  onChange,
}: ProductFormFieldsProps) {
  const usesStorageVariants = usesStorageVariantsField(form);
  const usesChinaShipping = form.costCurrency === "cny" && !form.useDirectNairaPrice;
  const usesUsdInternationalShipping = form.internationalShippingCurrency === "usd";
  const costCurrency = form.costCurrency as SupplierCostCurrency;
  const costUnitLabel = costCurrencyLabel(costCurrency);
  const variantLabel = variantPickerLabel(form.variantDimension);
  const variantLinesHint = variantLinesPlaceholder(
    form.variantDimension,
    costUnitLabel,
    form.useDirectNairaPrice
  );
  const [generatingCopy, setGeneratingCopy] = useState(false);
  const [generateCopyError, setGenerateCopyError] = useState("");

  async function handleGenerateCopy() {
    const productName = form.name.trim();
    if (!productName) {
      setGenerateCopyError("Enter a product name first.");
      return;
    }

    setGeneratingCopy(true);
    setGenerateCopyError("");

    try {
      const response = await fetch("/api/admin/generate-product-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName,
          filterSlugs: form.filterSlugs,
          storage: usesStorageVariants ? undefined : form.storage.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        description?: string;
        features?: string[];
        specifications?: Record<string, string>;
      };

      if (!response.ok) {
        setGenerateCopyError(payload.error ?? "Could not generate copy.");
        return;
      }

      if (
        !payload.description ||
        !payload.features?.length ||
        !payload.specifications
      ) {
        setGenerateCopyError("AI returned incomplete copy. Try again.");
        return;
      }

      onChange(
        applyGeneratedProductCopyToForm({
          description: payload.description,
          features: payload.features,
          specifications: payload.specifications,
        })
      );
    } catch {
      setGenerateCopyError("Could not generate copy. Check your connection and try again.");
    } finally {
      setGeneratingCopy(false);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-name`} className="block text-sm font-medium text-slate-700 mb-2">
          Product name
        </label>
        <input
          id={`${idPrefix}-name`}
          type="text"
          className="input-field"
          placeholder="Product title for the storefront"
          value={form.name}
          onChange={(event) => onChange({ name: event.target.value })}
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          “(Like New)” or “(New)” is added from the filter tag (Like New vs New).
        </p>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-2">
          <button
            type="button"
            className="btn-outline inline-flex items-center justify-center gap-2 text-sm"
            onClick={handleGenerateCopy}
            disabled={generatingCopy || !form.name.trim()}
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {generatingCopy ? "Generating..." : "Generate description and specs"}
          </button>
          <p className="text-xs text-slate-500">
            Uses Anthropic from ADMIN_ANTHROPIC_API_KEY. Fills description, features, and specifications.
          </p>
        </div>
        {generateCopyError ? (
          <p className="text-xs text-red-600 mt-2" role="alert">
            {generateCopyError}
          </p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 mb-2">
            Variant type
          </legend>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:border-primary-300">
              <input
                type="radio"
                name={`${idPrefix}-variant-dimension`}
                className="border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={form.variantDimension === "storage"}
                onChange={() => onChange({ variantDimension: "storage" })}
              />
              Phone storage (128GB, 256GB)
            </label>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:border-primary-300">
              <input
                type="radio"
                name={`${idPrefix}-variant-dimension`}
                className="border-slate-300 text-primary-600 focus:ring-primary-500"
                checked={form.variantDimension === "size"}
                onChange={() => onChange({ variantDimension: "size" })}
              />
              Size (ring light inches, etc.)
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Controls variant labels and the spec field saved on the product (Storage vs Size).
          </p>
        </fieldset>
      </div>

      <div className="sm:col-span-2">
        <label className="inline-flex items-start gap-3 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 cursor-pointer hover:border-primary-300">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
            checked={form.useDirectNairaPrice}
            onChange={(event) =>
              onChange({
                useDirectNairaPrice: event.target.checked,
                yuanCost: event.target.checked ? "" : form.yuanCost,
                directNairaPrice: event.target.checked ? form.directNairaPrice : "",
              })
            }
          />
          <span>
            <span className="font-medium text-slate-800 block">Set Nigeria price directly</span>
            <span className="text-xs text-slate-500 block mt-1">
              Skips supplier cost and markup calculation. Charm pricing (…9999) still applies on save.
            </span>
          </span>
        </label>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-cost-currency`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Supplier cost currency
        </label>
        <select
          id={`${idPrefix}-cost-currency`}
          className="input-field"
          value={form.costCurrency}
          onChange={(event) => {
            const nextCurrency = event.target.value as SupplierCostCurrency;
            const updates: Partial<ProductFormState> = { costCurrency: nextCurrency };
            if (nextCurrency !== "cny") {
              updates.chinaShippingYuan = "0";
            }
            onChange(updates);
          }}
          required={!form.useDirectNairaPrice}
          disabled={form.useDirectNairaPrice}
        >
          {SUPPLIER_COST_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {costCurrencyLabel(currency)}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          CNY uses china shipping in the formula. GBP and USD use international + local delivery only.
        </p>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-yuan`} className="block text-sm font-medium text-slate-700 mb-2">
          {form.useDirectNairaPrice
            ? "Nigeria price (₦)"
            : `Supplier cost (${costUnitLabel})${usesStorageVariants ? " (optional)" : ""}`}
        </label>
        {form.useDirectNairaPrice ? (
          <input
            id={`${idPrefix}-direct-naira`}
            type="number"
            step="1000"
            min="1000"
            className="input-field"
            placeholder="Selling price in naira"
            value={form.directNairaPrice}
            onChange={(event) => onChange({ directNairaPrice: event.target.value })}
            required={!usesStorageVariants}
            disabled={usesStorageVariants}
          />
        ) : (
          <input
            id={`${idPrefix}-yuan`}
            type="number"
            step="1"
            min="1"
            className="input-field"
            value={form.yuanCost}
            onChange={(event) => onChange({ yuanCost: event.target.value })}
            required={!usesStorageVariants}
            disabled={usesStorageVariants}
          />
        )}
        {usesStorageVariants ? (
          <p className="text-xs text-slate-500 mt-1">
            Pricing comes from {variantLabel.toLowerCase()} variants below. The first line sets the listing price.
          </p>
        ) : previewPrice != null ? (
          <p className="text-xs text-primary-700 mt-1">
            Estimated price: ₦{previewPrice.toLocaleString()}
            {previewMarkup != null && previewMarkup > 0 && ` (markup x${previewMarkup})`}
            {form.useDirectNairaPrice ? " (charm pricing on save)" : null}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-china-shipping`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          China shipping (yuan)
        </label>
        <select
          id={`${idPrefix}-china-shipping`}
          className="input-field"
          value={form.chinaShippingYuan}
          onChange={(event) => onChange({ chinaShippingYuan: event.target.value })}
          required={usesChinaShipping}
          disabled={!usesChinaShipping || form.useDirectNairaPrice}
        >
          {CHINA_SHIPPING_YUAN_OPTIONS.map((amount) => (
            <option key={amount} value={amount}>
              {amount === 0 ? "0 yuan (none)" : `${amount} yuan`}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500 mt-1">
          {usesChinaShipping
            ? "Added to international and local delivery below to get total shipping cost."
            : "Not used for GBP or USD pricing. Set to 0 yuan (none)."}
        </p>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-international-shipping-currency`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          International shipping currency
        </label>
        <select
          id={`${idPrefix}-international-shipping-currency`}
          className="input-field"
          value={form.internationalShippingCurrency}
          onChange={(event) =>
            onChange({
              internationalShippingCurrency: event.target.value as "ngn" | "usd",
            })
          }
          required={!form.useDirectNairaPrice}
          disabled={form.useDirectNairaPrice}
        >
          <option value="ngn">NGN (₦)</option>
          <option value="usd">USD ($)</option>
        </select>
        <p className="text-xs text-slate-500 mt-1">
          USD amounts convert to naira using the USD to naira rate in Pricing settings.
        </p>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-international-shipping`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          International shipping ({usesUsdInternationalShipping ? "USD" : "NGN"})
        </label>
        <select
          id={`${idPrefix}-international-shipping`}
          className="input-field"
          value={
            usesUsdInternationalShipping
              ? form.internationalShippingUsd
              : form.internationalShippingNgn
          }
          onChange={(event) =>
            onChange(
              usesUsdInternationalShipping
                ? { internationalShippingUsd: event.target.value }
                : { internationalShippingNgn: event.target.value }
            )
          }
          required={!form.useDirectNairaPrice}
          disabled={form.useDirectNairaPrice}
        >
          {(usesUsdInternationalShipping
            ? INTERNATIONAL_SHIPPING_USD_OPTIONS
            : INTERNATIONAL_SHIPPING_NGN_OPTIONS
          ).map((amount) => (
            <option key={amount} value={amount}>
              {usesUsdInternationalShipping
                ? amount === 0
                  ? "$0 (none)"
                  : `$${amount}`
                : amount === 0
                  ? "₦0 (none)"
                  : `₦${amount.toLocaleString()}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-local-delivery`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Local delivery (NGN)
        </label>
        <select
          id={`${idPrefix}-local-delivery`}
          className="input-field"
          value={form.localDeliveryNgn}
          onChange={(event) => onChange({ localDeliveryNgn: event.target.value })}
          required={!form.useDirectNairaPrice}
          disabled={form.useDirectNairaPrice}
        >
          {LOCAL_DELIVERY_NGN_OPTIONS.map((amount) => (
            <option key={amount} value={amount}>
              ₦{amount.toLocaleString()}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <fieldset>
          <legend className="block text-sm font-medium text-slate-700 mb-2">
            Filter tags
          </legend>
          <div className="flex flex-wrap gap-3">
            {filterTags.map((filter) => {
              const checked = form.filterSlugs.includes(filter.slug);
              return (
                <label
                  key={filter.slug}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 cursor-pointer hover:border-primary-300"
                >
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={checked}
                    onChange={() =>
                      onChange({
                        filterSlugs: checked
                          ? form.filterSlugs.filter((slug) => slug !== filter.slug)
                          : [...form.filterSlugs, filter.slug],
                      })
                    }
                  />
                  {filter.label}
                </label>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Select one or more. “(Like New)” or “(New)” in the product name comes from filter tags.
          </p>
        </fieldset>
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-storage`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {variantLabel} label (optional)
        </label>
        <input
          id={`${idPrefix}-storage`}
          type="text"
          className="input-field"
          placeholder={variantLabelFieldPlaceholder(form.variantDimension)}
          value={form.storage}
          onChange={(event) => onChange({ storage: event.target.value })}
          disabled={usesStorageVariants}
        />
        {usesStorageVariants ? (
          <p className="text-xs text-slate-500 mt-1">
            Ignored when {variantLabel.toLowerCase()} variants are set below.
          </p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-image`} className="block text-sm font-medium text-slate-700 mb-2">
          Image path or URL
        </label>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            id={`${idPrefix}-image`}
            type="text"
            className="input-field flex-1"
            placeholder="Path under /public or full image URL"
            value={form.image}
            onChange={(event) => onChange({ image: event.target.value })}
            required
          />
          {form.image.trim() && (
            <div className="shrink-0 flex items-center justify-center h-20 w-20 rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <img
                src={form.image}
                alt="Product preview"
                className="h-full w-full object-contain"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            </div>
          )}
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Use a path under <code className="text-xs">/public</code> or a full URL.
        </p>
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-description`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Description
        </label>
        <textarea
          id={`${idPrefix}-description`}
          className="input-field min-h-[120px]"
          value={form.description}
          onChange={(event) => onChange({ description: event.target.value })}
          required
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-badge`} className="block text-sm font-medium text-slate-700 mb-2">
          Badge (optional)
        </label>
        <input
          id={`${idPrefix}-badge`}
          type="text"
          className="input-field"
          placeholder="Short badge label"
          value={form.badge}
          onChange={(event) => onChange({ badge: event.target.value })}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-colors`} className="block text-sm font-medium text-slate-700 mb-2">
          Colors (optional)
        </label>
        <input
          id={`${idPrefix}-colors`}
          type="text"
          className="input-field"
          placeholder="Comma-separated color names"
          value={form.colors}
          onChange={(event) => onChange({ colors: event.target.value })}
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-storageVariants`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {variantLabel} variants{form.useDirectNairaPrice ? " with Nigeria price" : " with supplier cost"} (optional)
        </label>
        <textarea
          id={`${idPrefix}-storageVariants`}
          className="input-field min-h-[80px]"
          placeholder={variantLinesHint}
          value={form.storageVariants}
          onChange={(event) => {
            const storageVariants = event.target.value;
            const nextUsesVariants = storageVariants.trim().length > 0;
            onChange(
              nextUsesVariants
                ? { storageVariants, yuanCost: "", directNairaPrice: "", storage: "" }
                : { storageVariants }
            );
          }}
        />
        <p className="text-xs text-slate-500 mt-1">
          One per line or comma-separated. {variantLinesHint}.
          Do not list sizes in the product name or {variantLabel.toLowerCase()} label.
        </p>
        {variantPreviews.length > 0 && (
          <ul className="text-xs text-primary-700 mt-2 space-y-1">
            {variantPreviews.map((variant) => (
              <li key={variant.storage}>
                {variant.storage}
                {form.useDirectNairaPrice
                  ? `: ₦${variant.price.toLocaleString()} (charm on save)`
                  : ` (${formatSupplierCost(variant.cost, variant.currency)}): ₦${variant.price.toLocaleString()} (markup x${variant.markup})`}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-features`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Features (optional, one per line)
        </label>
        <textarea
          id={`${idPrefix}-features`}
          className="input-field min-h-[100px]"
          placeholder="One feature per line"
          value={form.features}
          onChange={(event) => onChange({ features: event.target.value })}
        />
      </div>

      <div className="sm:col-span-2">
        <label
          htmlFor={`${idPrefix}-specifications`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Specifications (optional, one per line)
        </label>
        <textarea
          id={`${idPrefix}-specifications`}
          className="input-field min-h-[120px]"
          placeholder="Label: value, one per line"
          value={form.specifications}
          onChange={(event) => onChange({ specifications: event.target.value })}
        />
        <p className="text-xs text-slate-500 mt-1">
          Use label: value on each line. {variantLabel} comes from the label or variants above.
        </p>
      </div>
    </div>
  );
}

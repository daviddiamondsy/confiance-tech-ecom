"use client";

import { FormEvent } from "react";
import { X } from "lucide-react";
import ProductFormFields from "@/components/admin/ProductFormFields";
import type { ProductFormState, VariantPricePreview } from "@/lib/admin-product-form";
import type { AdminProductRecord } from "@/lib/db/products-repository";

interface ProductFilterTag {
  slug: string;
  label: string;
}

interface ProductEditModalProps {
  product: AdminProductRecord;
  form: ProductFormState;
  filterTags: ProductFilterTag[];
  previewPrice: number | null;
  previewMarkup: number | null;
  variantPreviews?: VariantPricePreview[];
  saving: boolean;
  message: string;
  onChange: (updates: Partial<ProductFormState>) => void;
  onSubmit: (event: FormEvent) => void;
  onReset: () => void;
  onClose: () => void;
}

export default function ProductEditModal({
  product,
  form,
  filterTags,
  previewPrice,
  previewMarkup,
  variantPreviews,
  saving,
  message,
  onChange,
  onSubmit,
  onReset,
  onClose,
}: ProductEditModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-edit-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Close edit panel"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto bg-white rounded-t-2xl sm:rounded-2xl border border-slate-100 shadow-card-hover">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-100 bg-white/95 backdrop-blur-sm px-6 py-4">
          <div className="flex items-center gap-3 min-w-0">
            {product.image && (
              <img
                src={product.image}
                alt=""
                className="h-9 w-9 rounded-lg object-contain bg-slate-50 border border-slate-100 shrink-0"
              />
            )}
            <div className="min-w-0">
              <h2
                id="product-edit-title"
                className="font-display text-base font-bold text-slate-900 truncate"
              >
                {product.name}
              </h2>
              <p className="text-xs text-slate-400 truncate">{product.slug}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-colors shrink-0"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <ProductFormFields
            idPrefix={`edit-${product.id}`}
            form={form}
            filterTags={filterTags}
            previewPrice={previewPrice}
            previewMarkup={previewMarkup}
            variantPreviews={variantPreviews}
            onChange={onChange}
          />

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-slate-100">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="btn-outline" onClick={onReset}>
              Reset
            </button>
            <button
              type="button"
              className="sm:ml-auto inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              Discard
            </button>
            {message && (
              <p
                className={`text-sm ${
                  message.startsWith("Could not") ? "text-red-600" : "text-emerald-700"
                }`}
                role="status"
              >
                {message}
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

import type { ProductFormState } from "@/lib/admin-product-form";
import { usesStorageVariantsField } from "@/lib/admin-product-form";

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
  onChange: (updates: Partial<ProductFormState>) => void;
}

export default function ProductFormFields({
  idPrefix,
  form,
  filterTags,
  previewPrice,
  previewMarkup,
  onChange,
}: ProductFormFieldsProps) {
  const usesStorageVariants = usesStorageVariantsField(form);

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
          placeholder="Apple iPhone 16 Pro Max 256GB"
          value={form.name}
          onChange={(event) => onChange({ name: event.target.value })}
          required
        />
        <p className="text-xs text-slate-500 mt-1">
          “(Clean)” or “(New)” is added automatically from the filter tag (MacBook uses New).
        </p>
      </div>

      <div>
        <label htmlFor={`${idPrefix}-yuan`} className="block text-sm font-medium text-slate-700 mb-2">
          Yuan cost{usesStorageVariants ? " (optional)" : ""}
        </label>
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
        {usesStorageVariants ? (
          <p className="text-xs text-slate-500 mt-1">
            Pricing comes from storage variants below. The first line sets the listing price.
          </p>
        ) : null}
        {previewPrice != null && (
          <p className="text-xs text-primary-700 mt-1">
            Estimated price: ₦{previewPrice.toLocaleString()}
            {previewMarkup != null && ` (markup x${previewMarkup})`}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor={`${idPrefix}-filter`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Filter tag
        </label>
        <select
          id={`${idPrefix}-filter`}
          className="input-field"
          value={form.filterSlug}
          onChange={(event) => onChange({ filterSlug: event.target.value })}
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
        <label
          htmlFor={`${idPrefix}-storage`}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          Storage label (optional)
        </label>
        <input
          id={`${idPrefix}-storage`}
          type="text"
          className="input-field"
          placeholder="256GB"
          value={form.storage}
          onChange={(event) => onChange({ storage: event.target.value })}
          disabled={usesStorageVariants}
        />
        {usesStorageVariants ? (
          <p className="text-xs text-slate-500 mt-1">
            Ignored when storage variants are set below.
          </p>
        ) : null}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={`${idPrefix}-image`} className="block text-sm font-medium text-slate-700 mb-2">
          Image path or URL
        </label>
        <input
          id={`${idPrefix}-image`}
          type="text"
          className="input-field"
          placeholder="/product-images/iphone-16.png"
          value={form.image}
          onChange={(event) => onChange({ image: event.target.value })}
          required
        />
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
          placeholder="New"
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
          placeholder="Midnight, Starlight, Blue"
          value={form.colors}
          onChange={(event) => onChange({ colors: event.target.value })}
        />
      </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor={`${idPrefix}-storageVariants`}
                  className="block text-sm font-medium text-slate-700 mb-2"
                >
                  Storage variants with yuan (optional)
                </label>
                <textarea
                  id={`${idPrefix}-storageVariants`}
                  className="input-field min-h-[80px]"
                  placeholder={"256GB:4200\n512GB:4600\n1TB:5200"}
                  value={form.storageVariants}
                  onChange={(event) => {
                    const storageVariants = event.target.value;
                    const nextUsesVariants = storageVariants.trim().length > 0;
                    onChange(
                      nextUsesVariants
                        ? { storageVariants, yuanCost: "", storage: "" }
                        : { storageVariants }
                    );
                  }}
                />
                <p className="text-xs text-slate-500 mt-1">
                  One per line or comma-separated. Each line needs storage:yuan (e.g. 512GB:4600).
                  This powers the storage picker and prices on the product page.
                </p>
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
          placeholder={"6.7-inch display\nA18 Pro chip"}
          value={form.features}
          onChange={(event) => onChange({ features: event.target.value })}
        />
      </div>
    </div>
  );
}

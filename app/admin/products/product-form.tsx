"use client";

import { useActionState } from "react";

import { type ProductFormState } from "@/app/admin/products/actions";

const initialProductFormState: ProductFormState = {
  message: "",
  status: "idle",
};

type ProductOption = {
  id: string;
  name: string;
};

type ProductFormProduct = {
  id: string;
  name: string;
  categoryId: string;
  brandId: string | null;
  modelCode: string | null;
  description: string | null;
  audience: string;
  basePrice: string;
  saleUnit: string;
  packQuantity: number | null;
  colorMode: string;
  sizeDisplayText: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

type ProductFormProps = {
  action: (
    previousState: ProductFormState,
    formData: FormData,
  ) => Promise<ProductFormState>;
  brands: ProductOption[];
  buttonLabel: string;
  categories: ProductOption[];
  product?: ProductFormProduct;
};

const audiences = ["WOMEN", "MEN", "KIDS", "UNISEX"];
const saleUnits = ["UNIT", "PACK"];
const colorModes = ["NONE", "VARIANTS", "ASK", "ASSORTED"];

const colorModeDescriptions = [
  "NONE: product has no color choice.",
  "VARIANTS: customer selects color from variant colors.",
  "ASK: customer asks for available colors by message.",
  "ASSORTED: product ships with mixed colors.",
];

function fieldClassName() {
  return "rounded-md border px-3 py-2 text-sm";
}

export function ProductForm({
  action,
  brands,
  buttonLabel,
  categories,
  product,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialProductFormState,
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-xl border p-4">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Name
          <input
            className={fieldClassName()}
            defaultValue={product?.name}
            name="name"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Model code
          <input
            className={fieldClassName()}
            defaultValue={product?.modelCode ?? ""}
            name="modelCode"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Category
          <select
            className={fieldClassName()}
            defaultValue={product?.categoryId ?? ""}
            name="categoryId"
            required
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Brand
          <select
            className={fieldClassName()}
            defaultValue={product?.brandId ?? ""}
            name="brandId"
          >
            <option value="">No brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Audience
          <select
            className={fieldClassName()}
            defaultValue={product?.audience ?? "WOMEN"}
            name="audience"
            required
          >
            {audiences.map((audience) => (
              <option key={audience} value={audience}>
                {audience}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Base price
          <input
            className={fieldClassName()}
            defaultValue={product?.basePrice ?? "0.00"}
            min="0"
            name="basePrice"
            required
            step="0.01"
            type="number"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Sale unit
          <select
            className={fieldClassName()}
            defaultValue={product?.saleUnit ?? "UNIT"}
            name="saleUnit"
            required
          >
            {saleUnits.map((saleUnit) => (
              <option key={saleUnit} value={saleUnit}>
                {saleUnit}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Pack quantity
          <input
            className={fieldClassName()}
            defaultValue={product?.packQuantity ?? ""}
            min="1"
            name="packQuantity"
            step="1"
            type="number"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Color mode
          <select
            className={fieldClassName()}
            defaultValue={product?.colorMode ?? "NONE"}
            name="colorMode"
            required
          >
            {colorModes.map((colorMode) => (
              <option key={colorMode} value={colorMode}>
                {colorMode}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-zinc-500">
            {colorModeDescriptions.join(" ")}
          </span>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Size display text
          <input
            className={fieldClassName()}
            defaultValue={product?.sizeDisplayText ?? ""}
            name="sizeDisplayText"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Description
        <textarea
          className="min-h-24 rounded-md border px-3 py-2 text-sm"
          defaultValue={product?.description ?? ""}
          name="description"
        />
      </label>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={product?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Active
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={product?.isFeatured ?? false}
            name="isFeatured"
            type="checkbox"
          />
          Featured
        </label>
      </div>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error" ? "text-sm text-red-600" : "text-sm"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={pending || categories.length === 0}
        type="submit"
      >
        {pending ? "Saving..." : buttonLabel}
      </button>
    </form>
  );
}

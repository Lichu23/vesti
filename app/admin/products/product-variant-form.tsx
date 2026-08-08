"use client";

import { useActionState } from "react";

import { type ProductVariantFormState } from "@/app/admin/products/actions";

const initialProductVariantFormState: ProductVariantFormState = {
  message: "",
  status: "idle",
};

type ProductVariantFormVariant = {
  id: string;
  size: string;
  color: string | null;
  stock: number;
  isActive: boolean;
  sku: string | null;
  price: string | null;
};

type ProductVariantFormProps = {
  action: (
    previousState: ProductVariantFormState,
    formData: FormData,
  ) => Promise<ProductVariantFormState>;
  buttonLabel: string;
  colorMode: string;
  productId: string;
  stockLocked?: boolean;
  variant?: ProductVariantFormVariant;
};

function fieldClassName() {
  return "rounded-md border px-3 py-2 text-sm";
}

export function ProductVariantForm({
  action,
  buttonLabel,
  colorMode,
  productId,
  stockLocked = false,
  variant,
}: ProductVariantFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialProductVariantFormState,
  );
  const usesVariantColors = colorMode === "VARIANTS";

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border p-3">
      <input name="productId" type="hidden" value={productId} />
      {variant ? <input name="id" type="hidden" value={variant.id} /> : null}

      <div className="grid gap-3 md:grid-cols-4">
        <label className="grid gap-1 text-sm font-medium">
          Size
          <input
            className={fieldClassName()}
            defaultValue={variant?.size ?? ""}
            name="size"
            placeholder="S, M, L, 85, 90"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Color
          <input
            className={fieldClassName()}
            defaultValue={variant?.color ?? ""}
            disabled={!usesVariantColors}
            name="color"
            placeholder="Black"
            required={usesVariantColors}
          />
          <span className="text-xs font-normal text-zinc-500">
            {usesVariantColors
              ? "Required because this product uses variant colors."
              : "Disabled unless product color mode is VARIANTS."}
          </span>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Stock
          {stockLocked ? (
            <input name="stock" type="hidden" value={variant?.stock ?? 0} />
          ) : null}
          <input
            className={fieldClassName()}
            defaultValue={variant?.stock ?? 0}
            disabled={stockLocked}
            min="0"
            name="stock"
            required
            step="1"
            type="number"
          />
          {stockLocked ? (
            <span className="text-xs font-normal text-zinc-500">
              Use inventory adjustments to change stock.
            </span>
          ) : null}
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Price override
          <input
            className={fieldClassName()}
            defaultValue={variant?.price ?? ""}
            min="0"
            name="price"
            placeholder="Optional"
            step="0.01"
            type="number"
          />
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_auto]">
        <label className="grid gap-1 text-sm font-medium">
          SKU
          <input
            className={fieldClassName()}
            defaultValue={variant?.sku ?? ""}
            name="sku"
            placeholder="Optional unique SKU"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={variant?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Active
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
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Saving..." : buttonLabel}
      </button>
    </form>
  );
}

type ProductVariantDeleteFormProps = {
  action: (
    previousState: ProductVariantFormState,
    formData: FormData,
  ) => Promise<ProductVariantFormState>;
  productId: string;
  variantId: string;
};

export function ProductVariantDeleteForm({
  action,
  productId,
  variantId,
}: ProductVariantDeleteFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialProductVariantFormState,
  );

  return (
    <form action={formAction} className="grid gap-2">
      <input name="id" type="hidden" value={variantId} />
      <input name="productId" type="hidden" value={productId} />
      <button
        className="w-fit text-sm font-medium text-red-600 disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Deleting..." : "Delete variant"}
      </button>

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
    </form>
  );
}

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
  return "rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
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
          Talle
          <input
            className={fieldClassName()}
            defaultValue={variant?.size ?? ""}
            name="size"
            placeholder="S"
            required
          />
          <span className="text-xs font-normal text-zinc-500">
            One size per variant. Talles are saved in uppercase.
          </span>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Color
          <input
            className={fieldClassName()}
            defaultValue={variant?.color ?? ""}
            disabled={!usesVariantColors}
            name="color"
            placeholder="Negro"
            required={usesVariantColors}
          />
          <span className="text-xs font-normal text-zinc-500">
            {usesVariantColors
              ? "Obligatorio porque este producto usa colores por variante."
              : "Deshabilitado salvo que el modo de color sea VARIANTS."}
          </span>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Stock
          {stockLocked ? (
          <input name="stock" type="hidden" value={variant?.stock ?? 10} />
          ) : null}
          <input
            className={fieldClassName()}
            defaultValue={variant?.stock ?? 10}
            disabled={stockLocked}
            min="0"
            name="stock"
            required
            step="1"
            type="number"
          />
          {stockLocked ? (
            <span className="text-xs font-normal text-zinc-500">
              Usa ajustes de inventario para cambiar el stock.
            </span>
          ) : null}
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Precio especial
          <input
            className={fieldClassName()}
            defaultValue={variant?.price ?? ""}
            min="0"
            name="price"
            placeholder="Opcional"
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
            placeholder="Opcional unique SKU"
          />
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={variant?.isActive ?? true}
            name="isActive"
            type="checkbox"
          />
          Activo
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
        className="w-full cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : buttonLabel}
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
        className="w-full cursor-pointer text-left text-sm font-medium text-red-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "Eliminando..." : "Eliminar variante"}
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

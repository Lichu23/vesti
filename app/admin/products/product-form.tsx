"use client";

import { useActionState, useEffect } from "react";

import { type ProductFormState } from "@/app/admin/products/actions";

const initialProductFormState: ProductFormState = {
  message: "",
  status: "idle",
};

export type ProductOption = {
  id: string;
  name: string;
};

export type ProductFormProduct = {
  id: string;
  name: string;
  categoryId: string;
  modelCode: string | null;
  description: string | null;
  audience: string;
  basePrice: string;
  saleUnit: string;
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
  buttonLabel: string;
  categories: ProductOption[];
  onSuccess?: () => void;
  product?: ProductFormProduct;
};

const audiences = [
  { label: "Mujer", value: "WOMEN" },
  { label: "Hombre", value: "MEN" },
  { label: "Ninos", value: "KIDS" },
  { label: "Unisex", value: "UNISEX" },
];
const saleUnits = [
  { label: "Unidad", value: "UNIT" },
  { label: "Pack", value: "PACK" },
];
const colorModes = [
  { label: "Sin color", value: "NONE" },
  { label: "Colores por variante", value: "VARIANTS" },
  { label: "Consultar color", value: "ASK" },
  { label: "Colores surtidos", value: "ASSORTED" },
];

const colorModeDescriptions = [
  "Sin color: el producto no tiene seleccion de color.",
  "Colores por variante: el cliente elige color desde las variantes.",
  "Consultar color: el cliente consulta colores disponibles por mensaje.",
  "Colores surtidos: el producto se envia con colores surtidos.",
];

function fieldClassName() {
  return "rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
}

export function ProductForm({
  action,
  buttonLabel,
  categories,
  onSuccess,
  product,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialProductFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-4 rounded-xl border p-3 sm:p-4">
      {product ? <input name="id" type="hidden" value={product.id} /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Nombre
          <input
            className={fieldClassName()}
            defaultValue={product?.name}
            name="name"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Codigo de modelo (opcional)
          <input
            className={fieldClassName()}
            defaultValue={product?.modelCode ?? ""}
            name="modelCode"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Categoria
        <select
          className={fieldClassName()}
          defaultValue={product?.categoryId ?? ""}
          name="categoryId"
          required
        >
          <option value="">Seleccionar categoria</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Audiencia
          <select
            className={fieldClassName()}
            defaultValue={product?.audience ?? "WOMEN"}
            name="audience"
            required
          >
            {audiences.map((audience) => (
              <option key={audience.value} value={audience.value}>
                {audience.label}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Precio base
          <input
            className={fieldClassName()}
            defaultValue={product?.basePrice}
            min="0"
            name="basePrice"
            placeholder="ej: 7000"
            required
            step="0.01"
            type="number"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Unidad de venta
          <select
            className={fieldClassName()}
            defaultValue={product?.saleUnit ?? "UNIT"}
            name="saleUnit"
            required
          >
            {saleUnits.map((saleUnit) => (
              <option key={saleUnit.value} value={saleUnit.value}>
                {saleUnit.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-medium">
          Modo de color
          <select
            className={fieldClassName()}
            defaultValue={product?.colorMode ?? "NONE"}
            name="colorMode"
            required
          >
            {colorModes.map((colorMode) => (
              <option key={colorMode.value} value={colorMode.value}>
                {colorMode.label}
              </option>
            ))}
          </select>
          <span className="text-xs font-normal text-zinc-500">
            {colorModeDescriptions.join(" ")}
          </span>
        </label>

        <label className="grid gap-1 self-start text-sm font-medium">
          Talles disponibles
          <input
            className={fieldClassName()}
            defaultValue={product?.sizeDisplayText ?? ""}
            name="sizeDisplayText"
            placeholder="Ej: S a XL o 80/90"
          />
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Descripcion
        <textarea
          className="min-h-24 rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
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
          Activo
        </label>

        <label className="flex items-center gap-2 text-sm">
          <input
            defaultChecked={product?.isFeatured ?? false}
            name="isFeatured"
            type="checkbox"
          />
          Destacado
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
        disabled={pending || categories.length === 0}
        type="submit"
      >
        {pending ? "Guardando..." : buttonLabel}
      </button>
    </form>
  );
}

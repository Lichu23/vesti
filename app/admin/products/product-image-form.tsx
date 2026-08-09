"use client";

import type { ChangeEvent } from "react";
import { useActionState, useEffect, useState } from "react";

import {
  createProductImage,
  type ProductImageFormState,
} from "@/app/admin/products/actions";

const initialProductImageFormState: ProductImageFormState = {
  message: "",
  status: "idle",
};

type ProductImageFormProps = {
  productId: string;
};

function fieldClassName() {
  return "rounded-md border px-3 py-2 text-sm";
}

export function ProductImageForm({ productId }: ProductImageFormProps) {
  const [state, formAction, pending] = useActionState(
    createProductImage,
    initialProductImageFormState,
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(file ? URL.createObjectURL(file) : null);
  }

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border p-3">
      <input name="productId" type="hidden" value={productId} />

      <div className="grid gap-3 md:grid-cols-[1fr_1fr_8rem]">
        <label className="grid gap-1 text-sm font-medium md:col-span-3">
          Archivo de imagen
          <input
            accept="image/avif,image/jpeg,image/png,image/webp"
            className={fieldClassName()}
            name="image"
            onChange={handleImageChange}
            type="file"
          />
        </label>

        {previewUrl ? (
          <div className="md:col-span-3">
            <p className="mb-2 text-sm font-medium">Vista previa seleccionada</p>
            <div
              aria-label="Vista previa del producto seleccionado"
              className="h-24 w-24 rounded-md border bg-cover bg-center"
              role="img"
              style={{ backgroundImage: `url(${previewUrl})` }}
            />
          </div>
        ) : null}

        <label className="grid gap-1 text-sm font-medium">
          URL de imagen alternativa
          <input
            className={fieldClassName()}
            name="url"
            placeholder="https://example.com/product.jpg"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Texto alternativo
          <input
            className={fieldClassName()}
            name="alt"
            placeholder="Vista frontal del producto"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Orden
          <input
            className={fieldClassName()}
            defaultValue="0"
            min="0"
            name="sortOrder"
            step="1"
            type="number"
          />
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
        className="w-fit cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Agregando..." : "Agregar imagen"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";

import { type InventoryAdjustmentFormState } from "@/app/admin/products/actions";

const initialInventoryAdjustmentFormState: InventoryAdjustmentFormState = {
  message: "",
  status: "idle",
};

type InventoryAdjustmentFormProps = {
  action: (
    previousState: InventoryAdjustmentFormState,
    formData: FormData,
  ) => Promise<InventoryAdjustmentFormState>;
  productId: string;
  variantId: string;
};

export function InventoryAdjustmentForm({
  action,
  productId,
  variantId,
}: InventoryAdjustmentFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialInventoryAdjustmentFormState,
  );

  return (
    <form action={formAction} className="grid gap-3 rounded-lg border p-3">
      <input name="productId" type="hidden" value={productId} />
      <input name="variantId" type="hidden" value={variantId} />

      <div className="grid gap-3 md:grid-cols-[180px_1fr]">
        <label className="grid gap-1 text-sm font-medium">
          Ajuste
          <input
            className="rounded-md border px-3 py-2 text-sm"
            name="quantity"
            placeholder="+5 o -2"
            required
            step="1"
            type="number"
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Motivo
          <input
            className="rounded-md border px-3 py-2 text-sm"
            maxLength={160}
            name="reason"
            placeholder="Reposicion, correccion, producto danado"
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
        {pending ? "Guardando..." : "Ajustar stock"}
      </button>
    </form>
  );
}

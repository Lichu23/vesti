"use client";

import { useActionState } from "react";

import { type BrandFormState } from "@/app/admin/brands/actions";

const initialBrandFormState: BrandFormState = {
  message: "",
  status: "idle",
};

type BrandFormProps = {
  action: (
    previousState: BrandFormState,
    formData: FormData,
  ) => Promise<BrandFormState>;
  buttonLabel: string;
  brand?: {
    id: string;
    name: string;
    isActive: boolean;
  };
};

export function BrandForm({
  action,
  buttonLabel,
  brand,
}: BrandFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialBrandFormState,
  );

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border p-4">
      {brand ? <input name="id" type="hidden" value={brand.id} /> : null}

      <label className="grid gap-1 text-sm font-medium">
        Nombre
        <input
          className="rounded-md border px-3 py-2 text-sm"
          defaultValue={brand?.name}
          name="name"
          required
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          defaultChecked={brand?.isActive ?? true}
          name="isActive"
          type="checkbox"
        />
        Activo
      </label>

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
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : buttonLabel}
      </button>
    </form>
  );
}

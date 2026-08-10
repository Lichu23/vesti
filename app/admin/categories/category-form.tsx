"use client";

import { useActionState, useEffect } from "react";

import { type CategoryFormState } from "@/app/admin/categories/actions";

const initialCategoryFormState: CategoryFormState = {
  message: "",
  status: "idle",
};

type CategoryFormProps = {
  action: (
    previousState: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  buttonLabel: string;
  category?: {
    id: string;
    name: string;
    isActive: boolean;
    sortOrder: number;
  };
  onSuccess?: () => void;
};

export function CategoryForm({
  action,
  buttonLabel,
  category,
  onSuccess,
}: CategoryFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialCategoryFormState,
  );

  useEffect(() => {
    if (state.status === "success") {
      onSuccess?.();
    }
  }, [onSuccess, state.status]);

  return (
    <form action={formAction} className="grid gap-3 rounded-xl border p-3 sm:p-4">
      {category ? <input name="id" type="hidden" value={category.id} /> : null}

      <label className="grid gap-1 text-sm font-medium">
        Nombre
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          defaultValue={category?.name}
          name="name"
          required
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Orden
        <input
          className="rounded-md border px-3 py-2 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
          defaultValue={category?.sortOrder ?? 0}
          name="sortOrder"
          type="number"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          defaultChecked={category?.isActive ?? true}
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
        className="w-full cursor-pointer rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : buttonLabel}
      </button>
    </form>
  );
}

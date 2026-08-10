"use client";

import { useActionState } from "react";

import { type StoreSettingsFormState } from "@/app/admin/settings/actions";

const initialStoreSettingsFormState: StoreSettingsFormState = {
  message: "",
  status: "idle",
};

type StoreSettingsFormProps = {
  action: (
    previousState: StoreSettingsFormState,
    formData: FormData,
  ) => Promise<StoreSettingsFormState>;
  store: {
    isActive: boolean;
    name: string;
    slug: string;
    whatsapp: string | null;
  };
};

function fieldClassName() {
  return "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
}

export function StoreSettingsForm({ action, store }: StoreSettingsFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialStoreSettingsFormState,
  );

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-1 text-sm font-medium">
          Nombre de tienda
          <input
            className={fieldClassName()}
            defaultValue={store.name}
            name="name"
            required
          />
        </label>

        <label className="grid gap-1 text-sm font-medium">
          Slug
          <input
            className={fieldClassName()}
            defaultValue={store.slug}
            name="slug"
            required
          />
          <span className="text-xs font-normal text-muted-foreground">
            Se usa para identificar la tienda internamente.
          </span>
        </label>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        WhatsApp
        <input
          className={fieldClassName()}
          defaultValue={store.whatsapp ?? ""}
          name="whatsapp"
          placeholder="+54 9 ..."
        />
        <span className="text-xs font-normal text-muted-foreground">
          Este numero se usa para consultas del carrito.
        </span>
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          defaultChecked={store.isActive}
          name="isActive"
          type="checkbox"
        />
        Tienda activa
      </label>

      {state.message ? (
        <p
          aria-live="polite"
          className={
            state.status === "error"
              ? "text-sm text-destructive"
              : "text-sm text-foreground"
          }
        >
          {state.message}
        </p>
      ) : null}

      <button
        className="w-full cursor-pointer rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60 sm:w-fit"
        disabled={pending}
        type="submit"
      >
        {pending ? "Guardando..." : "Guardar configuracion"}
      </button>
    </form>
  );
}

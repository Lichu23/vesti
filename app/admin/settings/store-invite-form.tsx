"use client";

import { useActionState } from "react";

import { type StoreInviteFormState } from "@/app/admin/settings/actions";
import { UserRole } from "@/generated/prisma/enums";

const initialInviteFormState: StoreInviteFormState = {
  message: "",
  status: "idle",
};

type StoreInviteFormProps = {
  action: (
    previousState: StoreInviteFormState,
    formData: FormData,
  ) => Promise<StoreInviteFormState>;
};

function fieldClassName() {
  return "rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20";
}

export function StoreInviteForm({ action }: StoreInviteFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialInviteFormState,
  );

  return (
    <form action={formAction} className="grid gap-4 rounded-[4px] border border-border bg-card p-5 sm:p-6">
      <div className="space-y-1">
        <h2 className="font-serif text-3xl text-foreground">Invitar acceso</h2>
        <p className="text-sm text-muted-foreground">
          Invita un Gmail para que se vincule automaticamente al iniciar sesion.
        </p>
      </div>

      <label className="grid gap-1 text-sm font-medium">
        Gmail
        <input
          className={fieldClassName()}
          name="email"
          placeholder="nombre@gmail.com"
          required
          type="email"
        />
      </label>

      <label className="grid gap-1 text-sm font-medium">
        Rol
        <select
          className={fieldClassName()}
          defaultValue={UserRole.ADMIN}
          name="role"
        >
          <option value={UserRole.ADMIN}>Admin</option>
          <option value={UserRole.OWNER}>Owner</option>
        </select>
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
        {pending ? "Guardando..." : "Crear invitacion"}
      </button>
    </form>
  );
}

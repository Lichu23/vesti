"use client";

import { useActionState } from "react";

import type { ConfirmOrderState } from "@/app/admin/orders/actions";

type ConfirmOrderFormProps = {
  action: (
    previousState: ConfirmOrderState,
    formData: FormData,
  ) => Promise<ConfirmOrderState>;
  orderId: string;
};

const initialState: ConfirmOrderState = {
  message: "",
  status: "idle",
};

export function ConfirmOrderForm({ action, orderId }: ConfirmOrderFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid justify-items-end gap-2">
      <input name="orderId" type="hidden" value={orderId} />
      <button
        className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
        disabled={pending}
        type="submit"
      >
        {pending ? "Confirmando..." : "Confirmar pedido"}
      </button>
      {state.status !== "idle" ? (
        <p
          className={`max-w-xs text-right text-sm ${
            state.status === "error" ? "text-red-600" : "text-green-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

"use client";

import {
  createContext,
  type ReactNode,
  useActionState,
  useContext,
  useEffect,
  useState,
} from "react";

import type { ProductDeleteState } from "@/app/admin/products/actions";
import { TrashIcon } from "@/app/admin/admin-ui";

const initialState: ProductDeleteState = {
  message: "",
  status: "idle",
};

type ProductDeleteProviderProps = {
  action: (
    previousState: ProductDeleteState,
    formData: FormData,
  ) => Promise<ProductDeleteState>;
  children: ReactNode;
};

type ProductDeleteFormProps = {
  productId: string;
  productName: string;
};

const ProductDeletePendingContext = createContext(false);
const productDeleteFormId = "admin-product-delete-form";

export function ProductDeleteProvider({
  action,
  children,
}: ProductDeleteProviderProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [dismissedState, setDismissedState] =
    useState<ProductDeleteState | null>(null);
  const showToast = state.status !== "idle" && dismissedState !== state;

  useEffect(() => {
    if (state.status === "idle") {
      return;
    }

    const timeoutId = window.setTimeout(() => setDismissedState(state), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [state]);

  return (
    <ProductDeletePendingContext value={pending}>
      <form action={formAction} id={productDeleteFormId} />
      {children}

      {showToast ? (
        <div
          aria-live={state.status === "error" ? "assertive" : "polite"}
          className={`fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full border bg-card px-5 py-3 text-center text-sm font-medium shadow-lg sm:left-auto sm:right-5 sm:translate-x-0 ${
            state.status === "error"
              ? "border-destructive text-destructive"
              : "border-border text-foreground"
          }`}
          role={state.status === "error" ? "alert" : "status"}
        >
          {state.message}
        </div>
      ) : null}
    </ProductDeletePendingContext>
  );
}

export function ProductDeleteForm({
  productId,
  productName,
}: ProductDeleteFormProps) {
  const pending = useContext(ProductDeletePendingContext);

  return (
    <button
      aria-label={`Eliminar ${productName}`}
      className="cursor-pointer transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      form={productDeleteFormId}
      name="id"
      onClick={(event) => {
        if (
          !window.confirm(
            `¿Eliminar ${productName}? Si aparece en pedidos anteriores, se ocultara del catalogo para conservar el historial.`,
          )
        ) {
          event.preventDefault();
        }
      }}
      type="submit"
      value={productId}
    >
      <TrashIcon />
    </button>
  );
}

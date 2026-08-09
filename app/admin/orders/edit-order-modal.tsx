"use client";

import { useEffect, useRef, useState } from "react";

import type { OrderFormState } from "@/app/admin/orders/actions";
import { OrderForm } from "@/app/admin/orders/order-form";

type OrderVariantOption = {
  id: string;
  label: string;
  stock: number;
};

type EditableOrder = {
  customerName: string;
  customerPhone: string;
  id: string;
  items: {
    id: string;
    quantity: number;
    variantId: string;
  }[];
  notes: string | null;
};

type EditOrderModalProps = {
  action: (
    previousState: OrderFormState,
    formData: FormData,
  ) => Promise<OrderFormState>;
  order: EditableOrder;
  variants: OrderVariantOption[];
};

export function EditOrderModal({
  action,
  order,
  variants,
}: EditOrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const toastDelayRef = useRef<number | null>(null);

  useEffect(() => {
    if (!showToast) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setShowToast(false);
    }, 3000);

    return () => window.clearTimeout(timeoutId);
  }, [showToast]);

  useEffect(() => {
    return () => {
      if (toastDelayRef.current) {
        window.clearTimeout(toastDelayRef.current);
      }
    };
  }, []);

  function handleSuccess() {
    setIsOpen(false);
    setShowToast(false);

    if (toastDelayRef.current) {
      window.clearTimeout(toastDelayRef.current);
    }

    toastDelayRef.current = window.setTimeout(() => {
      setShowToast(true);
      toastDelayRef.current = null;
    }, 500);
  }

  return (
    <>
      <button
        className="cursor-pointer rounded-md border px-3 py-2 text-sm font-medium"
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Editar
      </button>

      {showToast ? (
        <div
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full border border-border bg-card px-5 py-3 text-center text-sm font-medium text-foreground shadow-lg sm:left-auto sm:right-5 sm:translate-x-0"
        >
          Pedido actualizado.
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 text-left"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-xl font-semibold">Editar pedido</h3>
                <p className="text-sm text-zinc-600">
                  Solo podes editar pedidos pendientes antes de confirmar el
                  stock.
                </p>
              </div>
              <button
                className="cursor-pointer rounded-md border px-3 py-2 text-sm"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <OrderForm
              action={action}
              buttonLabel="Guardar cambios"
              onSuccess={handleSuccess}
              order={order}
              variants={variants}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

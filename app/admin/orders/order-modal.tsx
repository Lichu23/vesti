"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

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

type OrderModalProps = {
  action: (
    previousState: OrderFormState,
    formData: FormData,
  ) => Promise<OrderFormState>;
  buttonLabel: string;
  description: string;
  order?: EditableOrder;
  title: string;
  trigger: "create" | "edit";
  triggerLabel: string;
  variants: OrderVariantOption[];
};

export function OrderModal({
  action,
  buttonLabel,
  description,
  order,
  title,
  trigger,
  triggerLabel,
  variants,
}: OrderModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastDelayRef = useRef<number | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeoutId = window.setTimeout(() => setToastMessage(null), 3000);

    return () => window.clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    return () => {
      if (toastDelayRef.current) {
        window.clearTimeout(toastDelayRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSuccess = useCallback((message: string) => {
    setIsOpen(false);
    setToastMessage(null);

    if (toastDelayRef.current) {
      window.clearTimeout(toastDelayRef.current);
    }

    toastDelayRef.current = window.setTimeout(() => {
      setToastMessage(message);
      toastDelayRef.current = null;
    }, 500);
  }, []);

  return (
    <>
      {trigger === "create" ? (
        <button
          className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-1.5 justify-self-start rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 sm:min-h-12 sm:gap-2 sm:px-5"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            +
          </span>
          {triggerLabel}
        </button>
      ) : (
        <button
          className="w-full cursor-pointer rounded-md border px-3 py-2 text-sm font-medium sm:w-auto"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {triggerLabel}
        </button>
      )}

      {toastMessage ? (
        <div
          aria-live="polite"
          className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full border border-border bg-card px-5 py-3 text-center text-sm font-medium text-foreground shadow-lg sm:left-auto sm:right-5 sm:translate-x-0"
        >
          {toastMessage}
        </div>
      ) : null}

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-0 text-left sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          role="dialog"
        >
          <div className="h-full max-h-dvh w-full min-w-0 max-w-3xl overflow-y-auto overscroll-contain rounded-none bg-white p-4 shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:p-5">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3
                  className="font-serif text-2xl text-foreground sm:text-3xl"
                  id={titleId}
                >
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground">{description}</p>
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
              buttonLabel={buttonLabel}
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

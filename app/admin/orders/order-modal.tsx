"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AdminModal } from "@/app/admin/admin-modal";
import { AdminToast } from "@/app/admin/admin-toast";
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

      <AdminToast message={toastMessage} />

      <AdminModal
        description={description}
        onOpenChange={setIsOpen}
        open={isOpen}
        title={title}
      >
        <OrderForm
          action={action}
          buttonLabel={buttonLabel}
          onSuccess={handleSuccess}
          order={order}
          variants={variants}
        />
      </AdminModal>
    </>
  );
}

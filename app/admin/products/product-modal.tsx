"use client";

import type { ReactNode } from "react";
import { useCallback, useEffect, useId, useState } from "react";

import { EditIcon } from "@/app/admin/admin-ui";
import { type ProductFormState } from "@/app/admin/products/actions";
import {
  ProductForm,
  type ProductFormProduct,
  type ProductOption,
} from "@/app/admin/products/product-form";

type ProductAction = (
  previousState: ProductFormState,
  formData: FormData,
) => Promise<ProductFormState>;

type ProductModalProps = {
  action: ProductAction;
  buttonLabel: string;
  categories: ProductOption[];
  children?: ReactNode;
  description: string;
  product?: ProductFormProduct;
  title: string;
  trigger:
    | {
        label: string;
        type: "button";
      }
    | {
        label: string;
        type: "icon";
      };
};

export function ProductModal({
  action,
  buttonLabel,
  categories,
  children,
  description,
  product,
  title,
  trigger,
}: ProductModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleSuccess = useCallback(() => setIsOpen(false), []);

  const titleId = useId();

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

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <>
      {trigger.type === "button" ? (
        <button
          className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 xl:w-auto"
          onClick={handleOpen}
          type="button"
        >
          <span className="text-xl leading-none">+</span>
          {trigger.label}
        </button>
      ) : (
        <button
          aria-label={trigger.label}
          className="cursor-pointer transition hover:text-foreground"
          onClick={handleOpen}
          type="button"
        >
          <EditIcon />
        </button>
      )}

      {isOpen ? (
        <div
          aria-labelledby={titleId}
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-2 text-left sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setIsOpen(false);
            }
          }}
          role="dialog"
        >
          <div className="max-h-[calc(100dvh-1rem)] w-full max-w-3xl min-w-0 overflow-y-auto overscroll-contain rounded-xl bg-white p-3 shadow-xl sm:max-h-[90vh] sm:p-5">
            <div className="mb-6 flex items-start justify-between gap-4">
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
                aria-label="Cerrar"
                className="cursor-pointer rounded-md border px-3 py-2 text-sm"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                Cerrar
              </button>
            </div>

            <ProductForm
              action={action}
              buttonLabel={buttonLabel}
              categories={categories}
              onSuccess={handleSuccess}
              product={product}
            />
            {children ? <div className="mt-5 grid gap-5">{children}</div> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

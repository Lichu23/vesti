"use client";

import type { ReactNode } from "react";
import { useCallback, useState } from "react";

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

  function handleOpen() {
    setIsOpen(true);
  }

  return (
    <>
      {trigger.type === "button" ? (
        <button
          className="inline-flex min-h-14 cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
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
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-0 text-left sm:p-4"
          role="dialog"
        >
          <div className="h-full max-h-screen w-full max-w-5xl overflow-y-auto rounded-none bg-white p-4 shadow-xl sm:h-auto sm:max-h-[90vh] sm:rounded-xl sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-2xl text-foreground sm:text-3xl">
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

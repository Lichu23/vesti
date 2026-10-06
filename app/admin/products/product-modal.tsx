"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { AdminModal } from "@/app/admin/admin-modal";
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
          className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90 xl:w-auto"
          onClick={handleOpen}
          type="button"
        >
          <Plus aria-hidden="true" className="size-5" strokeWidth={1.8} />
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

      <AdminModal
        description={description}
        onOpenChange={setIsOpen}
        open={isOpen}
        title={title}
      >
        <ProductForm
          action={action}
          buttonLabel={buttonLabel}
          categories={categories}
          onSuccess={handleSuccess}
          product={product}
        />
      </AdminModal>
    </>
  );
}

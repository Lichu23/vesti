"use client";

import { useCallback, useState } from "react";

import { EditIcon } from "@/app/admin/admin-ui";
import { type CategoryFormState } from "@/app/admin/categories/actions";
import { CategoryForm } from "@/app/admin/categories/category-form";

type CategoryAction = (
  previousState: CategoryFormState,
  formData: FormData,
) => Promise<CategoryFormState>;

type CategoryModalProps = {
  action: CategoryAction;
  buttonLabel: string;
  category?: {
    id: string;
    isActive: boolean;
    name: string;
    sortOrder: number;
  };
  description: string;
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

export function CategoryModal({
  action,
  buttonLabel,
  category,
  description,
  title,
  trigger,
}: CategoryModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const handleSuccess = useCallback(() => setIsOpen(false), []);

  return (
    <>
      {trigger.type === "button" ? (
        <button
          className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <span className="text-xl leading-none">+</span>
          {trigger.label}
        </button>
      ) : (
        <button
          aria-label={trigger.label}
          className="cursor-pointer transition hover:text-foreground"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          <EditIcon />
        </button>
      )}

      {isOpen ? (
        <div
          aria-modal="true"
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 text-left"
          role="dialog"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-serif text-3xl text-foreground">
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

            <CategoryForm
              action={action}
              buttonLabel={buttonLabel}
              category={category}
              onSuccess={handleSuccess}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}

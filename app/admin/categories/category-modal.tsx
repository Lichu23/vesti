"use client";

import { Plus } from "lucide-react";
import { useCallback, useState } from "react";

import { AdminModal } from "@/app/admin/admin-modal";
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
          <Plus aria-hidden="true" className="size-5" strokeWidth={1.8} />
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

      <AdminModal
        description={description}
        onOpenChange={setIsOpen}
        open={isOpen}
        title={title}
      >
        <CategoryForm
          action={action}
          buttonLabel={buttonLabel}
          category={category}
          onSuccess={handleSuccess}
        />
      </AdminModal>
    </>
  );
}

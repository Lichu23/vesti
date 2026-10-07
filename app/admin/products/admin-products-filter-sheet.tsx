"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  PRODUCT_SORT_OPTIONS,
  buildProductsUrl,
  type ProductSort,
  type ProductStockFilter,
} from "@/app/admin/products/products-filters";

const STOCK_OPTIONS: { label: string; value: ProductStockFilter }[] = [
  { label: "Todos los productos", value: "" },
  { label: "Solo stock bajo", value: "bajo" },
];

const optionClassName =
  "flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-b border-border text-left text-base transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-60";

/** Bottom sheet with the sort and low-stock options, like the storefront one. */
export function AdminProductsFilterSheet({
  categoryId,
  className = "",
  query,
  sort,
  stock,
}: {
  categoryId?: string;
  className?: string;
  query?: string;
  sort: ProductSort;
  stock: ProductStockFilter;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isActive = sort !== "" || stock !== "";

  function navigate(next: { sort?: ProductSort; stock?: ProductStockFilter }) {
    const nextSort = next.sort ?? sort;
    const nextStock = next.stock ?? stock;

    setIsOpen(false);
    if (nextSort === sort && nextStock === stock) return;

    startTransition(() => {
      router.push(
        buildProductsUrl(pathname, {
          categoryId,
          query,
          sort: nextSort,
          stock: nextStock,
        }),
        { scroll: false },
      );
    });
  }

  return (
    <Dialog.Root onOpenChange={setIsOpen} open={isOpen}>
      <Dialog.Trigger
        aria-busy={isPending}
        aria-label="Ordenar y filtrar productos"
        className={`relative flex size-12 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:size-14 ${className}`}
      >
        <SlidersHorizontal
          aria-hidden="true"
          className="size-5"
          strokeWidth={1.8}
        />
        {isActive ? (
          <span
            aria-hidden="true"
            className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary"
          />
        ) : null}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1000] bg-foreground/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />

        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-[1000] mx-auto flex max-h-[85dvh] w-full flex-col rounded-t-[16px] border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none sm:max-w-md">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Dialog.Title className="font-serif text-2xl text-foreground">
              Ordenar y filtrar
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
          </div>

          <div className="min-h-0 space-y-5 overflow-y-auto overscroll-contain">
            <section>
              <h3 className="mt-2 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Ordenar por
              </h3>
              <ul>
                {PRODUCT_SORT_OPTIONS.map((option) => (
                  <li key={option.value}>
                    <button
                      aria-pressed={sort === option.value}
                      className={`${optionClassName} ${
                        sort === option.value
                          ? "font-semibold text-foreground"
                          : "text-foreground"
                      }`}
                      onClick={() => navigate({ sort: option.value })}
                      type="button"
                    >
                      {option.label}
                      {sort === option.value ? (
                        <Check
                          aria-hidden="true"
                          className="size-5"
                          strokeWidth={1.8}
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h3 className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Mostrar
              </h3>
              <ul>
                {STOCK_OPTIONS.map((option) => (
                  <li key={option.value || "all"}>
                    <button
                      aria-pressed={stock === option.value}
                      className={`${optionClassName} ${
                        stock === option.value
                          ? "font-semibold text-foreground"
                          : "text-foreground"
                      }`}
                      onClick={() => navigate({ stock: option.value })}
                      type="button"
                    >
                      {option.label}
                      {stock === option.value ? (
                        <Check
                          aria-hidden="true"
                          className="size-5"
                          strokeWidth={1.8}
                        />
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

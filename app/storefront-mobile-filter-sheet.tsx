"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Check, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

type SortOption = {
  label: string;
  value: string;
};

/** Bottom sheet next to the search bar with only the sort options. */
export function StorefrontMobileFilterSheet({
  isDisabled = false,
  onNavigate,
  sortOptions,
}: {
  isDisabled?: boolean;
  onNavigate?: () => void;
  sortOptions: SortOption[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const currentSort = searchParams.get("ordenar") ?? "relevance";

  function handleSelect(value: string) {
    setIsOpen(false);
    if (value === currentSort) return;

    const nextParams = new URLSearchParams(searchParams.toString());

    if (value === "relevance") {
      nextParams.delete("ordenar");
    } else {
      nextParams.set("ordenar", value);
    }
    nextParams.delete("pagina");

    const query = nextParams.toString();

    onNavigate?.();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <Dialog.Root onOpenChange={setIsOpen} open={isOpen}>
      <Dialog.Trigger
        aria-disabled={isDisabled}
        aria-label="Ordenar productos"
        className="relative flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-full border border-input bg-card text-foreground transition hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:size-12"
        disabled={isDisabled}
      >
        <SlidersHorizontal
          aria-hidden="true"
          className="size-5"
          strokeWidth={1.8}
        />
        {currentSort !== "relevance" ? (
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-2 rounded-full bg-primary"
          />
        ) : null}
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1000] bg-foreground/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />

        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-[1000] mx-auto flex max-h-[85dvh] w-full flex-col rounded-t-[16px] border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none sm:max-w-md">
          <div className="mb-2 flex items-center justify-between gap-3">
            <Dialog.Title className="font-serif text-2xl text-foreground">
              Ordenar por
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar"
              className="-mr-2 flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
          </div>

          <ul className="min-h-0 overflow-y-auto overscroll-contain">
            {sortOptions.map((option) => (
              <li key={option.value}>
                <button
                  aria-pressed={currentSort === option.value}
                  className={`flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-b border-border text-left text-base transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                    currentSort === option.value
                      ? "font-semibold text-foreground"
                      : "text-foreground"
                  }`}
                  onClick={() => handleSelect(option.value)}
                  type="button"
                >
                  {option.label}
                  {currentSort === option.value ? (
                    <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

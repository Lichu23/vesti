"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import { useState } from "react";

import { StorefrontAudienceSidebar } from "./storefront-audience-sidebar";

type StorefrontSidebarCategory = {
  id: string;
  name: string;
  slug: string;
};

type StorefrontSidebarCategoryGroups = {
  KIDS: StorefrontSidebarCategory[];
  MEN: StorefrontSidebarCategory[];
  WOMEN: StorefrontSidebarCategory[];
};

type StorefrontSidebarParams = {
  buscar?: string;
  categoria?: string;
  ordenar?: string;
};

export function StorefrontMobileFilterDrawer({
  activeAudiencePath,
  activeCategory,
  categoryGroups,
  isDisabled = false,
  onNavigate,
  searchParams,
}: {
  activeAudiencePath?: string;
  activeCategory?: string;
  categoryGroups: StorefrontSidebarCategoryGroups;
  isDisabled?: boolean;
  onNavigate?: () => void;
  searchParams: StorefrontSidebarParams;
}) {
  const [isOpen, setIsOpen] = useState(false);
  function handleNavigate() {
    setIsOpen(false);
    onNavigate?.();
  }

  return (
    <Dialog.Root onOpenChange={setIsOpen} open={isOpen}>
      <Dialog.Trigger
        aria-disabled={isDisabled}
        aria-label="Abrir filtros"
        className="relative z-20 flex size-11 cursor-pointer md:size-12 items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:hidden"
        disabled={isDisabled}
      >
        <Menu aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1000] bg-foreground/35 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none xl:hidden" />

        <Dialog.Popup className="fixed left-0 top-0 z-[1000] flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-4 shadow-2xl sm:p-6 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full motion-reduce:transition-none xl:hidden">
          <div className="mb-5 flex items-center sm:mb-8 justify-between gap-4">
            <Dialog.Title className="font-serif text-2xl text-foreground sm:text-3xl">
              Comprar por
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar filtros"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
          </div>

          <StorefrontAudienceSidebar
            activeAudiencePath={activeAudiencePath}
            activeCategory={activeCategory}
            categoryGroups={categoryGroups}
            className="min-h-0 overflow-y-auto"
            isDisabled={isDisabled}
            onNavigate={handleNavigate}
            searchParams={searchParams}
            showHeading={false}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

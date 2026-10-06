"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        return;
      }

      if (event.key !== "Tab" || !drawerRef.current) return;
      const focusable = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), summary, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen]);

  function handleNavigate() {
    setIsOpen(false);
    onNavigate?.();
  }

  return (
    <>
      <button
        aria-expanded={isOpen}
        aria-disabled={isDisabled}
        aria-label="Abrir filtros"
        className="relative z-20 flex size-12 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary xl:hidden"
        disabled={isDisabled}
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Menu aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[1000] xl:hidden">
          <button
            aria-label="Cerrar filtros"
            className="absolute inset-0 cursor-pointer bg-foreground/35"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside
            aria-label="Filtros de productos"
            aria-modal="true"
            className="absolute left-0 top-0 flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-6 shadow-2xl"
            ref={drawerRef}
            role="dialog"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <h2 className="font-serif text-3xl text-foreground">
                Comprar por
              </h2>
              <button
                aria-label="Cerrar filtros"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setIsOpen(false)}
                ref={closeRef}
                type="button"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </button>
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
          </aside>
        </div>
      ) : null}
    </>
  );
}

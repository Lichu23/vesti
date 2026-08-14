"use client";

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
    <>
      <button
        aria-expanded={isOpen}
        aria-disabled={isDisabled}
        aria-label="Abrir filtros"
        className="relative z-20 flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary xl:hidden"
        disabled={isDisabled}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[1000] xl:hidden">
          <button
            aria-label="Cerrar filtros"
            className="absolute inset-0 cursor-pointer bg-foreground/35"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside className="absolute left-0 top-0 flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-6 shadow-2xl">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                  Filtros
                </p>
                <h2 className="mt-2 font-serif text-3xl text-foreground">
                  Comprar por
                </h2>
              </div>
              <button
                aria-label="Cerrar filtros"
                className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl text-foreground"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <span aria-hidden="true">x</span>
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
            />
          </aside>
        </div>
      ) : null}
    </>
  );
}

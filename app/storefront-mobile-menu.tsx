"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, Check, ChevronRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { buildAudienceHref } from "./storefront-routes";

type MenuCategory = {
  id: string;
  name: string;
  slug: string;
};

type MenuCategoryGroups = {
  KIDS: MenuCategory[];
  MEN: MenuCategory[];
  WOMEN: MenuCategory[];
};

type MenuView = "root" | "/mujer" | "/hombre" | "/ninos";

const AUDIENCE_SECTIONS = [
  { href: "/mujer" as const, key: "WOMEN" as const, label: "Mujer" },
  { href: "/hombre" as const, key: "MEN" as const, label: "Hombre" },
  { href: "/ninos" as const, key: "KIDS" as const, label: "Ninos" },
];

const rowClassName =
  "flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 border-b border-border text-left text-base text-foreground transition hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

export function StorefrontMobileMenu({
  activeAudiencePath,
  activeCategory,
  categoryGroups,
  isDisabled = false,
  onNavigate,
}: {
  activeAudiencePath?: string;
  activeCategory?: string;
  categoryGroups: MenuCategoryGroups;
  isDisabled?: boolean;
  onNavigate?: () => void;
}) {
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<MenuView>("root");

  const search = searchParams.get("buscar") ?? undefined;
  const sort = searchParams.get("ordenar") ?? undefined;
  const linkParams = { buscar: search, ordenar: sort };
  const activeSection = AUDIENCE_SECTIONS.find(
    (section) => section.href === view,
  );

  function handleOpenChange(open: boolean) {
    if (open) setView("root");
    setIsOpen(open);
  }

  function handleLinkClick() {
    setIsOpen(false);
    onNavigate?.();
  }

  return (
    <Dialog.Root onOpenChange={handleOpenChange} open={isOpen}>
      <Dialog.Trigger
        aria-disabled={isDisabled}
        aria-label="Abrir menu"
        className="relative z-20 flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:size-12 xl:hidden"
        disabled={isDisabled}
      >
        <Menu aria-hidden="true" className="size-6" strokeWidth={1.8} />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[1000] bg-foreground/35 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none xl:hidden" />

        <Dialog.Popup className="fixed left-0 top-0 z-[1000] flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-4 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full motion-reduce:transition-none sm:p-6 xl:hidden">
          <div className="mb-4 flex items-center justify-between gap-2">
            {activeSection ? (
              <button
                aria-label="Volver al menu"
                className="-ml-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                onClick={() => setView("root")}
                type="button"
              >
                <ArrowLeft aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </button>
            ) : null}
            <Dialog.Title className="min-w-0 flex-1 truncate font-serif text-2xl text-foreground sm:text-3xl">
              {activeSection ? activeSection.label : "Comprar por"}
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar menu"
              className="-mr-2 flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
          </div>

          <nav
            aria-label={activeSection ? activeSection.label : "Comprar por"}
            className={`min-h-0 flex-1 overflow-y-auto overscroll-contain motion-reduce:animate-none ${
              activeSection ? "animate-slide-in" : "animate-fade-in"
            }`}
            key={view}
          >
            {activeSection ? (
              <ul>
                <li>
                  <Link
                    aria-current={
                      activeAudiencePath === activeSection.href &&
                      !activeCategory
                        ? "page"
                        : undefined
                    }
                    className={rowClassName}
                    href={buildAudienceHref(
                      activeSection.href,
                      undefined,
                      linkParams,
                    )}
                    onClick={handleLinkClick}
                  >
                    Ver todo
                    {activeAudiencePath === activeSection.href &&
                    !activeCategory ? (
                      <Check aria-hidden="true" className="size-5" strokeWidth={1.8} />
                    ) : null}
                  </Link>
                </li>
                {categoryGroups[activeSection.key].map((category) => {
                  const isActive =
                    activeAudiencePath === activeSection.href &&
                    activeCategory === category.slug;

                  return (
                    <li key={category.id}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={rowClassName}
                        href={buildAudienceHref(
                          activeSection.href,
                          category.slug,
                          linkParams,
                        )}
                        onClick={handleLinkClick}
                      >
                        {category.name}
                        {isActive ? (
                          <Check
                            aria-hidden="true"
                            className="size-5"
                            strokeWidth={1.8}
                          />
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ul>
                {AUDIENCE_SECTIONS.map((section) => (
                  <li key={section.href}>
                    <button
                      className={`${rowClassName} ${
                        activeAudiencePath === section.href
                          ? "font-semibold"
                          : ""
                      }`}
                      onClick={() => setView(section.href)}
                      type="button"
                    >
                      {section.label}
                      <ChevronRight
                        aria-hidden="true"
                        className="size-5 shrink-0 text-muted-foreground"
                        strokeWidth={1.8}
                      />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </nav>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

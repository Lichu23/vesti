"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { CartToggleButton } from "./cart-buttons";
import { StorefrontMobileFilterDrawer } from "./storefront-mobile-filter-drawer";
import { StorefrontMobileSortForm } from "./storefront-mobile-sort-form";
import { StorefrontProductLoading } from "./storefront-product-loading";
import { StorefrontSearch } from "./storefront-search";

type Category = {
  id: string;
  name: string;
  slug: string;
};

type CategoryGroups = {
  KIDS: Category[];
  MEN: Category[];
  WOMEN: Category[];
};

const SORT_OPTIONS = [
  { label: "Relevancia", value: "relevance" },
  { label: "Novedades", value: "newest" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
];

export function StorefrontNavigation({
  categoryGroups,
  children,
}: {
  categoryGroups: CategoryGroups;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const navigationKey = `${pathname}?${searchParams.toString()}`;
  const [navigationStartKey, setNavigationStartKey] = useState<string | null>(
    null,
  );
  const isNavigating = navigationStartKey === navigationKey;
  const handleNavigate = useCallback(() => {
    setNavigationStartKey(navigationKey);
  }, [navigationKey]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/api")) {
    return children;
  }

  const isProductPage = pathname.startsWith("/products/");
  const activeAudiencePath = ["/mujer", "/hombre", "/ninos", "/unisex"].find(
    (path) => pathname === path,
  );
  const currentSearchParams = {
    buscar: searchParams.get("buscar") ?? undefined,
    categoria: searchParams.get("categoria") ?? undefined,
    ordenar: searchParams.get("ordenar") ?? undefined,
  };

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="grid min-h-24 grid-cols-[48px_1fr_48px] items-center gap-4 px-5 sm:px-8 md:flex md:gap-6">
          {isProductPage ? (
            <Link
              aria-label="Volver a productos"
              className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl text-foreground transition hover:border-primary"
              href="/"
            >
              ←
            </Link>
          ) : (
            <StorefrontMobileFilterDrawer
              activeAudiencePath={activeAudiencePath}
              activeCategory={currentSearchParams.categoria}
              categoryGroups={categoryGroups}
              isDisabled={isNavigating}
              onNavigate={handleNavigate}
              searchParams={currentSearchParams}
            />
          )}

          <Link
            aria-label="Ir al inicio"
            className="cursor-pointer justify-self-center md:justify-self-auto"
            href="/"
          >
            <span className="block font-serif text-3xl leading-none text-foreground">
              Thoemia
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.45em] text-foreground">
              Intimo
            </span>
          </Link>

          {!isProductPage ? (
            <StorefrontSearch
              initialValue={currentSearchParams.buscar}
              key={currentSearchParams.buscar ?? "empty-search"}
              onNavigate={handleNavigate}
            />
          ) : null}

          <CartToggleButton className="ml-0 justify-self-end md:ml-auto" />
        </div>
      </header>

      {!isProductPage ? (
        <div className="storefront-shell storefront-mobile-only grid gap-4 px-5 pt-5 xl:hidden sm:px-8">
          <StorefrontSearch
            className="flex w-full md:hidden"
            initialValue={currentSearchParams.buscar}
            key={`mobile-${currentSearchParams.buscar ?? "empty-search"}`}
            onNavigate={handleNavigate}
          />
          <StorefrontMobileSortForm
            action={pathname}
            category={currentSearchParams.categoria}
            query={currentSearchParams.buscar}
            sort={currentSearchParams.ordenar}
            sortOptions={SORT_OPTIONS}
            onNavigate={handleNavigate}
          />
        </div>
      ) : null}

      <div className="relative min-h-0">
        {children}
        {isNavigating ? (
          <div className="absolute inset-0 z-20 bg-background">
            <StorefrontProductLoading />
          </div>
        ) : null}
      </div>
    </>
  );
}

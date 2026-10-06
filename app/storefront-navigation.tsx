"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { BrandLogo } from "./brand-logo";
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
        <div className="grid min-h-14 grid-cols-[44px_1fr_44px] items-center gap-2 px-4 sm:px-8 md:flex md:min-h-24 md:gap-6">
          {isProductPage ? (
            <Link
              aria-label="Volver a productos"
              className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 md:size-12 focus-visible:outline-offset-2 focus-visible:outline-primary"
              href="/"
            >
              <ArrowLeft aria-hidden="true" className="size-6" strokeWidth={1.8} />
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
            <BrandLogo priority />
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
        <div className="storefront-shell storefront-mobile-only grid gap-3 px-4 pt-3 xl:hidden sm:gap-4 sm:px-8 sm:pt-5">
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
          <div className="absolute inset-0 z-20 animate-fade-in bg-background motion-reduce:animate-none">
            <StorefrontProductLoading />
          </div>
        ) : null}
      </div>
    </>
  );
}

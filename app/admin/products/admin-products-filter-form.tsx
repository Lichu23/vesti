"use client";

import { type FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  AdminSelect,
  adminSelectPillClassName,
} from "@/app/admin/admin-select";
import { SearchIcon } from "@/app/admin/admin-ui";
import { AdminProductsFilterSheet } from "@/app/admin/products/admin-products-filter-sheet";
import {
  buildProductsUrl,
  type ProductSort,
  type ProductStockFilter,
} from "@/app/admin/products/products-filters";

type ProductCategoryOption = {
  id: string;
  name: string;
};

type AdminProductsFilterFormProps = {
  categories: ProductCategoryOption[];
  categoryId?: string;
  query?: string;
  sort: ProductSort;
  stock: ProductStockFilter;
};

function normalizeValue(value?: string) {
  return value?.trim() ?? "";
}

export function AdminProductsFilterForm({
  categories,
  categoryId,
  query,
  sort,
  stock,
}: AdminProductsFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initialQuery = normalizeValue(query);
  const initialCategoryId = categoryId ?? "";
  const [isAutoPending, startAutoTransition] = useTransition();
  const [isFiltering, startFilterTransition] = useTransition();
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [currentCategoryId, setCurrentCategoryId] = useState(initialCategoryId);
  const hasChanges = useMemo(
    () =>
      normalizeValue(currentQuery) !== initialQuery ||
      currentCategoryId !== initialCategoryId,
    [currentCategoryId, currentQuery, initialCategoryId, initialQuery],
  );

  // Manual filtering (mobile): lock the fields until the filtered list renders.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasChanges || isFiltering) {
      return;
    }

    const nextUrl = buildProductsUrl(pathname, {
      categoryId: currentCategoryId,
      query: currentQuery,
      sort,
      stock,
    });

    startFilterTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1280px)");

    if (!mediaQuery.matches) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextUrl = buildProductsUrl(pathname, {
        categoryId: currentCategoryId,
        query: currentQuery,
        sort,
        stock,
      });

      startAutoTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentCategoryId, currentQuery, hasChanges, pathname, router, sort, stock]);

  return (
    <form
      action="/admin/products"
      aria-busy={isFiltering || isAutoPending}
      className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 xl:grid-cols-[minmax(0,1fr)_220px_auto] xl:gap-4"
      onSubmit={handleSubmit}
    >
      <label className="flex min-h-12 items-center gap-3 rounded-full border border-border bg-card px-5 text-muted-foreground xl:min-h-14">
        <SearchIcon />
        <input
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-muted-foreground"
          disabled={isFiltering}
          name="buscar"
          onChange={(event) => setCurrentQuery(event.target.value)}
          placeholder="Buscar por nombre o categoria..."
          type="search"
          value={currentQuery}
        />
      </label>

      <AdminProductsFilterSheet
        categoryId={initialCategoryId || undefined}
        className="xl:order-last"
        query={initialQuery}
        sort={sort}
        stock={stock}
      />

      <div className="min-w-0">
        <AdminSelect
          aria-label="Filtrar por categoria"
          className={adminSelectPillClassName}
          disabled={isFiltering}
          name="categoria"
          onValueChange={setCurrentCategoryId}
          options={[
            { label: "Todas las categorias", value: "" },
            ...categories.map((category) => ({
              label: category.name,
              value: category.id,
            })),
          ]}
          value={currentCategoryId}
        />
      </div>

      <button
        className="inline-flex min-h-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:border-primary gap-2 disabled:cursor-not-allowed disabled:opacity-45 xl:hidden"
        disabled={!hasChanges || isFiltering}
        type="submit"
      >
        {isFiltering ? (
          <>
            <span
              aria-hidden="true"
              className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            />
            Filtrando...
          </>
        ) : (
          "Filtrar"
        )}
      </button>
    </form>
  );
}

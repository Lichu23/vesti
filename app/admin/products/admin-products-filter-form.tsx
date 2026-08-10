"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SearchIcon } from "@/app/admin/admin-ui";

type ProductCategoryOption = {
  id: string;
  name: string;
};

type AdminProductsFilterFormProps = {
  categories: ProductCategoryOption[];
  categoryId?: string;
  query?: string;
};

function normalizeValue(value?: string) {
  return value?.trim() ?? "";
}

export function AdminProductsFilterForm({
  categories,
  categoryId,
  query,
}: AdminProductsFilterFormProps) {
  const pathname = usePathname();
  const router = useRouter();
  const initialQuery = normalizeValue(query);
  const initialCategoryId = categoryId ?? "";
  const [isPending, startTransition] = useTransition();
  const [currentQuery, setCurrentQuery] = useState(initialQuery);
  const [currentCategoryId, setCurrentCategoryId] = useState(initialCategoryId);
  const hasChanges = useMemo(
    () =>
      normalizeValue(currentQuery) !== initialQuery ||
      currentCategoryId !== initialCategoryId,
    [currentCategoryId, currentQuery, initialCategoryId, initialQuery],
  );

  useEffect(() => {
    if (!hasChanges) {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1280px)");

    if (!mediaQuery.matches) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams();
      const trimmedQuery = normalizeValue(currentQuery);

      if (trimmedQuery) {
        nextParams.set("buscar", trimmedQuery);
      }

      if (currentCategoryId) {
        nextParams.set("categoria", currentCategoryId);
      }

      const queryString = nextParams.toString();
      const nextUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    }, 350);

    return () => window.clearTimeout(timeout);
  }, [currentCategoryId, currentQuery, hasChanges, pathname, router]);

  return (
    <form
      action="/admin/products"
      className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_auto]"
    >
      <label className="flex min-h-14 items-center gap-3 rounded-full border border-border bg-card px-5 text-muted-foreground">
        <SearchIcon />
        <input
          className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 placeholder:text-muted-foreground"
          name="buscar"
          onChange={(event) => setCurrentQuery(event.target.value)}
          placeholder="Buscar por nombre o categoria..."
          type="search"
          value={currentQuery}
        />
      </label>

      <select
        className="min-h-14 cursor-pointer rounded-full border border-border bg-card px-5 text-base text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        name="categoria"
        onChange={(event) => setCurrentCategoryId(event.target.value)}
        value={currentCategoryId}
      >
        <option value="">Todas las categorias</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>

      <button
        className="inline-flex min-h-14 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:border-primary disabled:cursor-not-allowed disabled:opacity-45 xl:hidden"
        disabled={!hasChanges || isPending}
        type="submit"
      >
        {isPending ? "Filtrando..." : "Filtrar"}
      </button>
    </form>
  );
}

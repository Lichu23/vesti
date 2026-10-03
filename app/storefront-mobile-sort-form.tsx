"use client";

import { useState } from "react";

type SortOption = {
  label: string;
  value: string;
};

type StorefrontMobileSortFormProps = {
  action: string;
  category?: string;
  query?: string;
  sort?: string;
  sortOptions: SortOption[];
  onNavigate?: () => void;
};

export function StorefrontMobileSortForm({
  action,
  category,
  query,
  sort,
  sortOptions,
  onNavigate,
}: StorefrontMobileSortFormProps) {
  const initialSort = sort ?? "relevance";
  const [selectedSort, setSelectedSort] = useState(initialSort);
  const hasChanges = selectedSort !== initialSort;

  return (
    <form
      action={action}
      className="storefront-mobile-only grid gap-3 xl:hidden"
      onSubmit={() => onNavigate?.()}
    >
      {query ? <input name="buscar" type="hidden" value={query} /> : null}
      {category ? <input name="categoria" type="hidden" value={category} /> : null}
      <select
        aria-label="Ordenar productos"
        className="min-w-0 cursor-pointer rounded-full border border-input bg-card px-4 py-3 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        name="ordenar"
        onChange={(event) => setSelectedSort(event.target.value)}
        value={selectedSort}
      >
        {sortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        className="w-full cursor-pointer rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!hasChanges}
        type="submit"
      >
        Aplicar filtros
      </button>
    </form>
  );
}

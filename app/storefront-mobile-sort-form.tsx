"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
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
      <Select.Root
        items={sortOptions}
        name="ordenar"
        onValueChange={(value) => {
          if (value) setSelectedSort(value);
        }}
        value={selectedSort}
      >
        <Select.Trigger
          aria-label="Ordenar productos"
          className="flex w-full min-w-0 cursor-pointer items-center justify-between rounded-full border border-input bg-card py-3 pl-4 pr-4 text-left text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
        >
          <Select.Value />
          <Select.Icon className="text-muted-foreground transition-transform data-[popup-open]:rotate-180 motion-reduce:transition-none">
            <ChevronDown aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            alignItemWithTrigger={false}
            className="z-[1001]"
            sideOffset={6}
          >
            <Select.Popup className="w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-hidden rounded-[16px] border border-border bg-card py-1 shadow-lg outline-none transition duration-150 data-[ending-style]:scale-95 data-[starting-style]:scale-95 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none">
              {sortOptions.map((option) => (
                <Select.Item
                  className="flex min-h-11 cursor-pointer items-center justify-between gap-3 px-4 text-sm text-foreground outline-none data-[highlighted]:bg-secondary"
                  key={option.value}
                  value={option.value}
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check aria-hidden="true" className="size-4" strokeWidth={1.8} />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
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

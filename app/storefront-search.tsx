"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type StorefrontSearchProps = {
  className?: string;
  initialValue?: string;
  onNavigate?: () => void;
};

const SEARCH_DEBOUNCE_MS = 350;

export function StorefrontSearch({
  className = "ml-auto hidden w-full max-w-[720px] md:flex",
  initialValue = "",
  onNavigate,
}: StorefrontSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(initialValue);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const nextParams = new URLSearchParams(searchParams.toString());
      const trimmedQuery = query.trim();

      if (trimmedQuery) {
        nextParams.set("buscar", trimmedQuery);
      } else {
        nextParams.delete("buscar");
      }

      const nextQuery = nextParams.toString();
      if (nextQuery === searchParams.toString()) {
        return;
      }

      const nextUrl = nextQuery ? `${pathname}?${nextQuery}` : pathname;

      startTransition(() => {
        onNavigate?.();
        router.replace(nextUrl, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [onNavigate, pathname, query, router, searchParams]);

  return (
    <div
      className={`${className} h-11 items-center gap-2 rounded-full border border-input bg-card px-4 text-muted-foreground md:h-12 md:gap-3 md:px-5`}
    >
      <Search aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
      <input
        aria-label="Buscar productos"
        className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        name="buscar"
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar productos..."
        type="search"
        value={query}
      />
      {isPending ? (
        <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
          Buscando
        </span>
      ) : null}
    </div>
  );
}

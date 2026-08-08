"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type StorefrontSearchProps = {
  className?: string;
  initialValue?: string;
};

const SEARCH_DEBOUNCE_MS = 350;

export function StorefrontSearch({
  className = "ml-auto hidden w-full max-w-[720px] md:flex",
  initialValue = "",
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
        router.replace(nextUrl, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeout);
  }, [pathname, query, router, searchParams]);

  return (
    <div
      className={`${className} items-center gap-3 rounded-full border border-input bg-card px-5 py-3 text-muted-foreground`}
    >
      <span aria-hidden="true" className="text-2xl leading-none">
        &#8981;
      </span>
      <input
        aria-label="Buscar productos"
        className="w-full bg-transparent text-base outline-none placeholder:text-muted-foreground"
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

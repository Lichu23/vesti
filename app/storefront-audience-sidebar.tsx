"use client";

import Link from "next/link";

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
  ordenar?: string;
};

const AUDIENCE_SECTIONS = [
  { href: "/mujer", key: "WOMEN" as const, label: "Mujer" },
  { href: "/hombre", key: "MEN" as const, label: "Hombre" },
  { href: "/ninos", key: "KIDS" as const, label: "Ninos" },
];

function buildCategoryHref(
  audiencePath: string,
  slug: string,
  params: StorefrontSidebarParams,
) {
  const searchParams = new URLSearchParams();

  searchParams.set("categoria", slug);
  if (params.buscar) searchParams.set("buscar", params.buscar);
  if (params.ordenar && params.ordenar !== "relevance") {
    searchParams.set("ordenar", params.ordenar);
  }

  const query = searchParams.toString();
  return `${audiencePath}?${query}`;
}

export function StorefrontAudienceSidebar({
  activeAudiencePath,
  activeCategory,
  categoryGroups,
  className = "storefront-desktop-only hidden xl:block",
  isDisabled = false,
  onNavigate,
  searchParams,
}: {
  activeAudiencePath?: string;
  activeCategory?: string;
  className?: string;
  categoryGroups: StorefrontSidebarCategoryGroups;
  isDisabled?: boolean;
  onNavigate?: () => void;
  searchParams: StorefrontSidebarParams;
}) {
  return (
    <nav aria-label="Audiencias" className={className}>
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
        Comprar por
      </p>
      <div className="space-y-4 text-base text-muted-foreground">
        {AUDIENCE_SECTIONS.map((section) => {
          const categories = categoryGroups[section.key];
          const hasActiveCategory = categories.some(
            (category) => category.slug === activeCategory,
          );
          const isActiveAudience = activeAudiencePath === section.href;
          const isCurrentAllProducts = isActiveAudience && !activeCategory;
          const isOpen = isActiveAudience || hasActiveCategory;

          return (
            <details
              className="group border-b border-border pb-4"
              key={section.href}
              open={isOpen}
            >
              <summary
                className={`flex cursor-pointer list-none items-center justify-between gap-3 ${
                  isActiveAudience || hasActiveCategory
                    ? "font-semibold text-foreground"
                    : ""
                }`}
              >
                <span>{section.label}</span>
                <span
                  aria-hidden="true"
                  className="text-sm transition group-open:rotate-180"
                >
                  v
                </span>
              </summary>
              <ul className="mt-3 space-y-3 pl-3 text-sm">
                <li>
                  {isCurrentAllProducts ? (
                    <span
                      aria-current="page"
                      className="font-semibold text-foreground"
                    >
                      Ver todo
                    </span>
                  ) : (
                    <Link
                      className="cursor-pointer transition hover:text-foreground"
                      href={section.href}
                      aria-disabled={isDisabled}
                      onClick={(event) => {
                        if (isDisabled) {
                          event.preventDefault();
                          return;
                        }
                        onNavigate?.();
                      }}
                      tabIndex={isDisabled ? -1 : undefined}
                    >
                      Ver todo
                    </Link>
                  )}
                </li>
                {categories.map((category) => (
                  <li key={`${section.href}-${category.id}`}>
                    <Link
                      className={`cursor-pointer transition hover:text-foreground ${
                        activeCategory === category.slug
                          ? "font-semibold text-foreground"
                          : ""
                      }`}
                      href={buildCategoryHref(
                        section.href,
                        category.slug,
                        searchParams,
                      )}
                      aria-disabled={isDisabled}
                      onClick={(event) => {
                        if (isDisabled) {
                          event.preventDefault();
                          return;
                        }
                        onNavigate?.();
                      }}
                      tabIndex={isDisabled ? -1 : undefined}
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </details>
          );
        })}
      </div>
    </nav>
  );
}

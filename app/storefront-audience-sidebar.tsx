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

function buildCategoryHref(slug: string, params: StorefrontSidebarParams) {
  const searchParams = new URLSearchParams();

  if (params.buscar) searchParams.set("buscar", params.buscar);
  if (params.ordenar && params.ordenar !== "relevance") {
    searchParams.set("ordenar", params.ordenar);
  }

  const query = searchParams.toString();
  return query ? `/categories/${slug}?${query}` : `/categories/${slug}`;
}

export function StorefrontAudienceSidebar({
  activeAudiencePath,
  activeCategory,
  categoryGroups,
  className = "storefront-desktop-only hidden xl:block",
  searchParams,
}: {
  activeAudiencePath?: string;
  activeCategory?: string;
  className?: string;
  categoryGroups: StorefrontSidebarCategoryGroups;
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
                  <Link
                    className={`cursor-pointer transition hover:text-foreground ${
                      isActiveAudience && !activeCategory
                        ? "font-semibold text-foreground"
                        : ""
                    }`}
                    href={section.href}
                  >
                    Ver todo
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={`${section.href}-${category.id}`}>
                    <Link
                      className={`cursor-pointer transition hover:text-foreground ${
                        activeCategory === category.slug
                          ? "font-semibold text-foreground"
                          : ""
                      }`}
                      href={buildCategoryHref(category.slug, searchParams)}
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

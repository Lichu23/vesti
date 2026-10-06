import Link from "next/link";

import { buildAudienceHref } from "./storefront-routes";

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

export function StorefrontAudienceSidebar({
  activeAudiencePath,
  activeCategory,
  categoryGroups,
  searchParams,
}: {
  activeAudiencePath?: string;
  activeCategory?: string;
  categoryGroups: StorefrontSidebarCategoryGroups;
  searchParams: StorefrontSidebarParams;
}) {
  // Only search and sort carry over; page numbers must not.
  const linkParams = {
    buscar: searchParams.buscar,
    ordenar: searchParams.ordenar,
  };

  return (
    <nav
      aria-label="Audiencias"
      className="storefront-desktop-only hidden xl:block"
    >
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
        Comprar por
      </p>
      <div className="space-y-6 text-base text-muted-foreground">
        {AUDIENCE_SECTIONS.map((section) => {
          const categories = categoryGroups[section.key];
          const isActiveAudience = activeAudiencePath === section.href;
          const isAudienceRoot = isActiveAudience && !activeCategory;

          return (
            <div className="border-b border-border pb-6" key={section.href}>
              <Link
                aria-current={isAudienceRoot ? "page" : undefined}
                className={`transition hover:text-foreground ${
                  isActiveAudience ? "font-semibold text-foreground" : ""
                }`}
                href={buildAudienceHref(section.href, undefined, linkParams)}
              >
                {section.label}
              </Link>
              <ul className="mt-3 space-y-3 pl-3 text-sm">
                {categories.map((category) => {
                  const isActive =
                    isActiveAudience && activeCategory === category.slug;

                  return (
                    <li key={`${section.href}-${category.id}`}>
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        className={`transition hover:text-foreground ${
                          isActive ? "font-semibold text-foreground" : ""
                        }`}
                        href={buildAudienceHref(
                          section.href,
                          category.slug,
                          linkParams,
                        )}
                      >
                        {category.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </nav>
  );
}

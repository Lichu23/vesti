import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

import { Audience } from "@/generated/prisma/client";
import {
  getStorefrontHome,
  STOREFRONT_PAGE_SIZE,
} from "@/lib/storefront";

import { StorefrontAudienceSidebar } from "./storefront-audience-sidebar";
import { StorefrontProductCard } from "./storefront-product-card";
import { StorefrontPagination } from "./storefront-pagination";
import { buildAudienceHref } from "./storefront-routes";

type AudienceSearchParams = {
  buscar?: string | string[];
  categoria?: string | string[];
  ordenar?: string | string[];
  pagina?: string | string[];
};

type AudienceConfig = {
  audience: Audience;
  description: string;
  title: string;
};

const SORT_VALUES = ["relevance", "newest", "price-asc", "price-desc"];

const SORT_OPTIONS = [
  { label: "Relevancia", value: "relevance" },
  { label: "Novedades", value: "newest" },
  { label: "Precio: menor a mayor", value: "price-asc" },
  { label: "Precio: mayor a menor", value: "price-desc" },
];

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeSearchParams(params: AudienceSearchParams) {
  const ordenar = getSingleParam(params.ordenar);

  return {
    buscar: getSingleParam(params.buscar),
    categoria: getSingleParam(params.categoria),
    ordenar: ordenar && SORT_VALUES.includes(ordenar) ? ordenar : undefined,
    pagina: getSingleParam(params.pagina),
  };
}

export async function AudiencePage({
  basePath,
  categoria,
  config,
  searchParams,
}: {
  basePath: string;
  categoria?: string;
  config: AudienceConfig;
  searchParams: Promise<AudienceSearchParams>;
}) {
  const params = normalizeSearchParams(await searchParams);

  // Old links used /mujer?categoria=slug; categories now live at /mujer/slug.
  if (!categoria && params.categoria) {
    permanentRedirect(
      buildAudienceHref(basePath, params.categoria, {
        buscar: params.buscar,
        ordenar: params.ordenar,
        pagina: params.pagina,
      }),
    );
  }

  const currentPath = categoria ? `${basePath}/${categoria}` : basePath;
  const { activeCategory, audienceCategories, products, store, totalProducts } =
    await getStorefrontHome({
      audience: config.audience,
      categorySlug: categoria,
      query: params.buscar,
      sort: params.ordenar,
      page: Math.max(1, Number(params.pagina) || 1),
    });

  if (!store || (categoria && !activeCategory)) {
    notFound();
  }

  // New key per query so the grid remounts and replays its entrance.
  const gridKey = [categoria, params.buscar, params.ordenar, params.pagina].join("|");
  const title = activeCategory
    ? `${config.title}: ${activeCategory.name}`
    : config.title;

  return (
    <main className="min-h-screen bg-background text-foreground">

      <div className="storefront-shell grid gap-5 px-4 py-5 sm:gap-8 sm:px-8 sm:py-10 xl:grid-cols-[220px_minmax(0,1fr)_240px] xl:gap-12">
        <StorefrontAudienceSidebar
          activeAudiencePath={basePath}
          activeCategory={categoria}
          categoryGroups={audienceCategories}
          searchParams={params}
        />

        <section className="min-w-0 space-y-4 sm:space-y-8">
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                {config.description}
              </p>
              <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
                {title}
              </h1>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[4px] border border-border bg-card p-8 text-center text-muted-foreground">
              Todavia no hay productos activos para mostrar.
            </div>
          ) : (
            <div
              className="-mx-4 grid gap-x-2 gap-y-6 min-[360px]:grid-cols-2 sm:mx-0 sm:gap-x-4 sm:gap-y-8 xl:grid-cols-4"
              key={gridKey}
            >
              {products.map((product, index) => (
                <StorefrontProductCard
                  index={index}
                  key={product.id}
                  priority={index === 0}
                  product={product}
                />
              ))}
            </div>
          )}
          <StorefrontPagination basePath={currentPath} currentPage={Math.max(1, Number(params.pagina) || 1)} params={{ buscar: params.buscar, ordenar: params.ordenar }} totalPages={Math.ceil(totalProducts / STOREFRONT_PAGE_SIZE)} />
        </section>

        <aside className="storefront-desktop-only hidden xl:block">
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
            Ordenar por
          </p>
          <ul className="space-y-5 text-base text-muted-foreground">
            {SORT_OPTIONS.map((option) => (
              <li key={option.value}>
                <Link
                  className={`cursor-pointer text-left transition hover:text-foreground ${
                    (params.ordenar ?? "relevance") === option.value
                      ? "border-b-2 border-primary font-semibold text-foreground"
                      : ""
                  }`}
                  href={buildAudienceHref(basePath, categoria, {
                    buscar: params.buscar,
                    ordenar: option.value,
                  })}
                >
                  {option.label}
                </Link>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}

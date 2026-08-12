import Link from "next/link";
import { notFound } from "next/navigation";

import { getStorefrontHome } from "@/lib/storefront";

import { CartToggleButton } from "../../cart-buttons";
import { StorefrontAudienceSidebar } from "../../storefront-audience-sidebar";
import { StorefrontMobileFilterDrawer } from "../../storefront-mobile-filter-drawer";
import { StorefrontMobileSortForm } from "../../storefront-mobile-sort-form";
import { StorefrontProductCard } from "../../storefront-product-card";
import { StorefrontPagination } from "../../storefront-pagination";
import { StorefrontSearch } from "../../storefront-search";
import { StorefrontViewportMode } from "../../storefront-viewport-mode";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    buscar?: string | string[];
    ordenar?: string | string[];
    pagina?: string | string[];
  }>;
};

type NormalizedCategorySearchParams = {
  buscar?: string;
  ordenar?: string;
  pagina?: string;
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

function normalizeSearchParams(
  params: Awaited<CategoryPageProps["searchParams"]>,
): NormalizedCategorySearchParams {
  const ordenar = getSingleParam(params.ordenar);

  return {
    buscar: getSingleParam(params.buscar),
    ordenar: ordenar && SORT_VALUES.includes(ordenar) ? ordenar : undefined,
    pagina: getSingleParam(params.pagina),
  };
}

function buildCategoryHref(
  slug: string,
  params: NormalizedCategorySearchParams,
) {
  const searchParams = new URLSearchParams();

  if (params.buscar) searchParams.set("buscar", params.buscar);
  if (params.ordenar && params.ordenar !== "relevance") {
    searchParams.set("ordenar", params.ordenar);
  }

  const query = searchParams.toString();
  return query ? `/categories/${slug}?${query}` : `/categories/${slug}`;
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams]);
  const currentParams = normalizeSearchParams(rawSearchParams);
  const { activeCategory, audienceCategories, products, store, totalProducts } =
    await getStorefrontHome({
      categorySlug: slug,
      query: currentParams.buscar,
      sort: currentParams.ordenar,
      page: Math.max(1, Number(currentParams.pagina) || 1),
    });

  if (!store || !activeCategory) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StorefrontViewportMode />
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="grid min-h-24 grid-cols-[48px_1fr_48px] items-center gap-4 px-5 sm:px-8 md:flex md:gap-6">
          <StorefrontMobileFilterDrawer
            activeCategory={slug}
            categoryGroups={audienceCategories}
            searchParams={currentParams}
          />

          <Link
            aria-label="Ir al inicio"
            className="cursor-pointer justify-self-center md:justify-self-auto"
            href="/"
          >
            <span className="block font-serif text-3xl leading-none text-foreground">
              Thoemia
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.45em] text-foreground">
              Intimo
            </span>
          </Link>

          <StorefrontSearch
            initialValue={currentParams.buscar}
            key={currentParams.buscar ?? "empty-search"}
          />

          <CartToggleButton className="ml-0 justify-self-end" />
        </div>
      </header>

      <div className="storefront-shell grid gap-8 px-5 py-10 sm:px-8 xl:grid-cols-[220px_minmax(0,1fr)_240px] xl:gap-12">
        <StorefrontAudienceSidebar
          activeCategory={slug}
          categoryGroups={audienceCategories}
          searchParams={currentParams}
        />

        <section className="min-w-0 space-y-8">
          <div className="space-y-4">
            <StorefrontSearch
              className="flex w-full md:hidden"
              initialValue={currentParams.buscar}
              key={`mobile-${currentParams.buscar ?? "empty-search"}`}
            />
            <StorefrontMobileSortForm
              action={`/categories/${slug}`}
              query={currentParams.buscar}
              sort={currentParams.ordenar}
              sortOptions={SORT_OPTIONS}
            />
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                Categoria
              </p>
              <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                {activeCategory.name}
              </h1>
              <p className="mt-3 text-lg text-muted-foreground">
                {products.length} productos
              </p>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="rounded-[4px] border border-border bg-card p-8 text-center text-muted-foreground">
              Todavia no hay productos activos para mostrar.
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {products.map((product) => (
                <StorefrontProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          <StorefrontPagination basePath={`/categories/${slug}`} currentPage={Math.max(1, Number(currentParams.pagina) || 1)} params={{ buscar: currentParams.buscar, ordenar: currentParams.ordenar }} totalPages={Math.ceil(totalProducts / 24)} />
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
                    (currentParams.ordenar ?? "relevance") === option.value
                      ? "border-b-2 border-primary font-semibold text-foreground"
                      : ""
                  }`}
                  href={buildCategoryHref(slug, {
                    ...currentParams,
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

      <span className="sr-only">Tienda online de {store.name}</span>
    </main>
  );
}

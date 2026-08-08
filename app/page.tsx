import Link from "next/link";

import { getStorefrontHome } from "@/lib/storefront";
import { StorefrontSearch } from "./storefront-search";
import { StorefrontViewportMode } from "./storefront-viewport-mode";

type HomeSearchParams = {
  categoria?: string | string[];
  buscar?: string | string[];
  ordenar?: string | string[];
};

type HomeProps = {
  searchParams: Promise<HomeSearchParams>;
};

type NormalizedHomeSearchParams = {
  categoria?: string;
  buscar?: string;
  ordenar?: string;
};

type StorefrontProduct = Awaited<
  ReturnType<typeof getStorefrontHome>
>["products"][number];

type StorefrontCategory = Awaited<
  ReturnType<typeof getStorefrontHome>
>["categories"][number];

const SORT_VALUES = ["relevance", "newest", "price-asc", "price-desc"];

const SORT_OPTIONS = [
  { label: "Relevancia", value: "relevance" },
  { label: "Novedades", value: "newest" },
  {
    label: "Precio: menor a mayor",
    value: "price-asc",
  },
  {
    label: "Precio: mayor a menor",
    value: "price-desc",
  },
];

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function normalizeSearchParams(
  params: HomeSearchParams,
): NormalizedHomeSearchParams {
  const ordenar = getSingleParam(params.ordenar);

  return {
    buscar: getSingleParam(params.buscar),
    categoria: getSingleParam(params.categoria),
    ordenar: ordenar && SORT_VALUES.includes(ordenar) ? ordenar : undefined,
  };
}

function formatPrice(value: StorefrontProduct["basePrice"]) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  })
    .format(Number(value))
    .replace(/\$\s*/, "$ ");
}

function getProductStock(product: StorefrontProduct) {
  return product.variants.reduce((total, variant) => total + variant.stock, 0);
}

function getSizeLabel(product: StorefrontProduct) {
  return product.sizeDisplayText ?? "Unico";
}

function buildHref(params: NormalizedHomeSearchParams) {
  const searchParams = new URLSearchParams();

  if (params.categoria) searchParams.set("categoria", params.categoria);
  if (params.buscar) searchParams.set("buscar", params.buscar);
  if (params.ordenar && params.ordenar !== "relevance") {
    searchParams.set("ordenar", params.ordenar);
  }

  const query = searchParams.toString();
  return query ? `/?${query}` : "/";
}

function ProductCard({ product }: { product: StorefrontProduct }) {
  const image = product.images[0];
  const stock = getProductStock(product);
  const hasStock = stock > 0;
  const unitLabel = product.saleUnit === "PACK" ? "pack" : "c/u";

  return (
    <article className="group overflow-hidden rounded-[4px] border border-border bg-card transition hover:border-primary">
      <div className="relative aspect-square overflow-hidden bg-muted">
        {image ? (
          <div
            aria-label={image.alt ?? product.name}
            className="h-full w-full bg-cover bg-center transition duration-500 group-hover:scale-105"
            role="img"
            style={{ backgroundImage: `url(${image.url})` }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-muted text-sm uppercase tracking-[0.24em] text-muted-foreground">
            Sin imagen
          </div>
        )}

        {!hasStock ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-full bg-destructive px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-destructive-foreground">
              Sin stock
            </span>
          </div>
        ) : null}
      </div>

      <div className="flex min-h-56 flex-col gap-4 p-5">
        <div className="space-y-2">
          <h3 className="font-serif text-xl font-semibold leading-tight text-foreground">
            {product.name}
          </h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>Talle: {getSizeLabel(product)}</p>
            <p>Marca: {product.brand?.name ?? "Thoemia"}</p>
          </div>
          {product.description ? (
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">
              {product.description}
            </p>
          ) : null}
        </div>

        <div className="mt-auto flex items-center justify-between gap-4">
          <p className="font-serif text-2xl text-foreground">
            {formatPrice(product.basePrice)}
            <span className="ml-1 font-sans text-xs text-muted-foreground">
              {unitLabel}
            </span>
          </p>
          <button
            aria-label={`Agregar ${product.name} al carrito`}
            className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary text-2xl leading-none text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
            disabled={!hasStock}
            type="button"
          >
            +
          </button>
        </div>
      </div>
    </article>
  );
}

function CategoryList({
  activeCategory,
  categories,
  searchParams,
}: {
  activeCategory?: string;
  categories: StorefrontCategory[];
  searchParams: NormalizedHomeSearchParams;
}) {
  return (
    <nav aria-label="Colecciones" className="storefront-desktop-only hidden xl:block">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
        Colecciones
      </p>
      <ul className="space-y-3 text-base text-muted-foreground">
        <li>
          <Link
            className={`cursor-pointer ${
              !activeCategory ? "font-semibold text-foreground" : ""
            }`}
            href={buildHref({ ...searchParams, categoria: undefined })}
          >
            Todos los productos
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              className={`cursor-pointer transition hover:text-foreground ${
                activeCategory === category.slug
                  ? "font-semibold text-foreground"
                  : ""
              }`}
              href={buildHref({ ...searchParams, categoria: category.slug })}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SortSidebar({
  searchParams,
}: {
  searchParams: NormalizedHomeSearchParams;
}) {
  const currentSort = searchParams.ordenar ?? "relevance";

  return (
    <aside className="storefront-desktop-only hidden xl:block">
      <p className="mb-5 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
        Ordenar por
      </p>
      <ul className="space-y-5 text-base text-muted-foreground">
        {SORT_OPTIONS.map((option) => (
          <li key={option.value}>
            <Link
              className={`cursor-pointer text-left transition hover:text-foreground ${
                currentSort === option.value
                  ? "border-b-2 border-primary font-semibold text-foreground"
                  : ""
              }`}
              href={buildHref({ ...searchParams, ordenar: option.value })}
            >
              {option.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const params = normalizeSearchParams(await searchParams);
  const { activeCategory, categories, products, store } =
    await getStorefrontHome({
      categorySlug: params.categoria,
      query: params.buscar,
      sort: params.ordenar,
    });
  const storeName = store?.name ?? "Thoemia Intimo";
  const title = activeCategory?.name ?? "Todos los productos";

  return (
    <main className="min-h-screen bg-background text-foreground">
      <StorefrontViewportMode />
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="flex min-h-24 items-center gap-6 px-5 sm:px-8">
          <Link aria-label="Ir al inicio" className="cursor-pointer" href="/">
            <span className="block font-serif text-3xl leading-none text-foreground">
              Thoemia
            </span>
            <span className="mt-2 block text-xs uppercase tracking-[0.45em] text-foreground">
              Intimo
            </span>
          </Link>

          <nav className="hidden items-center gap-8 text-base text-muted-foreground lg:flex">
            {categories.slice(0, 4).map((category) => (
              <Link
                className="cursor-pointer transition hover:text-foreground"
                href={buildHref({ ...params, categoria: category.slug })}
                key={category.id}
              >
                {category.name}
              </Link>
            ))}
            <Link
              className="cursor-pointer transition hover:text-foreground"
              href={buildHref({ ...params, categoria: undefined })}
            >
              Ver todo
            </Link>
          </nav>

          <StorefrontSearch
            initialValue={params.buscar}
            key={params.buscar ?? "empty-search"}
          />

          <button
            aria-label="Abrir carrito"
            className="ml-auto flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl text-foreground transition hover:border-primary md:ml-0"
            type="button"
          >
            &#128717;
          </button>
        </div>
      </header>

      <div className="storefront-shell grid gap-8 px-5 py-10 sm:px-8 xl:grid-cols-[220px_minmax(0,1fr)_240px] xl:gap-12">
        <CategoryList
          activeCategory={params.categoria}
          categories={categories}
          searchParams={params}
        />

        <section className="min-w-0 space-y-8">
          <div className="space-y-4">
            <StorefrontSearch
              className="flex w-full md:hidden"
              initialValue={params.buscar}
              key={`mobile-${params.buscar ?? "empty-search"}`}
            />
            <form action="/" className="storefront-mobile-only grid gap-3 xl:hidden">
              {params.buscar ? (
                <input name="buscar" type="hidden" value={params.buscar} />
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <select
                  aria-label="Filtrar por coleccion"
                  className="min-w-0 cursor-pointer rounded-full border border-input bg-card px-4 py-3 text-sm text-foreground outline-none"
                  defaultValue={params.categoria ?? ""}
                  name="categoria"
                >
                  <option value="">Todas</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Ordenar productos"
                  className="min-w-0 cursor-pointer rounded-full border border-input bg-card px-4 py-3 text-sm text-foreground outline-none"
                  defaultValue={params.ordenar ?? "relevance"}
                  name="ordenar"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                className="w-full cursor-pointer rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
                type="submit"
              >
                Aplicar filtros
              </button>
            </form>
            <div>
              <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
                {title}
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
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </section>

        <SortSidebar searchParams={params} />
      </div>

      <span className="sr-only">Tienda online de {storeName}</span>
    </main>
  );
}

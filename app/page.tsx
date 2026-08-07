import Link from "next/link";

import { getStorefrontHome } from "@/lib/storefront";

export default async function Home() {
  const { categories, featuredProducts, store } = await getStorefrontHome();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 p-8">
      <header className="space-y-4 py-12">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
          {store?.name ?? "Thoemia Intimo"}
        </p>
        <div className="max-w-2xl space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Catalog by category
          </h1>
          <p className="text-zinc-600">
            Browse the categories managed from the admin catalog.
          </p>
        </div>
      </header>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold">Categories</h2>
            <p className="text-sm text-zinc-600">
              Active categories appear here automatically.
            </p>
          </div>
        </div>

        {categories.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            No active categories yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <Link
                className="rounded-xl border p-5 transition hover:border-zinc-400"
                href={`/categories/${category.slug}`}
                key={category.id}
              >
                <h3 className="font-semibold">{category.name}</h3>
                <p className="mt-2 text-sm text-zinc-500">
                  {category._count.products} products
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4">
        <div>
          <h2 className="text-2xl font-semibold">Featured products</h2>
          <p className="text-sm text-zinc-600">
            Products marked as featured in admin.
          </p>
        </div>

        {featuredProducts.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            No featured products yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map((product) => {
              const image = product.images[0];

              return (
                <article className="rounded-xl border p-4" key={product.id}>
                  {image ? (
                    <div
                      aria-label={image.alt ?? product.name}
                      className="mb-4 aspect-square rounded-lg bg-zinc-100 bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url(${image.url})` }}
                    />
                  ) : (
                    <div className="mb-4 flex aspect-square items-center justify-center rounded-lg bg-zinc-100 text-sm text-zinc-500">
                      No image
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-zinc-500">/{product.slug}</p>
                    <p className="text-sm font-medium">
                      ${product.basePrice.toString()}
                    </p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

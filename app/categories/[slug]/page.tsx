import Link from "next/link";

import { getCategoryPage } from "@/lib/storefront";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const { category, store } = await getCategoryPage(slug);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 p-8">
      <header className="space-y-4">
        <Link className="text-sm font-medium text-zinc-600" href="/">
          Back to categories
        </Link>
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">{store.name}</p>
          <h1 className="text-3xl font-semibold">{category.name}</h1>
          <p className="text-sm text-zinc-600">
            Products available in this category.
          </p>
        </div>
      </header>

      {category.products.length === 0 ? (
        <p className="rounded-xl border p-4 text-sm text-zinc-600">
          No products available in this category yet.
        </p>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {category.products.map((product) => {
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
                  <h2 className="font-semibold">{product.name}</h2>
                  <p className="text-sm text-zinc-500">/{product.slug}</p>
                  <p className="text-sm font-medium">
                    ${product.basePrice.toString()}
                  </p>
                </div>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

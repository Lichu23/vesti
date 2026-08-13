import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { getStorefrontProduct } from "@/lib/storefront";

import { CartToggleButton } from "../../cart-buttons";
import { StorefrontVariantSelector } from "../../storefront-variant-selector";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  })
    .format(value)
    .replace(/\$\s*/, "$ ");
}

function getSaleUnitLabel(saleUnit: "PACK" | "UNIT") {
  return saleUnit === "PACK" ? "pack" : "c/u";
}

function getTotalStock(
  variants: Awaited<ReturnType<typeof getStorefrontProduct>>["product"]["variants"],
) {
  return variants.reduce((total, variant) => total + variant.stock, 0);
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const { product, store } = await getStorefrontProduct(slug);
  const image = product.images[0];

  return {
    description:
      product.description ?? `${product.name} en ${store.name ?? "Thoemia"}`,
    openGraph: image
      ? {
          images: [{ url: image.url }],
          title: product.name,
        }
      : undefined,
    title: `${product.name} | ${store.name}`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const { product, store } = await getStorefrontProduct(slug);
  const images = product.images;
  const mainImage = images[0];
  const totalStock = getTotalStock(product.variants);
  const hasStock = totalStock > 0;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-sm">
        <div className="grid min-h-24 grid-cols-[48px_1fr_48px] items-center gap-4 px-5 sm:px-8 md:flex md:gap-6">
          <Link
            aria-label="Volver a productos"
            className="flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl text-foreground transition hover:border-primary"
            href="/"
          >
            ←
          </Link>

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

          <CartToggleButton className="ml-0 justify-self-end md:ml-auto" />
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-14">
        <section className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[4px] border border-border bg-muted">
            {mainImage ? (
              <Image
                alt={mainImage.alt ?? product.name}
                className="object-cover"
                fill
                preload
                sizes="(max-width: 1024px) 100vw, 60vw"
                src={mainImage.url}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm uppercase tracking-[0.24em] text-muted-foreground">
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

          {images.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {images.slice(1).map((image) => (
                <div
                  className="relative aspect-square overflow-hidden rounded-[4px] border border-border bg-muted"
                  key={image.url}
                >
                  <Image
                    alt={image.alt ?? product.name}
                    className="object-cover"
                    fill
                    loading="lazy"
                    sizes="(max-width: 640px) 25vw, 160px"
                    src={image.url}
                  />
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-8">
          <div className="space-y-4">
            <Link
              className="inline-flex cursor-pointer text-sm text-muted-foreground transition hover:text-foreground"
              href={`/categories/${product.category.slug}`}
            >
              {product.category.name}
            </Link>

            <div>
              <h1 className="font-serif text-5xl leading-tight text-foreground">
                {product.name}
              </h1>
            </div>

            {product.description ? (
              <p className="text-base leading-7 text-muted-foreground">
                {product.description}
              </p>
            ) : null}
          </div>

          <div className="rounded-[4px] border border-border bg-card p-5">
            <StorefrontVariantSelector
              basePrice={Number(product.basePrice)}
              imageAlt={mainImage?.alt}
              imageUrl={mainImage?.url}
              productId={product.id}
              productName={product.name}
              saleUnit={product.saleUnit}
              variants={product.variants.map((variant) => ({
                color: variant.color,
                id: variant.id,
                price: Number(variant.price ?? product.basePrice),
                size: variant.size,
                stock: variant.stock,
              }))}
            />
          </div>

          <dl className="grid gap-3 border-t border-border pt-6 text-sm text-muted-foreground">
            <div className="flex justify-between gap-4">
              <dt>Precio base</dt>
              <dd className="font-medium text-foreground">
                {formatPrice(Number(product.basePrice))}{" "}
                {getSaleUnitLabel(product.saleUnit)}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Talle</dt>
              <dd className="font-medium text-foreground">
                {product.sizeDisplayText ?? "Unico"}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt>Disponibilidad</dt>
              <dd className="font-medium text-foreground">
                {hasStock ? "Disponible" : "Sin stock"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <span className="sr-only">Tienda online de {store.name}</span>
    </main>
  );
}

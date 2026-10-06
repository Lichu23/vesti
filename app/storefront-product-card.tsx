import Image from "next/image";
import Link from "next/link";

import { getStorefrontHome } from "@/lib/storefront";

import { StorefrontVariantSelector } from "./storefront-variant-selector";

type StorefrontProduct = Awaited<
  ReturnType<typeof getStorefrontHome>
>["products"][number];

function getProductStock(product: StorefrontProduct) {
  return product.variants.reduce((total, variant) => total + variant.stock, 0);
}

function getSizeLabel(product: StorefrontProduct) {
  return product.sizeDisplayText ?? "Unico";
}

export function StorefrontProductCard({
  priority = false,
  product,
}: {
  priority?: boolean;
  product: StorefrontProduct;
}) {
  const image = product.images[0];
  const stock = getProductStock(product);
  const hasStock = stock > 0;

  return (
    <article className="group overflow-hidden rounded-[4px] border border-border bg-card transition hover:border-primary">
      <Link
        aria-label={`Ver ${product.name}`}
        className="relative block aspect-square cursor-pointer overflow-hidden bg-muted"
        href={`/products/${product.slug}`}
      >
        {image ? (
          <Image
            alt={image.alt ?? product.name}
            className="object-cover transition duration-500 group-hover:scale-105"
            fill
            loading={priority ? "eager" : "lazy"}
            preload={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
            src={image.url}
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
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:min-h-56 sm:gap-4 sm:p-5">
        <div className="space-y-2">
          <Link className="cursor-pointer" href={`/products/${product.slug}`}>
            <h3 className="line-clamp-2 font-serif text-lg font-semibold leading-tight text-foreground transition hover:text-primary sm:text-xl">
              {product.name}
            </h3>
          </Link>
          <div className="hidden space-y-1 text-sm text-muted-foreground sm:block">
            <p>Talle: {getSizeLabel(product)}</p>
          </div>
          {product.description ? (
            <p className="hidden line-clamp-2 text-sm leading-6 text-muted-foreground sm:block">
              {product.description}
            </p>
          ) : null}
        </div>

        <StorefrontVariantSelector
          basePrice={Number(product.basePrice)}
          display="card"
          imageAlt={image?.alt}
          imageUrl={image?.url}
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
    </article>
  );
}

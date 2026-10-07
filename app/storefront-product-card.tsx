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

const MAX_STAGGER_STEPS = 8;
const STAGGER_STEP_MS = 45;

export function StorefrontProductCard({
  index = 0,
  priority = false,
  product,
}: {
  index?: number;
  priority?: boolean;
  product: StorefrontProduct;
}) {
  const image = product.images[0];
  const stock = getProductStock(product);
  const hasStock = stock > 0;

  return (
    <article
      className="flex animate-card-in flex-col motion-reduce:animate-none"
      style={{
        animationDelay: `${Math.min(index, MAX_STAGGER_STEPS) * STAGGER_STEP_MS}ms`,
      }}
    >
      <Link
        aria-label={`Ver ${product.name}`}
        className="relative block aspect-[4/5] cursor-pointer sm:aspect-square overflow-hidden bg-muted"
        href={`/products/${product.slug}`}
      >
        {image ? (
          <Image
            alt={image.alt ?? product.name}
            className="object-cover"
            fill
            loading={priority ? "eager" : "lazy"}
            preload={priority}
            sizes="(max-width: 1279px) 50vw, 25vw"
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

      <div className="flex flex-col items-center gap-1 px-1 pt-3 text-center">
        <Link
          className="block w-full cursor-pointer"
          href={`/products/${product.slug}`}
        >
          <h3 className="truncate font-serif text-base font-semibold leading-tight text-foreground transition hover:text-primary sm:text-lg">
            {product.name}
          </h3>
        </Link>

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

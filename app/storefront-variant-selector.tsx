"use client";

import { useMemo, useState } from "react";

import { useCart } from "./cart-context";

type StorefrontVariant = {
  color: string | null;
  id: string;
  price: number;
  size: string;
  stock: number;
};

type StorefrontVariantSelectorProps = {
  basePrice: number;
  imageAlt?: string | null;
  imageUrl?: string | null;
  productId: string;
  productName: string;
  saleUnit: "PACK" | "UNIT";
  variants: StorefrontVariant[];
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

function getVariantLabel(variant: StorefrontVariant) {
  const parts = [`Talle: ${variant.size || "Unico"}`];

  if (variant.color) {
    parts.push(`Color: ${variant.color}`);
  }

  return parts.join(" / ");
}

function getSizeLabel(variant: StorefrontVariant) {
  return variant.size || "Unico";
}

export function StorefrontVariantSelector({
  basePrice,
  imageAlt,
  imageUrl,
  productId,
  productName,
  saleUnit,
  variants,
}: StorefrontVariantSelectorProps) {
  const { addItem } = useCart();
  const inStockVariants = useMemo(
    () => variants.filter((variant) => variant.stock > 0),
    [variants],
  );
  const defaultVariantId = inStockVariants[0]?.id ?? "";
  const [selectedVariantId, setSelectedVariantId] = useState(defaultVariantId);
  const storedSelectedVariant = inStockVariants.find(
    (variant) => variant.id === selectedVariantId,
  );
  const effectiveSelectedVariantId = storedSelectedVariant
    ? selectedVariantId
    : defaultVariantId;
  const selectedVariant =
    storedSelectedVariant ??
    inStockVariants.find((variant) => variant.id === defaultVariantId);
  const hasStock = inStockVariants.length > 0;
  const needsVariantSelection = variants.length > 1;
  const unitLabel = saleUnit === "PACK" ? "pack" : "c/u";
  const displayedPrice = selectedVariant?.price ?? basePrice;

  function addSelectedVariant() {
    if (!selectedVariant) return;

    addItem({
      imageAlt,
      imageUrl,
      maxQuantity: selectedVariant.stock,
      productId,
      productName,
      unitPrice: selectedVariant.price,
      variantColor: selectedVariant.color,
      variantId: selectedVariant.id,
      variantSize: selectedVariant.size,
    });
  }

  return (
    <div className="mt-auto grid gap-3">
      {needsVariantSelection ? (
        <fieldset className="grid gap-2">
          <legend className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Talle
          </legend>
          <div className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const isSelected = effectiveSelectedVariantId === variant.id;
              const isOutOfStock = variant.stock <= 0;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`min-w-12 cursor-pointer rounded-full border px-3 py-2 text-sm transition disabled:cursor-not-allowed ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card text-foreground hover:border-primary"
                  } ${
                    isOutOfStock
                      ? "border-border bg-muted text-muted-foreground line-through opacity-50 hover:border-border"
                      : ""
                  }`}
                  disabled={isOutOfStock}
                  key={variant.id}
                  onClick={() => setSelectedVariantId(variant.id)}
                  title={isOutOfStock ? "Sin stock" : undefined}
                  type="button"
                >
                  {getSizeLabel(variant)}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="flex items-center justify-between gap-4">
        <p className="font-serif text-2xl text-foreground">
          {formatPrice(displayedPrice)}
          <span className="ml-1 font-sans text-xs text-muted-foreground">
            {unitLabel}
          </span>
        </p>
        <button
          aria-label={
            selectedVariant
              ? `Agregar ${productName} ${getVariantLabel(
                  selectedVariant,
                )} al carrito`
              : `Elegir talle para ${productName}`
          }
          className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary text-2xl leading-none text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!hasStock || !selectedVariant}
          onClick={addSelectedVariant}
          title={selectedVariant ? undefined : `Elegir talle para ${productName}`}
          type="button"
        >
          +
        </button>
      </div>
    </div>
  );
}

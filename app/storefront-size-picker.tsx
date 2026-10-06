"use client";

import { X } from "lucide-react";
import Image from "next/image";
import { useId, useRef } from "react";

import { useModalBehavior } from "./use-modal-behavior";

export type SizePickerVariant = {
  id: string;
  price: number;
  size: string;
  stock: number;
};

export function StorefrontSizePicker({
  formatPrice,
  imageAlt,
  imageUrl,
  onClose,
  onSelect,
  productName,
  unitLabel,
  variants,
}: {
  formatPrice: (value: number) => string;
  imageAlt?: string | null;
  imageUrl?: string | null;
  onClose: () => void;
  onSelect: (variantId: string) => void;
  productName: string;
  unitLabel: string;
  variants: SizePickerVariant[];
}) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstInStock = variants.find((variant) => variant.stock > 0);
  const headerPrice = firstInStock?.price ?? variants[0]?.price ?? 0;
  const hasDifferentPrices = new Set(variants.map((v) => v.price)).size > 1;

  useModalBehavior({ dialogRef, initialFocusRef: closeButtonRef, onClose });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
      <button
        aria-label="Cerrar selector de talle"
        className="absolute inset-0 cursor-pointer bg-foreground/45"
        onClick={onClose}
        type="button"
      />

      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="relative max-h-[85dvh] w-full overflow-y-auto overscroll-contain rounded-t-[16px] border border-border bg-card p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-sm sm:rounded-[8px]"
        ref={dialogRef}
        role="dialog"
      >
        <div className="flex items-start gap-4">
          <div className="relative size-[72px] shrink-0 overflow-hidden rounded-[4px] bg-muted">
            {imageUrl ? (
              <Image
                alt={imageAlt ?? productName}
                className="object-cover"
                fill
                sizes="72px"
                src={imageUrl}
              />
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <h2
              className="font-serif text-xl font-semibold leading-tight text-foreground"
              id={titleId}
            >
              {productName}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              <span className="font-serif text-lg text-foreground">
                {formatPrice(headerPrice)}
              </span>{" "}
              {unitLabel}
            </p>
          </div>

          <button
            aria-label="Cerrar selector de talle"
            className="-mr-2 -mt-2 flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center text-3xl leading-none text-muted-foreground transition hover:text-foreground"
            onClick={onClose}
            ref={closeButtonRef}
            type="button"
          >
            <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
          </button>
        </div>

        <p className="mt-5 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Elegí tu talle
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {variants.map((variant) => {
            const isOutOfStock = variant.stock <= 0;

            return (
              <button
                aria-label={
                  isOutOfStock
                    ? `Talle ${variant.size || "Unico"}, sin stock`
                    : `Agregar talle ${variant.size || "Unico"} al carrito`
                }
                className={`flex min-h-11 min-w-14 touch-manipulation flex-col items-center justify-center rounded-full border px-4 py-2 text-sm transition disabled:cursor-not-allowed ${
                  isOutOfStock
                    ? "border-border bg-muted text-muted-foreground line-through opacity-50"
                    : "cursor-pointer border-input bg-card text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground"
                }`}
                disabled={isOutOfStock}
                key={variant.id}
                onClick={() => onSelect(variant.id)}
                type="button"
              >
                <span>{variant.size || "Unico"}</span>
                {hasDifferentPrices ? (
                  <span className="text-xs opacity-80">
                    {formatPrice(variant.price)}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Tocá un talle para agregarlo al carrito.
        </p>
      </div>
    </div>
  );
}

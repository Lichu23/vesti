"use client";

import { Dialog } from "@base-ui/react/dialog";
import { X } from "lucide-react";
import Image from "next/image";

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
  onOpenChange,
  onSelect,
  open,
  productName,
  unitLabel,
  variants,
}: {
  formatPrice: (value: number) => string;
  imageAlt?: string | null;
  imageUrl?: string | null;
  onOpenChange: (open: boolean) => void;
  onSelect: (variantId: string) => void;
  open: boolean;
  productName: string;
  unitLabel: string;
  variants: SizePickerVariant[];
}) {
  const firstInStock = variants.find((variant) => variant.stock > 0);
  const headerPrice = firstInStock?.price ?? variants[0]?.price ?? 0;
  const hasDifferentPrices = new Set(variants.map((v) => v.price)).size > 1;

  return (
    <Dialog.Root onOpenChange={onOpenChange} open={open}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/45 transition-opacity duration-200 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />

        <Dialog.Popup className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto overscroll-contain rounded-t-[16px] border border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl transition-[translate,scale,opacity] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-y-full data-[starting-style]:translate-y-full motion-reduce:transition-none sm:inset-0 sm:m-auto sm:h-fit sm:max-w-sm sm:rounded-[8px] sm:p-5 sm:duration-200 sm:data-[ending-style]:translate-y-0 sm:data-[starting-style]:translate-y-0 sm:data-[ending-style]:scale-95 sm:data-[starting-style]:scale-95 sm:data-[ending-style]:opacity-0 sm:data-[starting-style]:opacity-0">
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
              <Dialog.Title className="font-serif text-xl font-semibold leading-tight text-foreground">
                {productName}
              </Dialog.Title>
              <p className="mt-1 text-sm text-muted-foreground">
                <span className="font-serif text-lg text-foreground">
                  {formatPrice(headerPrice)}
                </span>{" "}
                {unitLabel}
              </p>
            </div>

            <Dialog.Close
              aria-label="Cerrar selector de talle"
              className="-mr-2 -mt-2 flex size-11 shrink-0 cursor-pointer touch-manipulation items-center justify-center text-3xl leading-none text-muted-foreground transition hover:text-foreground"
            >
              <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
            </Dialog.Close>
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
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

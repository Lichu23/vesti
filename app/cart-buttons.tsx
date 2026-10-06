"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { useSyncExternalStore } from "react";

import { useCart } from "./cart-context";

type AddToCartButtonProps = {
  disabled?: boolean;
  disabledLabel?: string;
  item?: {
    imageAlt?: string | null;
    imageUrl?: string | null;
    maxQuantity: number;
    productId: string;
    productName: string;
    unitPrice: number;
    variantColor?: string | null;
    variantId: string;
    variantSize: string;
  };
  productName: string;
};

export function CartToggleButton({ className = "" }: { className?: string }) {
  const { itemCount, openCart } = useCart();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <button
      aria-label="Abrir carrito"
      className={`relative ml-auto flex size-12 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:ml-0 ${className}`}
      onClick={openCart}
      type="button"
    >
      <ShoppingBag aria-hidden="true" className="size-6" strokeWidth={1.8} />
      {isHydrated && itemCount > 0 ? (
        <span className="absolute right-0.5 top-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {itemCount}
        </span>
      ) : null}
    </button>
  );
}

export function AddToCartButton({
  disabled = false,
  disabledLabel,
  item,
  productName,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const isDisabled = disabled || !item;

  return (
    <button
      aria-label={disabledLabel ?? `Agregar ${productName} al carrito`}
      className="flex size-11 cursor-pointer items-center justify-center rounded-full bg-primary text-2xl leading-none text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
      disabled={isDisabled}
      onClick={() => {
        if (!item) return;
        addItem(item);
      }}
      title={disabledLabel}
      type="button"
    >
      <Plus aria-hidden="true" className="size-5" strokeWidth={1.8} />
    </button>
  );
}

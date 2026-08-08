"use client";

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

export function CartToggleButton() {
  const { itemCount, openCart } = useCart();

  return (
    <button
      aria-label="Abrir carrito"
      className="relative ml-auto flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl text-foreground transition hover:border-primary md:ml-0"
      onClick={openCart}
      type="button"
    >
      <svg
        aria-hidden="true"
        className="size-6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        viewBox="0 0 24 24"
      >
        <path d="M7 8h10l-1 11H8L7 8Z" />
        <path d="M9 8a3 3 0 0 1 6 0" />
      </svg>
      {itemCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
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
      +
    </button>
  );
}

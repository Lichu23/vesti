"use client";

import { Plus, ShoppingBag } from "lucide-react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { useState, useSyncExternalStore } from "react";

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

const rollVariants = {
  center: { y: "0%" },
  enter: (direction: number) => ({ y: direction > 0 ? "100%" : "-100%" }),
  exit: (direction: number) => ({ y: direction > 0 ? "-100%" : "100%" }),
};

/** Counter that rolls vertically like an odometer when the value changes. */
function RollingNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  const [direction, setDirection] = useState(1);

  if (value !== shown) {
    setDirection(value > shown ? 1 : -1);
    setShown(value);
  }

  return (
    <span className="relative flex h-4 items-center justify-center overflow-hidden">
      {/* Invisible copy keeps the width of the current number. */}
      <span className="invisible">{value}</span>
      <AnimatePresence custom={direction} initial={false}>
        <m.span
          animate="center"
          className="absolute inset-0 flex items-center justify-center"
          custom={direction}
          exit="exit"
          initial="enter"
          key={value}
          transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
          variants={rollVariants}
        >
          {value}
        </m.span>
      </AnimatePresence>
    </span>
  );
}

export function CartToggleButton({ className = "" }: { className?: string }) {
  const { openCart, visibleItemCount } = useCart();
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  return (
    <button
      aria-label="Abrir carrito"
      data-cart-target=""
      className={`relative ml-auto flex size-11 cursor-pointer md:size-12 items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:ml-0 ${className}`}
      onClick={openCart}
      type="button"
    >
      <ShoppingBag aria-hidden="true" className="size-6" strokeWidth={1.8} />
      <AnimatePresence initial={false}>
        {isHydrated && visibleItemCount > 0 ? (
          <m.span
            animate={{ scale: 1 }}
            className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground"
            exit={{ scale: 0 }}
            initial={{ scale: 0 }}
            key="badge"
            transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
          >
            <RollingNumber value={visibleItemCount} />
          </m.span>
        ) : null}
      </AnimatePresence>
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

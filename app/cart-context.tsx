"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Minus, Plus, Trash2, X } from "lucide-react";
import {
  AnimatePresence,
  LazyMotion,
  MotionConfig,
  domAnimation,
} from "motion/react";
import * as m from "motion/react-m";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

type CartItemInput = {
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

type CartItem = CartItemInput & {
  quantity: number;
};

type CartContextValue = {
  addItem: (item: CartItemInput) => void;
  clearCart: () => void;
  closeCart: () => void;
  decreaseItem: (variantId: string) => void;
  increaseItem: (variantId: string) => void;
  isOpen: boolean;
  itemCount: number;
  items: CartItem[];
  openCart: () => void;
  removeItem: (variantId: string) => void;
  storeName: string;
  storeWhatsapp?: string | null;
  total: number;
};

type CartToast = {
  id: number;
  message: string;
};

const CART_STORAGE_KEY = "thoemia-cart";
const EASE_OUT_DRAWER = [0.32, 0.72, 0, 1] as const;
const CartContext = createContext<CartContextValue | null>(null);
const cartListeners = new Set<() => void>();
const EMPTY_CART: CartItem[] = [];
let cachedCartRaw: string | null = null;
let cachedCartItems: CartItem[] = EMPTY_CART;

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

function clampQuantity(quantity: number, maxQuantity: number) {
  return Math.min(Math.max(quantity, 1), Math.max(maxQuantity, 1));
}

function getVariantLabel(item: CartItem) {
  const parts = [`Talle: ${item.variantSize || "Unico"}`];

  if (item.variantColor) {
    parts.push(`Color: ${item.variantColor}`);
  }

  return parts.join(" / ");
}

function sanitizeWhatsappNumber(value?: string | null) {
  return value?.replace(/\D/g, "") ?? "";
}

function buildWhatsappMessage({
  items,
  storeName,
  total,
}: {
  items: CartItem[];
  storeName: string;
  total: number;
}) {
  const lines = [
    `Hola ${storeName}! Quiero hacer este pedido:`,
    "",
    ...items.flatMap((item, index) => [
      `${index + 1}. ${item.productName}`,
      `Cantidad: ${item.quantity}`,
      getVariantLabel(item),
      `Subtotal: ${formatPrice(item.unitPrice * item.quantity)}`,
      "",
    ]),
    `Total: ${formatPrice(total)}`,
    "",
    "Te paso mis datos por este chat.",
  ];

  return lines.join("\n");
}

function buildWhatsappUrl({
  items,
  storeName,
  storeWhatsapp,
  total,
}: {
  items: CartItem[];
  storeName: string;
  storeWhatsapp?: string | null;
  total: number;
}) {
  const phone = sanitizeWhatsappNumber(storeWhatsapp);

  if (!phone || items.length === 0) return null;

  const message = buildWhatsappMessage({ items, storeName, total });

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function parseStoredCart(value: string | null): CartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter(
        (item): item is CartItem =>
          typeof item === "object" &&
          item !== null &&
          typeof item.productId === "string" &&
          typeof item.productName === "string" &&
          typeof item.variantId === "string" &&
          typeof item.variantSize === "string" &&
          typeof item.unitPrice === "number" &&
          typeof item.maxQuantity === "number" &&
          typeof item.quantity === "number",
      )
      .map((item) => ({
        ...item,
        quantity: clampQuantity(item.quantity, item.maxQuantity),
      }));
  } catch {
    return [];
  }
}

function readCartSnapshot() {
  if (typeof window === "undefined") return EMPTY_CART;

  let rawCart: string | null = null;

  try {
    rawCart = window.localStorage.getItem(CART_STORAGE_KEY);
  } catch {
    return EMPTY_CART;
  }

  if (rawCart === cachedCartRaw) {
    return cachedCartItems;
  }

  cachedCartRaw = rawCart;
  cachedCartItems = parseStoredCart(rawCart);

  return cachedCartItems;
}

function writeCartSnapshot(items: CartItem[]) {
  cachedCartRaw = JSON.stringify(items);
  cachedCartItems = items;

  try {
    window.localStorage.setItem(CART_STORAGE_KEY, cachedCartRaw);
  } catch {
    // Keep the in-memory snapshot so the current interaction still works.
  }

  cartListeners.forEach((listener) => listener());
}

function subscribeCart(listener: () => void) {
  cartListeners.add(listener);

  return () => {
    cartListeners.delete(listener);
  };
}

export function CartProvider({
  children,
  storeName = "Thoemia Intimo",
  storeWhatsapp,
}: {
  children: React.ReactNode;
  storeName?: string | null;
  storeWhatsapp?: string | null;
}) {
  const items = useSyncExternalStore(
    subscribeCart,
    readCartSnapshot,
    () => EMPTY_CART,
  );
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<CartToast | null>(null);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: CartItemInput) => {
    if (item.maxQuantity <= 0) return;

    const currentItems = readCartSnapshot();
    const nextItems = (() => {
      const existing = currentItems.find(
        (cartItem) => cartItem.variantId === item.variantId,
      );

      if (!existing) {
        return [
          ...currentItems,
          {
            ...item,
            quantity: 1,
          },
        ];
      }

      return currentItems.map((cartItem) =>
        cartItem.variantId === item.variantId
          ? {
              ...cartItem,
              ...item,
              quantity: clampQuantity(
                cartItem.quantity + 1,
                item.maxQuantity,
              ),
            }
          : cartItem,
      );
    })();

    writeCartSnapshot(nextItems);
    const toastId = Date.now();

    setToast({
      id: toastId,
      message: `${item.productName} agregado al carrito.`,
    });
    window.setTimeout(() => {
      setToast((currentToast) =>
        currentToast?.id === toastId ? null : currentToast,
      );
    }, 2400);
  }, []);

  const increaseItem = useCallback((variantId: string) => {
    writeCartSnapshot(
      readCartSnapshot().map((item) =>
        item.variantId === variantId
          ? {
              ...item,
              quantity: clampQuantity(item.quantity + 1, item.maxQuantity),
          }
          : item,
      ),
    );
  }, []);

  const decreaseItem = useCallback((variantId: string) => {
    writeCartSnapshot(
      readCartSnapshot().map((item) =>
        item.variantId === variantId
          ? {
              ...item,
              quantity: clampQuantity(item.quantity - 1, item.maxQuantity),
          }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((variantId: string) => {
    writeCartSnapshot(
      readCartSnapshot().filter((item) => item.variantId !== variantId),
    );
  }, []);

  const clearCart = useCallback(() => {
    writeCartSnapshot([]);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const total = items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      addItem,
      clearCart,
      closeCart,
      decreaseItem,
      increaseItem,
      isOpen,
      itemCount,
      items,
      openCart,
      removeItem,
      storeName: storeName ?? "Thoemia Intimo",
      storeWhatsapp,
      total,
    };
  }, [
    addItem,
    clearCart,
    closeCart,
    decreaseItem,
    increaseItem,
    isOpen,
    items,
    openCart,
    removeItem,
    storeName,
    storeWhatsapp,
  ]);

  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation} strict>
        <CartContext.Provider value={value}>
          {children}
          <CartToast toast={toast} />
          <CartDrawer />
        </CartContext.Provider>
      </LazyMotion>
    </MotionConfig>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}

function CartDrawer() {
  const {
    clearCart,
    closeCart,
    decreaseItem,
    increaseItem,
    isOpen,
    items,
    removeItem,
    storeName,
    storeWhatsapp,
    total,
  } = useCart();

  const whatsappNumber = sanitizeWhatsappNumber(storeWhatsapp);
  const whatsappUrl = buildWhatsappUrl({
    items,
    storeName,
    storeWhatsapp,
    total,
  });

  return (
    <Dialog.Root
      onOpenChange={(open) => {
        if (!open) closeCart();
      }}
      open={isOpen}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-foreground/45 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none" />

        <Dialog.Popup className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[560px] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:translate-x-full data-[starting-style]:translate-x-full motion-reduce:transition-none">
          <header className="flex min-h-14 items-center justify-between border-b border-border px-4 sm:min-h-20 sm:px-6">
            <Dialog.Title className="font-serif text-2xl text-foreground sm:text-3xl">
              Mi carrito
            </Dialog.Title>
            <Dialog.Close
              aria-label="Cerrar carrito"
              className="cursor-pointer text-3xl leading-none text-muted-foreground transition hover:text-foreground"
            >
              <X aria-hidden="true" className="size-6" strokeWidth={1.8} />
            </Dialog.Close>
          </header>

          <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
            {items.length === 0 ? (
              <div className="flex min-h-80 items-center justify-center text-center text-muted-foreground">
                Tu carrito esta vacio.
              </div>
            ) : (
              <ul>
                <AnimatePresence initial={false}>
                  {items.map((item) => (
                    <m.li
                      animate={{ height: "auto", opacity: 1 }}
                      className="overflow-hidden"
                      exit={{ height: 0, opacity: 0 }}
                      initial={{ height: 0, opacity: 0 }}
                      key={item.variantId}
                      transition={{ duration: 0.25, ease: EASE_OUT_DRAWER }}
                    >
                      <div className="grid grid-cols-[80px_minmax(0,1fr)_auto] gap-3 pb-4 sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:gap-5 sm:pb-6">
                        <div className="size-[80px] overflow-hidden sm:size-[100px] rounded-[4px] bg-muted">
                          {item.imageUrl ? (
                            <div
                              aria-label={item.imageAlt ?? item.productName}
                              className="h-full w-full bg-cover bg-center"
                              role="img"
                              style={{ backgroundImage: `url(${item.imageUrl})` }}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                              Sin imagen
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 space-y-3">
                          <div>
                            <p className="font-semibold text-foreground">
                              {item.productName} x{item.quantity}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {getVariantLabel(item)}
                            </p>
                          </div>

                          <div className="inline-flex items-center overflow-hidden rounded-full border border-border bg-card">
                            <button
                              aria-label={`Restar ${item.productName}`}
                              className="size-9 cursor-pointer text-xl text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={item.quantity <= 1}
                              onClick={() => decreaseItem(item.variantId)}
                              type="button"
                            >
                              <Minus
                                aria-hidden="true"
                                className="mx-auto size-4"
                                strokeWidth={1.8}
                              />
                            </button>
                            <span className="w-10 text-center text-base text-foreground">
                              {item.quantity}
                            </span>
                            <button
                              aria-label={`Sumar ${item.productName}`}
                              className="size-9 cursor-pointer text-xl text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
                              disabled={item.quantity >= item.maxQuantity}
                              onClick={() => increaseItem(item.variantId)}
                              type="button"
                            >
                              <Plus
                                aria-hidden="true"
                                className="mx-auto size-4"
                                strokeWidth={1.8}
                              />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col items-end justify-between gap-4">
                          <button
                            aria-label={`Quitar ${item.productName}`}
                            className="cursor-pointer text-xl text-muted-foreground transition hover:text-destructive"
                            onClick={() => removeItem(item.variantId)}
                            type="button"
                          >
                            <Trash2
                              aria-hidden="true"
                              className="size-5"
                              strokeWidth={1.8}
                            />
                          </button>
                          <p className="font-serif text-xl font-semibold text-foreground">
                            {formatPrice(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </m.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
          </div>

          <footer className="border-t border-border px-4 py-4 sm:px-6 sm:py-6">
            <div className="mb-4 flex items-center justify-between text-base text-muted-foreground sm:mb-6">
              <span>Total</span>
              <span className="font-serif text-2xl text-foreground">
                {formatPrice(total)}
              </span>
            </div>
            <button
              className="w-full cursor-pointer rounded-full bg-primary px-6 py-4 text-sm font-semibold uppercase tracking-[0.06em] text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!whatsappUrl}
              onClick={() => {
                if (!whatsappUrl) return;
                window.location.href = whatsappUrl;
              }}
              type="button"
            >
              Consultar pedido
            </button>
            {!storeWhatsapp ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                WhatsApp de la tienda no configurado.
              </p>
            ) : null}
            {storeWhatsapp && !whatsappNumber ? (
              <p className="mt-3 text-center text-xs text-muted-foreground">
                WhatsApp de la tienda no es valido.
              </p>
            ) : null}
            <button
              className="mt-4 w-full cursor-pointer text-sm text-muted-foreground transition hover:text-destructive disabled:cursor-not-allowed disabled:opacity-45"
              disabled={items.length === 0}
              onClick={clearCart}
              type="button"
            >
              Vaciar carrito
            </button>
          </footer>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CartToast({ toast }: { toast: CartToast | null }) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 sm:left-auto sm:right-5 sm:translate-x-0"
    >
      <AnimatePresence>
        {toast ? (
          <m.div
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-border bg-card px-5 py-3 text-center text-sm font-medium text-foreground shadow-lg"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
            key={toast.id}
            transition={{ duration: 0.25, ease: EASE_OUT_DRAWER }}
          >
            {toast.message}
          </m.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

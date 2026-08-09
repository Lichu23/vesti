"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
    <CartContext.Provider value={value}>
      {children}
      <CartToast toast={toast} />
      <CartDrawer />
    </CartContext.Provider>
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
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
        return;
      }

      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusableElements = Array.from(
        dialogRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      );

      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocusedElement?.focus();
    };
  }, [closeCart, isOpen]);

  if (!isOpen) return null;

  const whatsappNumber = sanitizeWhatsappNumber(storeWhatsapp);
  const whatsappUrl = buildWhatsappUrl({
    items,
    storeName,
    storeWhatsapp,
    total,
  });

  return (
    <div
      className="fixed inset-0 z-50 transition"
    >
      <button
        aria-label="Cerrar carrito"
        className="absolute inset-0 cursor-pointer bg-foreground/45"
        onClick={closeCart}
        type="button"
      />

      <aside
        aria-label="Mi carrito"
        aria-modal="true"
        className="absolute right-0 top-0 flex h-full w-full max-w-[560px] flex-col border-l border-border bg-card shadow-2xl"
        ref={dialogRef}
        role="dialog"
      >
        <header className="flex min-h-20 items-center justify-between border-b border-border px-6">
          <h2 className="font-serif text-3xl text-foreground">Mi carrito</h2>
          <button
            aria-label="Cerrar carrito"
            className="cursor-pointer text-3xl leading-none text-muted-foreground transition hover:text-foreground"
            onClick={closeCart}
            ref={closeButtonRef}
            type="button"
          >
            &times;
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <div className="flex min-h-80 items-center justify-center text-center text-muted-foreground">
              Tu carrito esta vacio.
            </div>
          ) : (
            <ul className="space-y-6">
              {items.map((item) => (
                <li
                  className="grid grid-cols-[100px_minmax(0,1fr)_auto] gap-5"
                  key={item.variantId}
                >
                  <div className="size-[100px] overflow-hidden rounded-[4px] bg-muted">
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
                        -
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
                        +
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
                      <svg
                        aria-hidden="true"
                        className="size-5"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 7h16" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                        <path d="M6 7l1 13h10l1-13" />
                        <path d="M9 7V4h6v3" />
                      </svg>
                    </button>
                    <p className="font-serif text-xl font-semibold text-foreground">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="border-t border-border px-6 py-6">
          <div className="mb-6 flex items-center justify-between text-base text-muted-foreground">
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
      </aside>
    </div>
  );
}

function CartToast({ toast }: { toast: CartToast | null }) {
  if (!toast) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-full border border-border bg-card px-5 py-3 text-center text-sm font-medium text-foreground shadow-lg sm:left-auto sm:right-5 sm:translate-x-0"
      key={toast.id}
    >
      {toast.message}
    </div>
  );
}

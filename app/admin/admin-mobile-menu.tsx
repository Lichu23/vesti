"use client";

import { Dialog } from "@base-ui/react/dialog";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { type AdminSection } from "@/app/admin/admin-ui";

const adminNavItems: {
  href: string;
  label: string;
  section: AdminSection;
}[] = [
  {
    href: "/admin",
    label: "Dashboard",
    section: "dashboard",
  },
  {
    href: "/admin/products",
    label: "Productos",
    section: "products",
  },
  {
    href: "/admin/categories",
    label: "Categorias",
    section: "categories",
  },
  {
    href: "/admin/orders",
    label: "Pedidos",
    section: "orders",
  },
  {
    href: "/admin/settings",
    label: "Configuracion",
    section: "settings",
  },
];

export function AdminMobileMenu({
  activeSection,
}: {
  activeSection: AdminSection;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const scrollToTopOnCloseRef = useRef(false);

  function handleLinkClick() {
    scrollToTopOnCloseRef.current = true;
    setIsOpen(false);
  }

  // Base UI restores the old scroll position when it unlocks the page, which
  // would undo the scroll-to-top of the navigation.
  function handleOpenChangeComplete(open: boolean) {
    if (open || !scrollToTopOnCloseRef.current) return;

    scrollToTopOnCloseRef.current = false;
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="order-first lg:hidden">
      <Dialog.Root
        onOpenChange={setIsOpen}
        onOpenChangeComplete={handleOpenChangeComplete}
        open={isOpen}
      >
        <Dialog.Trigger
          aria-label="Abrir menu admin"
          className="relative z-20 flex size-12 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <Menu aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-[1000] bg-foreground/35 transition-opacity duration-300 data-[ending-style]:opacity-0 data-[starting-style]:opacity-0 motion-reduce:transition-none lg:hidden" />

          <Dialog.Popup className="fixed left-0 top-0 z-[1000] flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-6 shadow-2xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] data-[ending-style]:-translate-x-full data-[starting-style]:-translate-x-full motion-reduce:transition-none lg:hidden">
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                  Gestion
                </p>
                <Dialog.Title className="mt-2 font-serif text-3xl text-foreground">
                  Admin
                </Dialog.Title>
              </div>
              <Dialog.Close
                aria-label="Cerrar menu admin"
                className="flex size-11 cursor-pointer items-center justify-center rounded-full text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <X aria-hidden="true" className="size-5" strokeWidth={1.8} />
              </Dialog.Close>
            </div>

            <nav
              aria-label="Navegacion admin"
              className="min-h-0 flex-1 overflow-y-auto"
            >
              {adminNavItems.map((item) => (
                <Link
                  className={`flex border-b border-border py-4 text-sm transition hover:text-foreground ${
                    activeSection === item.section
                      ? "font-semibold text-foreground"
                      : "text-muted-foreground"
                  }`}
                  href={item.href}
                  key={item.href}
                  onClick={handleLinkClick}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              className="mt-8 inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary"
              href="/"
              onClick={handleLinkClick}
            >
              Ver tienda
            </Link>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useState } from "react";

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

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div className="order-first lg:hidden">
      <button
        aria-expanded={isOpen}
        aria-label="Abrir menu admin"
        className="relative z-20 flex size-12 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-foreground transition hover:border-primary"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <svg
          aria-hidden="true"
          className="size-6"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
        >
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[1000] lg:hidden">
          <button
            aria-label="Cerrar menu admin"
            className="absolute inset-0 cursor-pointer bg-foreground/35"
            onClick={() => setIsOpen(false)}
            type="button"
          />
          <aside
            aria-modal="true"
            className="absolute left-0 top-0 flex h-dvh w-[86vw] max-w-sm flex-col bg-background p-6 shadow-2xl"
            role="dialog"
          >
            <div className="mb-8 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
                  Gestion
                </p>
                <h2 className="mt-2 font-serif text-3xl text-foreground">
                  Admin
                </h2>
              </div>
              <button
                aria-label="Cerrar menu admin"
                className="flex size-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl text-foreground"
                onClick={() => setIsOpen(false)}
                type="button"
              >
                <span aria-hidden="true">x</span>
              </button>
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
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <Link
              className="mt-8 inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary"
              href="/"
              onClick={() => setIsOpen(false)}
            >
              Ver tienda
            </Link>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

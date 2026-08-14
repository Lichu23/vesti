"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import {
  BoxIcon,
  CategoryIcon,
  DashboardIcon,
  OrdersIcon,
  SettingsIcon,
  StoreIcon,
} from "@/app/admin/admin-ui";
import { AdminMobileMenu } from "@/app/admin/admin-mobile-menu";
import type { AdminSection } from "@/app/admin/admin-ui";

const adminNavItems: {
  href: string;
  label: string;
  section: AdminSection;
  icon: ReactNode;
}[] = [
  { href: "/admin", label: "Dashboard", section: "dashboard", icon: <DashboardIcon /> },
  { href: "/admin/products", label: "Productos", section: "products", icon: <BoxIcon /> },
  { href: "/admin/categories", label: "Categorias", section: "categories", icon: <CategoryIcon /> },
  { href: "/admin/orders", label: "Pedidos", section: "orders", icon: <OrdersIcon /> },
  { href: "/admin/settings", label: "Configuracion", section: "settings", icon: <SettingsIcon /> },
];

function getActiveSection(pathname: string): AdminSection {
  if (pathname.startsWith("/admin/products")) return "products";
  if (pathname.startsWith("/admin/categories")) return "categories";
  if (pathname.startsWith("/admin/orders")) return "orders";
  if (pathname.startsWith("/admin/settings")) return "settings";
  return "dashboard";
}

export function AdminNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = getActiveSection(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm lg:hidden">
        <div className="mx-auto flex min-h-24 max-w-[1720px] items-center gap-4 px-4 sm:px-10">
          <AdminMobileMenu activeSection={activeSection} />

          <Link aria-label="Ir al admin" className="shrink-0" href="/admin">
            <span className="block font-serif text-2xl leading-none text-foreground sm:text-3xl">
              Thoemia
            </span>
            <span className="mt-2 block text-[10px] uppercase tracking-[0.45em] text-foreground sm:text-xs">
              Intimo
            </span>
          </Link>

          <Link
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary sm:px-5"
            href="/"
          >
            <StoreIcon />
            <span className="hidden sm:inline">Ver tienda</span>
          </Link>
        </div>
      </header>

      <main className="min-h-screen min-w-0 overflow-x-hidden bg-background text-foreground">
        <div className="mx-auto grid max-w-[1720px] gap-6 px-4 py-6 sm:px-10 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <Link aria-label="Ir al admin" className="block" href="/admin">
              <span className="block font-serif text-3xl leading-none text-foreground">
                Thoemia
              </span>
              <span className="mt-2 block text-xs uppercase tracking-[0.45em] text-foreground">
                Intimo
              </span>
              <span className="mt-3 inline-flex rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Admin
              </span>
            </Link>

            <Link
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary"
              href="/"
            >
              <StoreIcon />
              Ver tienda
            </Link>

            <p className="mb-6 mt-12 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
              Gestion
            </p>
            <nav aria-label="Navegacion admin" className="space-y-2 text-base text-muted-foreground">
              {adminNavItems.map((item) => (
                <Link
                  className={`flex items-center gap-3 rounded-[4px] px-4 py-3 transition hover:bg-secondary hover:text-foreground ${
                    activeSection === item.section
                      ? "bg-secondary font-semibold text-foreground"
                      : ""
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          </aside>

          <section className="relative min-w-0 space-y-10 overflow-x-hidden">
            {children}
          </section>
        </div>
      </main>
    </>
  );
}

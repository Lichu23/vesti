"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { StoreIcon } from "@/app/admin/admin-ui";
import { AdminMobileMenu } from "@/app/admin/admin-mobile-menu";
import {
  adminNavItems,
  getActiveAdminSection,
} from "@/app/admin/admin-nav-items";
import { BrandLogo } from "@/app/brand-logo";

export function AdminNavigation({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const activeSection = getActiveAdminSection(pathname);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-sm lg:hidden">
        <div className="mx-auto grid min-h-14 max-w-[1720px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 sm:px-8 md:min-h-24 md:gap-6">

          <div className="justify-self-start">
            <AdminMobileMenu activeSection={activeSection} />
          </div>

          <Link aria-label="Ir al admin" className="justify-self-center" href="/admin">
            <BrandLogo />
          </Link>

          <Link
            className="inline-flex size-11 shrink-0 items-center justify-center gap-2 justify-self-end rounded-full text-sm font-medium text-foreground transition hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary md:size-auto md:border md:border-border md:bg-card md:px-5 md:py-3 md:hover:border-primary md:hover:opacity-100"
            href="/"
          >
            <StoreIcon className="size-6 md:size-5" />
            <span className="hidden md:inline">Ver tienda</span>
          </Link>
        </div>
      </header>

      <main className="min-h-[calc(100dvh-3.5rem)] min-w-0 overflow-x-hidden bg-background text-foreground md:min-h-[calc(100dvh-6rem)] lg:min-h-screen">
        <div className="mx-auto grid max-w-[1720px] gap-6 px-4 py-6 sm:px-10 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="hidden lg:block">
            <Link aria-label="Ir al admin" className="block" href="/admin">
              <BrandLogo className="w-36" variant="full" />
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

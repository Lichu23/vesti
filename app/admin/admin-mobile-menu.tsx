"use client";

import { Dialog } from "@base-ui/react/dialog";
import Link from "next/link";

import { adminNavItems } from "@/app/admin/admin-nav-items";
import { type AdminSection } from "@/app/admin/admin-ui";
import { MobileDrawer } from "@/app/mobile-drawer";

export function AdminMobileMenu({
  activeSection,
}: {
  activeSection: AdminSection;
}) {
  return (
    <MobileDrawer
      closeLabel="Cerrar menu admin"
      header={
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
            Gestion
          </p>
          <Dialog.Title className="mt-1 font-serif text-2xl text-foreground sm:text-3xl">
            Admin
          </Dialog.Title>
        </div>
      }
      hideFrom="lg"
      triggerLabel="Abrir menu admin"
    >
      {({ closeAfterNavigation }) => (
        <>
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
                onClick={closeAfterNavigation}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <Link
            className="mt-8 inline-flex items-center justify-center rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary"
            href="/"
            onClick={closeAfterNavigation}
          >
            Ver tienda
          </Link>
        </>
      )}
    </MobileDrawer>
  );
}

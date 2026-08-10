import type { ReactNode } from "react";
import Link from "next/link";

type AdminSection =
  | "categories"
  | "dashboard"
  | "orders"
  | "products"
  | "settings";

type AdminShellProps = {
  activeSection: AdminSection;
  children: ReactNode;
};

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
};

type AdminEmptyStateProps = {
  action: ReactNode;
  description: string;
  title: string;
};

export function formatAdminPrice(value: number) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  })
    .format(value)
    .replace(/\$\s*/, "$ ");
}

export function formatAdminOrderStatus(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    CONFIRMED: "Completado",
    DRAFT: "Borrador",
    REVIEWING: "Pendiente",
    WHATSAPP_SENT: "WhatsApp enviado",
  };

  return labels[status] ?? status;
}

export function BoxIcon() {
  return (
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
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="M12 12 4.4 7.7" />
      <path d="M12 12v8.5" />
      <path d="m12 12 7.6-4.3" />
    </svg>
  );
}

export function CategoryIcon() {
  return (
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
      <path d="M4 4h7v7H4z" />
      <path d="M13 4h7v7h-7z" />
      <path d="M4 13h7v7H4z" />
      <path d="M13 13h7v7h-7z" />
    </svg>
  );
}

export function WarningIcon() {
  return (
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
      <path d="m12 3 9 16H3L12 3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export function StoreIcon() {
  return (
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
      <path d="M4 10h16" />
      <path d="m5 10 1-6h12l1 6" />
      <path d="M6 10v10h12V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

export function DashboardIcon() {
  return (
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
      <path d="M4 13h7V4H4z" />
      <path d="M13 20h7V4h-7z" />
      <path d="M4 20h7v-5H4z" />
    </svg>
  );
}

export function OrdersIcon() {
  return (
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
      <path d="M7 3h10l2 4v14H5V7z" />
      <path d="M7 7h10" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
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
      <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.36a1.7 1.7 0 0 0-1 .58V20a2 2 0 1 1-4 0v-.06a1.7 1.7 0 0 0-1-.58 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.64 15a1.7 1.7 0 0 0-.58-1H4a2 2 0 1 1 0-4h.06a1.7 1.7 0 0 0 .58-1 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.64a1.7 1.7 0 0 0 1-.58V4a2 2 0 1 1 4 0v.06a1.7 1.7 0 0 0 1 .58 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.36 9c.2.37.4.7.58 1H20a2 2 0 1 1 0 4h-.06c-.18.3-.38.63-.54 1Z" />
    </svg>
  );
}

export function SearchIcon() {
  return (
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
      <path d="m21 21-4.3-4.3" />
      <circle cx="11" cy="11" r="7" />
    </svg>
  );
}

export function EditIcon() {
  return (
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
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
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
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M6 6l1 15h10l1-15" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <article className="rounded-[4px] border border-border bg-card p-6">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
        {icon}
      </div>
      <p className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 font-serif text-3xl leading-none text-foreground">
        {value}
      </p>
    </article>
  );
}

function AdminNavLink({
  active,
  children,
  href,
  icon,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
  icon: ReactNode;
}) {
  return (
    <Link
      className={`flex cursor-pointer items-center gap-3 rounded-[4px] px-4 py-3 transition hover:bg-secondary hover:text-foreground ${
        active ? "bg-secondary font-semibold text-foreground" : ""
      }`}
      href={href}
    >
      {icon}
      {children}
    </Link>
  );
}

export function AdminShell({ activeSection, children }: AdminShellProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex min-h-24 max-w-[1720px] items-center justify-between gap-6 px-6 sm:px-10">
          <Link aria-label="Ir al admin" className="cursor-pointer" href="/admin">
            <div className="flex items-center gap-5">
              <div>
                <span className="block font-serif text-3xl leading-none">
                  Thoemia
                </span>
                <span className="mt-2 block text-xs uppercase tracking-[0.45em]">
                  Intimo
                </span>
              </div>
              <span className="rounded-full border border-border bg-card px-4 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Admin
              </span>
            </div>
          </Link>

          <Link
            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-primary"
            href="/"
          >
            <StoreIcon />
            Ver tienda
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1720px] gap-10 px-6 py-10 sm:px-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.36em] text-muted-foreground">
            Gestion
          </p>
          <nav className="space-y-2 text-base text-muted-foreground">
            <AdminNavLink
              active={activeSection === "dashboard"}
              href="/admin"
              icon={<DashboardIcon />}
            >
              Dashboard
            </AdminNavLink>
            <AdminNavLink
              active={activeSection === "products"}
              href="/admin/products"
              icon={<BoxIcon />}
            >
              Productos
            </AdminNavLink>
            <AdminNavLink
              active={activeSection === "categories"}
              href="/admin/categories"
              icon={<CategoryIcon />}
            >
              Categorias
            </AdminNavLink>
            <AdminNavLink
              active={activeSection === "orders"}
              href="/admin/orders"
              icon={<OrdersIcon />}
            >
              Pedidos
            </AdminNavLink>
            <AdminNavLink
              active={activeSection === "settings"}
              href="/admin/settings"
              icon={<SettingsIcon />}
            >
              Configuracion
            </AdminNavLink>
          </nav>
        </aside>

        <nav
          aria-label="Navegacion admin"
          className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:hidden"
        >
          <AdminNavLink
            active={activeSection === "dashboard"}
            href="/admin"
            icon={<DashboardIcon />}
          >
            Dashboard
          </AdminNavLink>
          <AdminNavLink
            active={activeSection === "products"}
            href="/admin/products"
            icon={<BoxIcon />}
          >
            Productos
          </AdminNavLink>
          <AdminNavLink
            active={activeSection === "categories"}
            href="/admin/categories"
            icon={<CategoryIcon />}
          >
            Categorias
          </AdminNavLink>
          <AdminNavLink
            active={activeSection === "orders"}
            href="/admin/orders"
            icon={<OrdersIcon />}
          >
            Pedidos
          </AdminNavLink>
          <AdminNavLink
            active={activeSection === "settings"}
            href="/admin/settings"
            icon={<SettingsIcon />}
          >
            Configuracion
          </AdminNavLink>
        </nav>

        <section className="min-w-0 space-y-10">{children}</section>
      </div>
    </main>
  );
}

export function InventoryStats({
  categoryCount,
  outOfStockCount,
  productCount,
  stockValue,
}: {
  categoryCount: number;
  outOfStockCount: number;
  productCount: number;
  stockValue: number;
}) {
  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard icon={<BoxIcon />} label="Productos" value={String(productCount)} />
      <StatCard
        icon={<CategoryIcon />}
        label="Categorias"
        value={String(categoryCount)}
      />
      <StatCard
        icon={<WarningIcon />}
        label="Sin stock"
        value={String(outOfStockCount)}
      />
      <StatCard
        icon={<BoxIcon />}
        label="Valor en stock"
        value={formatAdminPrice(stockValue)}
      />
    </section>
  );
}

export function AdminEmptyState({
  action,
  description,
  title,
}: AdminEmptyStateProps) {
  return (
    <div className="grid justify-items-center gap-4 rounded-[4px] border border-border bg-card p-8 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-foreground">
        <BoxIcon />
      </div>
      <div className="space-y-1">
        <h2 className="font-serif text-3xl text-foreground">{title}</h2>
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function AdminPagination({
  basePath,
  currentPage,
  searchParams = {},
  totalPages,
}: {
  basePath: string;
  currentPage: number;
  searchParams?: Record<string, string | undefined>;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }

  function hrefForPage(page: number) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(searchParams)) {
      if (value) {
        params.set(key, value);
      }
    }

    if (page > 1) {
      params.set("pagina", String(page));
    } else {
      params.delete("pagina");
    }

    const query = params.toString();

    return query ? `${basePath}?${query}` : basePath;
  }

  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <nav
      aria-label="Paginacion"
      className="flex flex-wrap items-center justify-between gap-3 rounded-[4px] border border-border bg-card px-5 py-4 text-sm"
    >
      <p className="text-muted-foreground">
        Pagina {currentPage} de {totalPages}
      </p>
      <div className="flex items-center gap-2">
        {currentPage > 1 ? (
          <Link
            className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 font-medium transition hover:border-primary"
            href={hrefForPage(previousPage)}
          >
            Anterior
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center rounded-full border border-border px-4 py-2 font-medium text-muted-foreground opacity-50">
            Anterior
          </span>
        )}

        {currentPage < totalPages ? (
          <Link
            className="inline-flex cursor-pointer items-center rounded-full border border-border px-4 py-2 font-medium transition hover:border-primary"
            href={hrefForPage(nextPage)}
          >
            Siguiente
          </Link>
        ) : (
          <span className="inline-flex cursor-not-allowed items-center rounded-full border border-border px-4 py-2 font-medium text-muted-foreground opacity-50">
            Siguiente
          </span>
        )}
      </div>
    </nav>
  );
}

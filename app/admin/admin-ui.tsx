import type { ReactNode } from "react";
import {
  LayoutDashboard,
  LayoutGrid,
  Package,
  Pencil,
  ReceiptText,
  Search,
  Settings,
  Store,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";


export type AdminSection =
  | "categories"
  | "dashboard"
  | "orders"
  | "products"
  | "settings";

type AdminShellProps = {
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
  return <Package aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function CategoryIcon() {
  return <LayoutGrid aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function WarningIcon() {
  return <TriangleAlert aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function StoreIcon({ className = "size-5" }: { className?: string }) {
  return <Store aria-hidden="true" className={className} strokeWidth={1.8} />;
}

export function DashboardIcon() {
  return <LayoutDashboard aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function OrdersIcon() {
  return <ReceiptText aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function SettingsIcon() {
  return <Settings aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function SearchIcon() {
  return <Search aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function EditIcon() {
  return <Pencil aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function TrashIcon() {
  return <Trash2 aria-hidden="true" className="size-5" strokeWidth={1.8} />;
}

export function StatCard({ icon, label, value }: StatCardProps) {
  return (
    <article className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
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

export function AdminShell({ children }: AdminShellProps) {
  return (
    <section className="relative min-w-0 space-y-10 overflow-x-hidden">{children}</section>
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
    <section className="grid grid-cols-2 gap-4 sm:gap-5 xl:grid-cols-4">
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

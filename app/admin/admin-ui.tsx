import type { ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  CircleDollarSign,
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
  Wallet,
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
  // Full Tailwind class for the vertical gap between sections.
  spacing?: string;
};

type StatCardProps = {
  className?: string;
  detail?: ReactNode;
  icon: ReactNode;
  isAlert?: boolean;
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

export function SalesIcon() {
  return (
    <CircleDollarSign aria-hidden="true" className="size-5" strokeWidth={1.8} />
  );
}

export function WalletIcon() {
  return <Wallet aria-hidden="true" className="size-5" strokeWidth={1.8} />;
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

// Minimal on mobile (number over label, no box or icon); card from `sm` up.
export function StatCard({
  className = "",
  detail,
  icon,
  isAlert = false,
  label,
  value,
}: StatCardProps) {
  return (
    <article
      className={`flex min-w-0 flex-col sm:rounded-[4px] sm:border sm:border-border sm:bg-card sm:p-6 ${className}`}
    >
      <div className="mb-4 hidden size-11 items-center justify-center rounded-full bg-secondary text-foreground sm:flex">
        {icon}
      </div>
      <p
        className={`order-1 whitespace-nowrap font-serif text-2xl leading-none [font-variant-numeric:lining-nums_tabular-nums] sm:order-2 sm:mt-3 sm:text-3xl ${
          isAlert ? "text-destructive" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="order-2 mt-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:order-1 sm:mt-0 sm:text-sm">
        {label}
      </p>
      {detail ? (
        <p className="order-3 mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          {detail}
        </p>
      ) : null}
    </article>
  );
}

export function AdminShell({
  children,
  spacing = "space-y-10",
}: AdminShellProps) {
  return (
    <section className={`relative min-w-0 overflow-x-hidden ${spacing}`}>
      {children}
    </section>
  );
}

function TrendDetail({
  change,
  unit = "",
}: {
  change: number | null;
  unit?: string;
}) {
  if (change === null) return null;

  if (change === 0) return <>Igual que los 7 dias previos</>;

  const Icon = change > 0 ? ArrowUp : ArrowDown;

  return (
    <span
      className={`inline-flex items-center gap-1 [font-variant-numeric:lining-nums] ${
        change > 0 ? "text-primary" : "text-muted-foreground"
      }`}
    >
      <Icon aria-hidden="true" className="size-3" strokeWidth={2} />
      {Math.abs(change)}
      {unit} vs 7 dias previos
    </span>
  );
}

// Sales are CONFIRMED orders; the trend compares with the 7 days before.
export function SalesStats({
  orders,
  previousOrders,
  previousRevenue,
  revenue,
}: {
  orders: number;
  previousOrders: number;
  previousRevenue: number;
  revenue: number;
}) {
  const revenueChange =
    previousRevenue > 0
      ? Math.round(((revenue - previousRevenue) / previousRevenue) * 100)
      : null;
  const ordersChange = previousOrders > 0 ? orders - previousOrders : null;

  return (
    <section className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border py-4 sm:gap-5 sm:border-0 sm:py-0">
      <StatCard
        detail={<TrendDetail change={revenueChange} unit="%" />}
        icon={<SalesIcon />}
        label="Ventas · 7 dias"
        value={formatAdminPrice(revenue)}
      />
      <StatCard
        detail={<TrendDetail change={ordersChange} />}
        icon={<OrdersIcon />}
        label="Pedidos · 7 dias"
        value={String(orders)}
      />
    </section>
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
    <section className="grid grid-cols-2 gap-x-4 gap-y-5 border-y border-border py-4 sm:gap-5 sm:border-0 sm:py-0 xl:grid-cols-4">
      <StatCard icon={<BoxIcon />} label="Productos" value={String(productCount)} />
      <StatCard
        className="max-sm:hidden"
        icon={<CategoryIcon />}
        label="Categorias"
        value={String(categoryCount)}
      />
      <StatCard
        className="max-sm:hidden"
        icon={<WarningIcon />}
        isAlert={outOfStockCount > 0}
        label="Sin stock"
        value={String(outOfStockCount)}
      />
      <StatCard
        icon={<WalletIcon />}
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

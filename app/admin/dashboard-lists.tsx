import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

// Minimal on mobile (no box); card from `sm` up, like the stat cards.
const sectionClassName =
  "min-w-0 sm:rounded-[4px] sm:border sm:border-border sm:bg-card sm:p-6";
const rowClassName =
  "flex min-h-12 items-center justify-between gap-3 border-b border-border py-2 text-sm";
const numberClassName =
  "shrink-0 [font-variant-numeric:lining-nums_tabular-nums]";

type LowStockItem = {
  id: string;
  label: string;
  name: string;
  stock: number;
};

type BestSeller = {
  id: string;
  name: string;
  units: number;
};

function ListHeader({ aside, title }: { aside?: ReactNode; title: string }) {
  return (
    <div className="mb-1 flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {title}
      </h2>
      {aside}
    </div>
  );
}

function LowStockList({
  count,
  items,
}: {
  count: number;
  items: LowStockItem[];
}) {
  return (
    <section className={sectionClassName}>
      <ListHeader
        aside={
          <span className={`${numberClassName} text-sm text-foreground`}>
            {count}
          </span>
        }
        title="Stock bajo"
      />
      <ul>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className={`${rowClassName} cursor-pointer transition hover:text-primary`}
              href={`/admin/products?${new URLSearchParams({ buscar: item.name })}`}
            >
              <span className="min-w-0">
                <span className="block truncate text-foreground">
                  {item.name}
                </span>
                {item.label ? (
                  <span className="block truncate text-xs text-muted-foreground">
                    {item.label}
                  </span>
                ) : null}
              </span>
              <span className="flex shrink-0 items-center gap-1">
                <span
                  className={`${numberClassName} font-semibold ${
                    item.stock === 0 ? "text-destructive" : "text-foreground"
                  }`}
                >
                  {item.stock === 0 ? "Agotado" : `${item.stock} u`}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-5 text-muted-foreground"
                  strokeWidth={1.8}
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
      {count > items.length ? (
        <Link
          className="flex min-h-12 cursor-pointer items-center justify-between gap-3 text-sm text-foreground transition hover:text-primary"
          href="/admin/products?stock=bajo"
        >
          Ver todos
          <ChevronRight
            aria-hidden="true"
            className="size-5 shrink-0 text-muted-foreground"
            strokeWidth={1.8}
          />
        </Link>
      ) : null}
    </section>
  );
}

function BestSellersList({ items }: { items: BestSeller[] }) {
  return (
    <section className={sectionClassName}>
      <ListHeader title="Mas vendidos · 30 dias" />
      <ol>
        {items.map((item, index) => (
          <li className={rowClassName} key={item.id}>
            <span className="flex min-w-0 items-baseline gap-3">
              <span
                className={`${numberClassName} w-4 text-xs text-muted-foreground`}
              >
                {index + 1}
              </span>
              <span className="truncate text-foreground">{item.name}</span>
            </span>
            <span className={`${numberClassName} font-semibold text-foreground`}>
              {item.units} u
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

// Hides itself when there is nothing to show, so a new store has no empty boxes.
export function DashboardInsights({
  bestSellers,
  lowStock,
}: {
  bestSellers: BestSeller[];
  lowStock: { count: number; items: LowStockItem[] };
}) {
  if (lowStock.count === 0 && bestSellers.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {lowStock.count > 0 ? (
        <LowStockList count={lowStock.count} items={lowStock.items} />
      ) : null}
      {bestSellers.length > 0 ? <BestSellersList items={bestSellers} /> : null}
    </div>
  );
}

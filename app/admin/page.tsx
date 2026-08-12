import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import {
  AdminShell,
  BoxIcon,
  formatAdminOrderStatus,
  formatAdminPrice,
  InventoryStats,
  OrdersIcon,
  SettingsIcon,
} from "@/app/admin/admin-ui";
import { OrderStatus } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function getStockValue(
  variants: {
    price: { toString(): string } | null;
    product: { basePrice: { toString(): string } };
    stock: number;
  }[],
) {
  return variants.reduce(
    (total, variant) =>
      total +
      variant.stock *
        Number(variant.price?.toString() ?? variant.product.basePrice.toString()),
    0,
  );
}

function DashboardAction({
  description,
  href,
  icon,
  label,
  title,
}: {
  description: string;
  href: string;
  icon: ReactNode;
  label: string;
  title: string;
}) {
  return (
    <article className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
        {icon}
      </div>
      <h2 className="font-serif text-3xl leading-tight text-foreground">
        {title}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Link
        className="mt-5 inline-flex cursor-pointer rounded-full border border-border px-5 py-3 text-sm font-semibold transition hover:border-primary"
        href={href}
      >
        {label}
      </Link>
    </article>
  );
}

export default async function AdminDashboardPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;

  if (!storeId) {
    return null;
  }

  const [
    store,
    categoryCount,
    variants,
    productCount,
    outOfStockCount,
    reviewingOrdersCount,
    confirmedOrdersCount,
    recentOrders,
  ] = await Promise.all([
    prisma.store.findUnique({
      select: {
        name: true,
        whatsapp: true,
      },
      where: {
        id: storeId,
      },
    }),
    prisma.category.count({
      where: {
        storeId,
      },
    }),
    prisma.productVariant.findMany({
      select: {
        price: true,
        stock: true,
        product: {
          select: {
            basePrice: true,
          },
        },
      },
      where: {
        isActive: true,
        product: {
          isActive: true,
        },
        storeId,
      },
    }),
    prisma.product.count({
      where: { storeId, isActive: true },
    }),
    prisma.product.count({
      where: {
        isActive: true,
        storeId,
        variants: {
          none: {
            isActive: true,
            stock: { gt: 0 },
          },
        },
      },
    }),
    prisma.order.count({
      where: {
        status: OrderStatus.REVIEWING,
        storeId,
      },
    }),
    prisma.order.count({
      where: {
        status: OrderStatus.CONFIRMED,
        storeId,
      },
    }),
    prisma.order.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        createdAt: true,
        customerName: true,
        id: true,
        status: true,
        total: true,
      },
      take: 5,
      where: {
        storeId,
      },
    }),
  ]);
  const stockValue = getStockValue(variants);

  if (!store) {
    notFound();
  }

  return (
    <AdminShell activeSection="dashboard">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.36em] text-muted-foreground">
          Dashboard
        </p>
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
          Resumen de {store.name}
        </h1>
        <p className="text-lg text-muted-foreground">
          Control rapido del catalogo, stock y pedidos pendientes.
        </p>
      </div>

      <InventoryStats
        categoryCount={categoryCount}
        outOfStockCount={outOfStockCount}
        productCount={productCount}
        stockValue={stockValue}
      />

      <section className="grid gap-5 xl:grid-cols-3">
        <DashboardAction
          description="Carga productos, imagenes, talles, colores y ajustes de stock."
          href="/admin/products"
          icon={<BoxIcon />}
          label="Gestionar productos"
          title="Inventario"
        />
        <DashboardAction
          description={
            store.whatsapp
              ? `WhatsApp activo: ${store.whatsapp}`
              : "Configura el WhatsApp antes de entregar la tienda."
          }
          href="/admin/settings"
          icon={<SettingsIcon />}
          label="Configurar tienda"
          title="Configuracion"
        />
      </section>

      <section>
        <div className="rounded-[4px] border border-border bg-card p-5 sm:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <OrdersIcon />
              <div>
                <h2 className="font-serif text-3xl text-foreground">
                  Pedidos recientes
                </h2>
                <p className="text-sm text-muted-foreground">
                  {reviewingOrdersCount} pendientes · {confirmedOrdersCount} confirmados
                </p>
              </div>
            </div>
            <Link
              className="inline-flex cursor-pointer rounded-full border border-border px-5 py-3 text-sm font-semibold transition hover:border-primary"
              href="/admin/orders"
            >
              Gestionar pedidos
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Todavia no hay pedidos.
            </p>
          ) : (
            <div className="grid gap-3">
              {recentOrders.map((order) => (
                <Link
                  className="grid gap-2 rounded-[4px] border border-border bg-background p-4 transition hover:border-primary sm:grid-cols-[minmax(0,1fr)_auto]"
                  href="/admin/orders"
                  key={order.id}
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {order.customerName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt.toLocaleString("es-AR")} -{" "}
                      {formatAdminOrderStatus(order.status)}
                    </p>
                  </div>
                  <p className="font-serif text-2xl text-foreground">
                    {formatAdminPrice(Number(order.total))}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>

      </section>
    </AdminShell>
  );
}

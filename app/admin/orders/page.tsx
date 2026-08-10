import {
  AdminEmptyState,
  AdminShell,
  formatAdminOrderStatus,
  formatAdminPrice,
  OrdersIcon,
} from "@/app/admin/admin-ui";
import {
  confirmOrder,
  createManualOrder,
  updateManualOrder,
} from "@/app/admin/orders/actions";
import { ConfirmOrderForm } from "@/app/admin/orders/confirm-order-form";
import { EditOrderModal } from "@/app/admin/orders/edit-order-modal";
import { OrderForm } from "@/app/admin/orders/order-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function getStatusClassName(status: string) {
  if (status === "CONFIRMED") {
    return "bg-green-100 text-green-800";
  }

  if (status === "REVIEWING") {
    return "bg-yellow-100 text-yellow-800";
  }

  return "bg-zinc-100 text-zinc-700";
}

export default async function AdminOrdersPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;

  if (!storeId) {
    return null;
  }

  const [variants, orders] = await Promise.all([
    prisma.productVariant.findMany({
      orderBy: [{ product: { name: "asc" } }, { size: "asc" }, { color: "asc" }],
      select: {
        color: true,
        id: true,
        price: true,
        product: {
          select: {
            basePrice: true,
            name: true,
          },
        },
        size: true,
        stock: true,
      },
      where: {
        isActive: true,
        product: {
          isActive: true,
        },
        storeId,
      },
    }),
    prisma.order.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        createdAt: true,
        customerName: true,
        customerPhone: true,
        id: true,
        items: {
          orderBy: [{ productName: "asc" }],
          select: {
            id: true,
            productName: true,
            quantity: true,
            subtotal: true,
            unitPrice: true,
            variantId: true,
            variantLabel: true,
          },
        },
        notes: true,
        status: true,
        total: true,
      },
      take: 20,
      where: {
        storeId,
      },
    }),
  ]);

  const variantOptions = variants.map((variant) => {
    const price = variant.price ?? variant.product.basePrice;
    const variantParts = [`Talle: ${variant.size || "Unico"}`];

    if (variant.color) {
      variantParts.push(`Color: ${variant.color}`);
    }

    return {
      id: variant.id,
      label: `${variant.product.name} (${variantParts.join(" / ")}) - ${formatAdminPrice(Number(price))}`,
      stock: variant.stock,
    };
  });

  return (
    <AdminShell activeSection="orders">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.36em] text-muted-foreground">
          Pedidos
        </p>
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
          Pedidos
        </h1>
        <p className="text-lg text-muted-foreground">
          Crea pedidos manuales desde conversaciones de WhatsApp. Confirma el
          pedido para descontar stock.
        </p>
      </header>

      <section className="grid gap-4 rounded-[4px] border border-border bg-card p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <OrdersIcon />
          <h2 className="font-serif text-3xl text-foreground">
            Nuevo pedido manual
          </h2>
        </div>
        <OrderForm
          action={createManualOrder}
          buttonLabel="Crear pedido"
          variants={variantOptions}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="font-serif text-3xl text-foreground">
          Pedidos recientes
        </h2>
        {orders.length === 0 ? (
          <AdminEmptyState
            action={null}
            description="Cuando crees pedidos desde WhatsApp van a aparecer aca."
            title="Todavia no hay pedidos"
          />
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article
                className="grid gap-4 rounded-[4px] border border-border bg-card p-5"
                key={order.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{order.customerName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Tel: {order.customerPhone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.createdAt.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="w-full text-left sm:w-auto sm:text-right">
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${getStatusClassName(
                        order.status,
                      )}`}
                    >
                      {formatAdminOrderStatus(order.status)}
                    </span>
                    <p className="mt-2 font-serif text-2xl">
                      {formatAdminPrice(Number(order.total))}
                    </p>
                    {order.status === "REVIEWING" ? (
                      <div className="mt-3 grid gap-2 sm:flex sm:flex-wrap sm:justify-end">
                        <EditOrderModal
                          action={updateManualOrder}
                          order={{
                            customerName: order.customerName,
                            customerPhone: order.customerPhone,
                            id: order.id,
                            items: order.items.map((item) => ({
                              id: item.id,
                              quantity: item.quantity,
                              variantId: item.variantId,
                            })),
                            notes: order.notes,
                          }}
                          variants={variantOptions}
                        />
                        <ConfirmOrderForm
                          action={confirmOrder}
                          orderId={order.id}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>

                <ul className="grid gap-2">
                  {order.items.map((item) => (
                    <li
                      className="grid gap-3 rounded-[4px] bg-background p-3 text-sm sm:flex sm:flex-wrap sm:items-center sm:justify-between"
                      key={item.id}
                    >
                      <div>
                        <p className="font-medium">
                          {item.productName} x{item.quantity}
                        </p>
                        <p className="text-muted-foreground">
                          {item.variantLabel}
                        </p>
                        <p className="text-muted-foreground">
                          Unitario: {formatAdminPrice(Number(item.unitPrice))}
                        </p>
                      </div>
                      <p className="font-medium sm:text-right">
                        {formatAdminPrice(Number(item.subtotal))}
                      </p>
                    </li>
                  ))}
                </ul>

                {order.notes ? (
                  <p className="rounded-[4px] bg-background p-3 text-sm text-muted-foreground">
                    {order.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </AdminShell>
  );
}

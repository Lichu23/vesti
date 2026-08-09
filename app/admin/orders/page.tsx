import { createManualOrder } from "@/app/admin/orders/actions";
import { OrderForm } from "@/app/admin/orders/order-form";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

function formatPrice(value: { toString(): string }) {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
    style: "currency",
  })
    .format(Number(value.toString()))
    .replace(/\$\s*/, "$ ");
}

function formatStatus(status: string) {
  const labels: Record<string, string> = {
    CANCELLED: "Cancelado",
    CONFIRMED: "Completado",
    DRAFT: "Borrador",
    REVIEWING: "Pendiente",
    WHATSAPP_SENT: "WhatsApp enviado",
  };

  return labels[status] ?? status;
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
      label: `${variant.product.name} (${variantParts.join(" / ")}) - ${formatPrice(price)}`,
      stock: variant.stock,
    };
  });

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">Phase 5 Orders</p>
        <h1 className="text-3xl font-semibold">Pedidos</h1>
        <p className="text-sm text-zinc-600">
          Crea pedidos manuales desde conversaciones de WhatsApp. Confirmar y
          descontar stock se hara en un paso separado.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Nuevo pedido manual</h2>
        <OrderForm action={createManualOrder} variants={variantOptions} />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Pedidos recientes</h2>
        {orders.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            Todavia no hay pedidos.
          </p>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <article className="grid gap-4 rounded-xl border p-4" key={order.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{order.customerName}</h3>
                    <p className="text-sm text-zinc-600">
                      Tel: {order.customerPhone}
                    </p>
                    <p className="text-sm text-zinc-500">
                      {order.createdAt.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                      {formatStatus(order.status)}
                    </span>
                    <p className="mt-2 font-serif text-2xl">
                      {formatPrice(order.total)}
                    </p>
                  </div>
                </div>

                <ul className="grid gap-2">
                  {order.items.map((item) => (
                    <li
                      className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-zinc-50 p-3 text-sm"
                      key={item.id}
                    >
                      <div>
                        <p className="font-medium">
                          {item.productName} x{item.quantity}
                        </p>
                        <p className="text-zinc-600">{item.variantLabel}</p>
                        <p className="text-zinc-500">
                          Unitario: {formatPrice(item.unitPrice)}
                        </p>
                      </div>
                      <p className="font-medium">{formatPrice(item.subtotal)}</p>
                    </li>
                  ))}
                </ul>

                {order.notes ? (
                  <p className="rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600">
                    {order.notes}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

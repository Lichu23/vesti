import { OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export const LOW_STOCK_THRESHOLD = 4;

const DAY_MS = 24 * 60 * 60 * 1000;
const SALES_PERIOD_DAYS = 7;
const BEST_SELLERS_PERIOD_DAYS = 30;
const LIST_SIZE = 3;

// A sale is an order with status CONFIRMED ("Completado"), dated by confirmedAt.
async function getSales(storeId: string) {
  const now = Date.now();
  const periodStart = new Date(now - SALES_PERIOD_DAYS * DAY_MS);
  const previousStart = new Date(now - 2 * SALES_PERIOD_DAYS * DAY_MS);
  const where = { status: OrderStatus.CONFIRMED, storeId };

  const [current, previous] = await Promise.all([
    prisma.order.aggregate({
      _count: true,
      _sum: { total: true },
      where: { ...where, confirmedAt: { gte: periodStart } },
    }),
    prisma.order.aggregate({
      _count: true,
      _sum: { total: true },
      where: { ...where, confirmedAt: { gte: previousStart, lt: periodStart } },
    }),
  ]);

  return {
    orders: current._count,
    previousOrders: previous._count,
    previousRevenue: Number(previous._sum.total ?? 0),
    revenue: Number(current._sum.total ?? 0),
  };
}

// Stock is tracked per variant (size and color), so low stock is too.
async function getLowStock(storeId: string) {
  const where = {
    isActive: true,
    product: { isActive: true },
    stock: { lte: LOW_STOCK_THRESHOLD },
    storeId,
  };

  const [count, variants] = await Promise.all([
    prisma.productVariant.count({ where }),
    prisma.productVariant.findMany({
      orderBy: [{ stock: "asc" }, { updatedAt: "desc" }],
      select: {
        color: true,
        id: true,
        product: { select: { name: true } },
        size: true,
        stock: true,
      },
      take: LIST_SIZE,
      where,
    }),
  ]);

  return {
    count,
    items: variants.map((variant) => ({
      id: variant.id,
      label: [variant.size, variant.color].filter(Boolean).join(" · "),
      name: variant.product.name,
      stock: variant.stock,
    })),
  };
}

async function getBestSellers(storeId: string) {
  const since = new Date(Date.now() - BEST_SELLERS_PERIOD_DAYS * DAY_MS);

  const rows = await prisma.orderItem.groupBy({
    by: ["productId", "productName"],
    orderBy: { _sum: { quantity: "desc" } },
    take: LIST_SIZE,
    _sum: { quantity: true },
    where: {
      order: {
        confirmedAt: { gte: since },
        status: OrderStatus.CONFIRMED,
      },
      storeId,
    },
  });

  return rows.map((row) => ({
    id: row.productId,
    name: row.productName,
    units: row._sum.quantity ?? 0,
  }));
}

export async function getDashboardInsights(storeId: string) {
  const [sales, lowStock, bestSellers] = await Promise.all([
    getSales(storeId),
    getLowStock(storeId),
    getBestSellers(storeId),
  ]);

  return { bestSellers, lowStock, sales };
}

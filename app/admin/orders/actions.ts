"use server";

import { revalidatePath } from "next/cache";

import {
  InventoryMovementType,
  OrderStatus,
  Prisma,
  type OrderStatus as OrderStatusValue,
} from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type OrderFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

export type ConfirmOrderState = OrderFormState;
export type UpdateOrderState = OrderFormState;

type OrderItemPayload = {
  quantity: number;
  variantId: string;
};

type OrderPayload = {
  customerName: string;
  customerPhone: string;
  items: OrderItemPayload[];
  notes: string | null;
  status: Extract<OrderStatusValue, "REVIEWING">;
};

type OrderFormData =
  | {
      data: OrderPayload;
    }
  | {
      error: string;
    };

const allowedCreateStatuses = new Set<OrderPayload["status"]>(["REVIEWING"]);

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function readOrderForm(formData: FormData): OrderFormData {
  const customerName = String(formData.get("customerName") ?? "").trim();
  const customerPhone = String(formData.get("customerPhone") ?? "").trim();
  const notes = optionalText(formData.get("notes"));
  const status = String(formData.get("status") ?? "");
  const variantIds = formData.getAll("variantId").map((value) =>
    String(value ?? "").trim(),
  );
  const quantities = formData.getAll("quantity").map((value) =>
    String(value ?? "").trim(),
  );

  if (!customerName) {
    return { error: "El nombre del cliente es obligatorio." };
  }

  if (!customerPhone) {
    return { error: "El telefono del cliente es obligatorio." };
  }

  if (!allowedCreateStatuses.has(status as OrderPayload["status"])) {
    return { error: "El estado del pedido no es valido." };
  }

  const items: OrderItemPayload[] = [];

  for (let index = 0; index < variantIds.length; index += 1) {
    const variantId = variantIds[index];
    const quantityValue = quantities[index] ?? "";

    if (!variantId && !quantityValue) {
      continue;
    }

    if (!variantId) {
      return { error: "Cada item del pedido necesita una variante de producto." };
    }

    if (!/^[1-9]\d*$/.test(quantityValue)) {
      return { error: "La cantidad de cada item debe ser positiva." };
    }

    items.push({
      quantity: Number.parseInt(quantityValue, 10),
      variantId,
    });
  }

  if (items.length === 0) {
    return { error: "Agrega al menos un item al pedido." };
  }

  const duplicateVariantIds = new Set<string>();

  for (const item of items) {
    if (duplicateVariantIds.has(item.variantId)) {
      return { error: "No repitas la misma variante en un pedido." };
    }

    duplicateVariantIds.add(item.variantId);
  }

  return {
    data: {
      customerName,
      customerPhone,
      items,
      notes,
      status: status as OrderPayload["status"],
    },
  };
}

function getVariantLabel(variant: { color: string | null; size: string }) {
  const parts = [`Talle: ${variant.size || "Unico"}`];

  if (variant.color) {
    parts.push(`Color: ${variant.color}`);
  }

  return parts.join(" / ");
}

function orderError(error: unknown): OrderFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return {
      message: "El item seleccionado no es valido.",
      status: "error",
    };
  }

  throw error;
}

export async function createManualOrder(
  _previousState: OrderFormState,
  formData: FormData,
): Promise<OrderFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readOrderForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const variantIds = parsed.data.items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    select: {
      color: true,
      id: true,
      price: true,
      product: {
        select: {
          basePrice: true,
          id: true,
          name: true,
        },
      },
      size: true,
      stock: true,
    },
    where: {
      id: {
        in: variantIds,
      },
      isActive: true,
      product: {
        isActive: true,
      },
      storeId,
    },
  });

  if (variants.length !== variantIds.length) {
    return {
      message: "Una o mas variantes seleccionadas no estan disponibles.",
      status: "error",
    };
  }

  const variantsById = new Map(
    variants.map((variant) => [variant.id, variant]),
  );

  for (const item of parsed.data.items) {
    const variant = variantsById.get(item.variantId);

    if (!variant) {
      return { message: "Variante no encontrada.", status: "error" };
    }

    if (item.quantity > variant.stock) {
      return {
        message: "La cantidad del pedido no puede superar el stock actual.",
        status: "error",
      };
    }
  }

  let total = new Prisma.Decimal(0);

  const orderItems = parsed.data.items.map((item) => {
    const variant = variantsById.get(item.variantId)!;

    const unitPrice = variant.price ?? variant.product.basePrice;
    const subtotal = unitPrice.mul(item.quantity);
    total = total.add(subtotal);

    return {
      productId: variant.product.id,
      productName: variant.product.name,
      quantity: item.quantity,
      storeId,
      subtotal,
      unitPrice,
      variantId: variant.id,
      variantLabel: getVariantLabel(variant),
    };
  });

  try {
    await prisma.order.create({
      data: {
        customerName: parsed.data.customerName,
        customerPhone: parsed.data.customerPhone,
        items: {
          create: orderItems,
        },
        notes: parsed.data.notes,
        status: parsed.data.status,
        storeId,
        total,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return {
        message: "La cantidad del pedido no puede superar el stock actual.",
        status: "error",
      };
    }

    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return { message: "Variante no encontrada.", status: "error" };
    }

    return orderError(error);
  }

  revalidatePath("/admin/orders");

  return {
    message: "Pedido creado. Confirmalo para descontar stock.",
    status: "success",
  };
}

export async function updateManualOrder(
  _previousState: UpdateOrderState,
  formData: FormData,
): Promise<UpdateOrderState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const orderId = String(formData.get("orderId") ?? "").trim();
  const parsed = readOrderForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!orderId) {
    return { message: "El id del pedido es obligatorio.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const variantIds = parsed.data.items.map((item) => item.variantId);
  const variants = await prisma.productVariant.findMany({
    select: {
      color: true,
      id: true,
      price: true,
      product: {
        select: {
          basePrice: true,
          id: true,
          name: true,
        },
      },
      size: true,
      stock: true,
    },
    where: {
      id: {
        in: variantIds,
      },
      isActive: true,
      product: {
        isActive: true,
      },
      storeId,
    },
  });

  if (variants.length !== variantIds.length) {
    return {
      message: "Una o mas variantes seleccionadas no estan disponibles.",
      status: "error",
    };
  }

  const variantsById = new Map(
    variants.map((variant) => [variant.id, variant]),
  );

  for (const item of parsed.data.items) {
    const variant = variantsById.get(item.variantId);

    if (!variant) {
      return { message: "Variante no encontrada.", status: "error" };
    }

    if (item.quantity > variant.stock) {
      return {
        message: "La cantidad del pedido no puede superar el stock actual.",
        status: "error",
      };
    }
  }

  let total = new Prisma.Decimal(0);

  const orderItems = parsed.data.items.map((item) => {
    const variant = variantsById.get(item.variantId)!;

    const unitPrice = variant.price ?? variant.product.basePrice;
    const subtotal = unitPrice.mul(item.quantity);
    total = total.add(subtotal);

    return {
      productId: variant.product.id,
      productName: variant.product.name,
      quantity: item.quantity,
      storeId,
      subtotal,
      unitPrice,
      variantId: variant.id,
      variantLabel: getVariantLabel(variant),
    };
  });

  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        data: {
          updatedAt: new Date(),
        },
        where: {
          id: orderId,
          status: OrderStatus.REVIEWING,
          storeId,
        },
      });

      if (claim.count === 0) {
        const order = await tx.order.findUnique({
          select: { status: true },
          where: { id: orderId, storeId },
        });

        if (!order) {
          throw new Error("ORDER_NOT_FOUND");
        }

        throw new Error("ORDER_CANNOT_BE_EDITED");
      }

      await tx.orderItem.deleteMany({
        where: {
          orderId,
          storeId,
        },
      });

      await tx.order.update({
        data: {
          customerName: parsed.data.customerName,
          customerPhone: parsed.data.customerPhone,
          items: {
            create: orderItems,
          },
          notes: parsed.data.notes,
          total,
        },
        where: {
          id: orderId,
          storeId,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return { message: "Pedido no encontrado.", status: "error" };
    }

    if (error instanceof Error && error.message === "ORDER_CANNOT_BE_EDITED") {
      return {
        message: "Solo se pueden editar pedidos pendientes.",
        status: "error",
      };
    }

    return orderError(error);
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);

  return { message: "Pedido actualizado.", status: "success" };
}

export async function confirmOrder(
  _previousState: ConfirmOrderState,
  formData: FormData,
): Promise<ConfirmOrderState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const orderId = String(formData.get("orderId") ?? "").trim();

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!orderId) {
    return { message: "El pedido es obligatorio.", status: "error" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const claim = await tx.order.updateMany({
        data: {
          confirmedAt: new Date(),
          status: OrderStatus.CONFIRMED,
        },
        where: {
          id: orderId,
          status: OrderStatus.REVIEWING,
          storeId,
        },
      });

      if (claim.count === 0) {
        const order = await tx.order.findUnique({
          select: { status: true },
          where: { id: orderId, storeId },
        });

        if (!order) {
          throw new Error("ORDER_NOT_FOUND");
        }

        if (order.status === OrderStatus.CONFIRMED) {
          throw new Error("ORDER_ALREADY_CONFIRMED");
        }

        throw new Error("ORDER_CANNOT_BE_CONFIRMED");
      }

      const order = await tx.order.findUnique({
        select: {
          id: true,
          items: {
            orderBy: [{ variantId: "asc" }],
            select: {
              productName: true,
              quantity: true,
              variantId: true,
              variantLabel: true,
            },
          },
        },
        where: { id: orderId, storeId },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.items.length === 0) {
        throw new Error("ORDER_HAS_NO_ITEMS");
      }

      for (const item of order.items) {
        const update = await tx.productVariant.updateMany({
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
          where: {
            id: item.variantId,
            stock: {
              gte: item.quantity,
            },
            storeId,
          },
        });

        if (update.count === 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }

        await tx.inventoryMovement.create({
          data: {
            quantity: -item.quantity,
            reason: `Order confirmation: ${item.productName} (${item.variantLabel})`,
            referenceId: order.id,
            storeId,
            type: InventoryMovementType.ORDER_CONFIRMATION,
            variantId: item.variantId,
          },
        });
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "ORDER_NOT_FOUND") {
      return { message: "Pedido no encontrado.", status: "error" };
    }

    if (error instanceof Error && error.message === "ORDER_ALREADY_CONFIRMED") {
      return { message: "El pedido ya esta confirmado.", status: "error" };
    }

    if (error instanceof Error && error.message === "ORDER_CANNOT_BE_CONFIRMED") {
      return { message: "Este pedido no se puede confirmar.", status: "error" };
    }

    if (error instanceof Error && error.message === "ORDER_HAS_NO_ITEMS") {
      return {
        message: "El pedido necesita al menos un item para confirmarse.",
        status: "error",
      };
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return {
        message:
          "El pedido no se puede confirmar porque uno o mas items no tienen stock suficiente.",
        status: "error",
      };
    }

    throw error;
  }

  revalidatePath("/admin/orders");

  return { message: "Pedido confirmado y stock descontado.", status: "success" };
}

"use server";

import { revalidatePath } from "next/cache";

import { Prisma, type OrderStatus as OrderStatusValue } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type OrderFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

type OrderItemPayload = {
  quantity: number;
  variantId: string;
};

type OrderPayload = {
  customerName: string;
  customerPhone: string;
  items: OrderItemPayload[];
  notes: string | null;
  status: Extract<OrderStatusValue, "REVIEWING" | "CONFIRMED">;
};

type OrderFormData =
  | {
      data: OrderPayload;
    }
  | {
      error: string;
    };

const allowedCreateStatuses = new Set<OrderPayload["status"]>([
  "REVIEWING",
  "CONFIRMED",
]);

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
    return { error: "Customer name is required." };
  }

  if (!customerPhone) {
    return { error: "Customer phone is required." };
  }

  if (!allowedCreateStatuses.has(status as OrderPayload["status"])) {
    return { error: "Order status is invalid." };
  }

  const items: OrderItemPayload[] = [];

  for (let index = 0; index < variantIds.length; index += 1) {
    const variantId = variantIds[index];
    const quantityValue = quantities[index] ?? "";

    if (!variantId && !quantityValue) {
      continue;
    }

    if (!variantId) {
      return { error: "Each order item needs a product variant." };
    }

    if (!/^[1-9]\d*$/.test(quantityValue)) {
      return { error: "Each order item quantity must be positive." };
    }

    items.push({
      quantity: Number.parseInt(quantityValue, 10),
      variantId,
    });
  }

  if (items.length === 0) {
    return { error: "Add at least one order item." };
  }

  const duplicateVariantIds = new Set<string>();

  for (const item of items) {
    if (duplicateVariantIds.has(item.variantId)) {
      return { error: "Do not repeat the same variant in one order." };
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
      message: "Selected order item is invalid.",
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
    return { message: "Store access is required.", status: "error" };
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
      message: "One or more selected variants are unavailable.",
      status: "error",
    };
  }

  const variantsById = new Map(
    variants.map((variant) => [variant.id, variant]),
  );

  for (const item of parsed.data.items) {
    const variant = variantsById.get(item.variantId);

    if (!variant) {
      return { message: "Variant not found.", status: "error" };
    }

    if (item.quantity > variant.stock) {
      return {
        message: "Order quantity cannot exceed current stock.",
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
        message: "Order quantity cannot exceed current stock.",
        status: "error",
      };
    }

    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return { message: "Variant not found.", status: "error" };
    }

    return orderError(error);
  }

  revalidatePath("/admin/orders");

  return {
    message: "Order created. Stock was not deducted.",
    status: "success",
  };
}

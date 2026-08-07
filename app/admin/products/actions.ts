"use server";

import { revalidatePath } from "next/cache";

import {
  Audience,
  ColorMode,
  Prisma,
  SaleUnit,
  type Audience as AudienceValue,
  type ColorMode as ColorModeValue,
  type SaleUnit as SaleUnitValue,
} from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type ProductFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

type ProductPayload = {
  name: string;
  slug: string;
  categoryId: string;
  brandId: string | null;
  modelCode: string | null;
  description: string | null;
  audience: AudienceValue;
  basePrice: string;
  saleUnit: SaleUnitValue;
  packQuantity: number | null;
  colorMode: ColorModeValue;
  sizeDisplayText: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

type ProductFormData =
  | {
      data: ProductPayload;
    }
  | {
      error: string;
    };

const audienceValues = Object.values(Audience) as AudienceValue[];
const saleUnitValues = Object.values(SaleUnit) as SaleUnitValue[];
const colorModeValues = Object.values(ColorMode) as ColorModeValue[];

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function readProductForm(formData: FormData): ProductFormData {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const brandId = optionalText(formData.get("brandId"));
  const audience = String(formData.get("audience") ?? "");
  const basePrice = String(formData.get("basePrice") ?? "").trim();
  const saleUnit = String(formData.get("saleUnit") ?? "");
  const packQuantityValue = String(formData.get("packQuantity") ?? "").trim();
  const colorMode = String(formData.get("colorMode") ?? "");
  const modelCode = optionalText(formData.get("modelCode"));
  const description = optionalText(formData.get("description"));
  const sizeDisplayText = optionalText(formData.get("sizeDisplayText"));

  if (!name) {
    return { error: "Name is required." };
  }

  const slug = slugify(name);

  if (!slug) {
    return { error: "Name must contain at least one letter or number." };
  }

  if (!categoryId) {
    return { error: "Category is required." };
  }

  if (!audienceValues.includes(audience as AudienceValue)) {
    return { error: "Audience is invalid." };
  }

  if (!saleUnitValues.includes(saleUnit as SaleUnitValue)) {
    return { error: "Sale unit is invalid." };
  }

  if (!colorModeValues.includes(colorMode as ColorModeValue)) {
    return { error: "Color mode is invalid." };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(basePrice)) {
    return {
      error: "Base price must be zero or more with up to 2 decimals.",
    };
  }

  if (packQuantityValue && !/^[1-9]\d*$/.test(packQuantityValue)) {
    return { error: "Pack quantity must be a positive whole number." };
  }

  const packQuantity = packQuantityValue
    ? Number.parseInt(packQuantityValue, 10)
    : null;

  return {
    data: {
      name,
      slug,
      categoryId,
      brandId,
      modelCode,
      description,
      audience: audience as AudienceValue,
      basePrice,
      saleUnit: saleUnit as SaleUnitValue,
      packQuantity,
      colorMode: colorMode as ColorModeValue,
      sizeDisplayText,
      isFeatured: formData.get("isFeatured") === "on",
      isActive: formData.get("isActive") === "on",
    },
  };
}

async function validateProductRelations(storeId: string, data: ProductPayload) {
  const category = await prisma.category.findUnique({
    select: { id: true },
    where: {
      id: data.categoryId,
      storeId,
    },
  });

  if (!category) {
    return "Selected category is invalid.";
  }

  if (!data.brandId) {
    return null;
  }

  const brand = await prisma.brand.findUnique({
    select: { id: true },
    where: {
      id: data.brandId,
      storeId,
    },
  });

  if (!brand) {
    return "Selected brand is invalid.";
  }

  return null;
}

function productError(error: unknown): ProductFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "A product with this slug already exists.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return {
      message: "Product not found.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return {
      message: "Selected category or brand is invalid.",
      status: "error",
    };
  }

  throw error;
}

export async function createProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readProductForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const relationError = await validateProductRelations(storeId, parsed.data);

  if (relationError) {
    return { message: relationError, status: "error" };
  }

  try {
    await prisma.product.create({
      data: {
        ...parsed.data,
        storeId,
      },
    });
  } catch (error) {
    return productError(error);
  }

  revalidatePath("/admin/products");

  return { message: "Product created.", status: "success" };
}

export async function updateProduct(
  _previousState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "").trim();
  const parsed = readProductForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if (!id) {
    return { message: "Product id is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const relationError = await validateProductRelations(storeId, parsed.data);

  if (relationError) {
    return { message: relationError, status: "error" };
  }

  try {
    await prisma.product.update({
      data: parsed.data,
      where: {
        id,
        storeId,
      },
    });
  } catch (error) {
    return productError(error);
  }

  revalidatePath("/admin/products");

  return { message: "Product updated.", status: "success" };
}

export async function deleteProduct(formData: FormData) {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "").trim();

  if (!id || !storeId) {
    return;
  }

  try {
    await prisma.product.delete({
      where: {
        id,
        storeId,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return;
    }

    throw error;
  }

  revalidatePath("/admin/products");
}

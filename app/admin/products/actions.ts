"use server";

import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

import {
  Audience,
  ColorMode,
  InventoryMovementType,
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

export type ProductImageFormState = ProductFormState;
export type InventoryAdjustmentFormState = ProductFormState;
export type ProductVariantFormState = ProductFormState;

const allowedImageTypes = new Set([
  "image/avif",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const maxImageSize = 5 * 1024 * 1024;
const productImagesBucket = "product-images";

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

type ProductVariantPayload = {
  productId: string;
  size: string;
  color: string | null;
  stock: number;
  isActive: boolean;
  sku: string | null;
  price: string | null;
};

type ProductVariantFormData =
  | {
      data: ProductVariantPayload;
    }
  | {
      error: string;
    };

type InventoryAdjustmentPayload = {
  productId: string;
  quantity: number;
  reason: string | null;
  variantId: string;
};

type InventoryAdjustmentFormData =
  | {
      data: InventoryAdjustmentPayload;
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

function readSortOrder(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();

  if (!text) {
    return 0;
  }

  if (!/^\d+$/.test(text)) {
    return null;
  }

  return Number.parseInt(text, 10);
}

function readProductVariantForm(formData: FormData): ProductVariantFormData {
  const productId = String(formData.get("productId") ?? "").trim();
  const size = String(formData.get("size") ?? "").trim().toUpperCase();
  const color = optionalText(formData.get("color"));
  const stockValue = String(formData.get("stock") ?? "").trim();
  const sku = optionalText(formData.get("sku"));
  const priceValue = String(formData.get("price") ?? "").trim();

  if (!productId) {
    return { error: "Product id is required." };
  }

  if (!size) {
    return { error: "Size is required." };
  }

  if (/[,+/;|]/.test(size) || /\b(AND|Y)\b/.test(size)) {
    return {
      error: "Create one variant per size. Do not combine sizes in one variant.",
    };
  }

  if (!/^\d+$/.test(stockValue)) {
    return { error: "Stock must be zero or more." };
  }

  if (priceValue && !/^\d+(\.\d{1,2})?$/.test(priceValue)) {
    return {
      error: "Variant price must be zero or more with up to 2 decimals.",
    };
  }

  return {
    data: {
      productId,
      size,
      color,
      stock: Number.parseInt(stockValue, 10),
      isActive: formData.get("isActive") === "on",
      sku,
      price: priceValue || null,
    },
  };
}

function readInventoryAdjustmentForm(
  formData: FormData,
): InventoryAdjustmentFormData {
  const productId = String(formData.get("productId") ?? "").trim();
  const variantId = String(formData.get("variantId") ?? "").trim();
  const quantityValue = String(formData.get("quantity") ?? "").trim();
  const reason = optionalText(formData.get("reason"));

  if (!productId) {
    return { error: "Product id is required." };
  }

  if (!variantId) {
    return { error: "Variant id is required." };
  }

  if (!/^[+-]?[1-9]\d*$/.test(quantityValue)) {
    return { error: "Adjustment must be a non-zero whole number." };
  }

  return {
    data: {
      productId,
      quantity: Number.parseInt(quantityValue, 10),
      reason,
      variantId,
    },
  };
}

function isAllowedImageUrl(value: string) {
  if (value.startsWith("/") && !value.startsWith("//")) {
    return true;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function fileExtension(file: File) {
  const extensionByType = {
    "image/avif": ".avif",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  } as const;

  return extensionByType[file.type as keyof typeof extensionByType] ?? "";
}

function productImageStoragePath(
  url: string,
  storeId: string,
  productId: string,
) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  const storagePath = decodeURIComponent(url.slice(markerIndex + marker.length));

  if (!storagePath.startsWith(`${storeId}/${productId}/`)) {
    return null;
  }

  return storagePath;
}

function requireSupabaseStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

async function uploadProductImageFile(
  storeId: string,
  productId: string,
  file: File,
): Promise<{ url: string } | { error: string }> {
  const supabase = requireSupabaseStorageClient();

  if (!supabase) {
    return {
      error: "Supabase Storage env vars are required for image uploads.",
    };
  }

  const extension = fileExtension(file);
  const filename = `${storeId}/${productId}/${crypto.randomUUID()}${extension}`;
  const { error } = await supabase.storage
    .from(productImagesBucket)
    .upload(filename, file, {
      cacheControl: "31536000",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    return { error: error.message };
  }

  const { data } = supabase.storage
    .from(productImagesBucket)
    .getPublicUrl(filename);

  return { url: data.publicUrl };
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

async function validateProductColorMode(
  storeId: string,
  productId: string,
  colorMode: ColorModeValue,
) {
  if (colorMode === ColorMode.VARIANTS) {
    const uncoloredVariant = await prisma.productVariant.findFirst({
      select: { id: true },
      where: {
        color: null,
        productId,
        storeId,
      },
    });

    if (uncoloredVariant) {
      return "Add colors to existing variants before changing color mode to VARIANTS.";
    }

    return null;
  }

  const variants = await prisma.productVariant.findMany({
    select: { size: true },
    where: {
      productId,
      storeId,
    },
  });
  const seenSizes = new Set<string>();

  for (const variant of variants) {
    if (seenSizes.has(variant.size)) {
      return "Delete duplicate sizes before changing color mode away from VARIANTS.";
    }

    seenSizes.add(variant.size);
  }

  return null;
}

function validateVariantColorMode(
  colorMode: ColorModeValue,
  color: string | null,
) {
  if (colorMode === ColorMode.VARIANTS && !color) {
    return "Color is required when product color mode is VARIANTS.";
  }

  if (colorMode !== ColorMode.VARIANTS && color) {
    return "Variant color is only allowed when product color mode is VARIANTS.";
  }

  return null;
}

function productError(error: unknown): ProductFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    const targetText = Array.isArray(target)
      ? target.join(" ")
      : String(target ?? "");

    if (
      targetText.includes("ProductVariant") ||
      targetText.includes("productId") ||
      targetText.includes("size") ||
      targetText.includes("color")
    ) {
      return {
        message: "Duplicate variant sizes prevent this color mode change.",
        status: "error",
      };
    }

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

function productVariantError(error: unknown): ProductVariantFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    const target = error.meta?.target;
    const targetText = Array.isArray(target)
      ? target.join(" ")
      : String(target ?? "");

    if (targetText.includes("sku")) {
      return {
        message: "A variant with this SKU already exists.",
        status: "error",
      };
    }

    return {
      message: "A variant with this size and color already exists.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return {
      message: "Variant not found.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return {
      message: "Selected product is invalid.",
      status: "error",
    };
  }

  throw error;
}

async function findDuplicateProductVariant(
  storeId: string,
  data: ProductVariantPayload,
  ignoredVariantId?: string,
) {
  return prisma.productVariant.findFirst({
    select: { id: true },
    where: {
      color: data.color,
      id: ignoredVariantId ? { not: ignoredVariantId } : undefined,
      productId: data.productId,
      size: data.size,
      storeId,
    },
  });
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

  const colorModeError = await validateProductColorMode(
    storeId,
    id,
    parsed.data.colorMode,
  );

  if (colorModeError) {
    return { message: colorModeError, status: "error" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (parsed.data.colorMode !== ColorMode.VARIANTS) {
        await tx.productVariant.updateMany({
          data: {
            color: null,
          },
          where: {
            productId: id,
            storeId,
          },
        });
      }

      await tx.product.update({
        data: parsed.data,
        where: {
          id,
          storeId,
        },
      });
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
    const product = await prisma.product.findUnique({
      select: {
        images: {
          select: {
            url: true,
          },
        },
        variants: {
          select: {
            id: true,
          },
        },
      },
      where: {
        id,
        storeId,
      },
    });

    if (!product) {
      return;
    }

    await prisma.$transaction(async (tx) => {
      const variantIds = product.variants.map((variant) => variant.id);

      if (variantIds.length > 0) {
        await tx.inventoryMovement.deleteMany({
          where: {
            storeId,
            variantId: {
              in: variantIds,
            },
          },
        });
      }

      await tx.product.delete({
        where: {
          id,
          storeId,
        },
      });
    });

    const storagePaths = product.images
      .map((image) => productImageStoragePath(image.url, storeId, id))
      .filter((storagePath): storagePath is string => Boolean(storagePath));
    const supabase = storagePaths.length ? requireSupabaseStorageClient() : null;

    if (supabase && storagePaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(productImagesBucket)
        .remove(storagePaths);

      if (storageError) {
        console.error(storageError.message);
      }
    }
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return;
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return;
    }

    throw error;
  }

  revalidatePath("/admin/products");
}

export async function createProductImage(
  _previousState: ProductImageFormState,
  formData: FormData,
): Promise<ProductImageFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const productId = String(formData.get("productId") ?? "").trim();
  const urlValue = String(formData.get("url") ?? "").trim();
  const fileValue = formData.get("image");
  const alt = optionalText(formData.get("alt"));
  const sortOrder = readSortOrder(formData.get("sortOrder"));

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if (!productId) {
    return { message: "Product id is required.", status: "error" };
  }

  if (!urlValue && !(fileValue instanceof File && fileValue.size > 0)) {
    return { message: "Image file or URL is required.", status: "error" };
  }

  if (urlValue && !isAllowedImageUrl(urlValue)) {
    return {
      message: "Image URL must start with http://, https://, or /.",
      status: "error",
    };
  }

  if (sortOrder === null) {
    return { message: "Sort order must be zero or more.", status: "error" };
  }

  const product = await prisma.product.findUnique({
    select: { id: true },
    where: {
      id: productId,
      storeId,
    },
  });

  if (!product) {
    return { message: "Product not found.", status: "error" };
  }

  let url = urlValue;

  if (fileValue instanceof File && fileValue.size > 0) {
    if (!allowedImageTypes.has(fileValue.type)) {
      return {
        message: "Image file must be AVIF, JPG, PNG, or WebP.",
        status: "error",
      };
    }

    if (fileValue.size > maxImageSize) {
      return {
        message: "Image file must be 5 MB or smaller.",
        status: "error",
      };
    }

    const uploaded = await uploadProductImageFile(storeId, productId, fileValue);

    if ("error" in uploaded) {
      return { message: uploaded.error, status: "error" };
    }

    url = uploaded.url;
  }

  await prisma.productImage.create({
    data: {
      alt,
      productId,
      sortOrder,
      storeId,
      url,
    },
  });

  revalidatePath("/admin/products");

  return { message: "Image added.", status: "success" };
}

export async function deleteProductImage(formData: FormData) {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "").trim();

  if (!id || !storeId) {
    return;
  }

  try {
    const image = await prisma.productImage.delete({
      select: {
        productId: true,
        url: true,
      },
      where: {
        id,
        storeId,
      },
    });

    const storagePath = productImageStoragePath(
      image.url,
      storeId,
      image.productId,
    );
    const supabase = storagePath ? requireSupabaseStorageClient() : null;

    if (storagePath && supabase) {
      const { error: storageError } = await supabase.storage
        .from(productImagesBucket)
        .remove([storagePath]);

      if (storageError) {
        console.error(storageError.message);
      }
    }
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

export async function createProductVariant(
  _previousState: ProductVariantFormState,
  formData: FormData,
): Promise<ProductVariantFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readProductVariantForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const product = await prisma.product.findUnique({
    select: { colorMode: true, id: true },
    where: {
      id: parsed.data.productId,
      storeId,
    },
  });

  if (!product) {
    return { message: "Product not found.", status: "error" };
  }

  const colorModeError = validateVariantColorMode(
    product.colorMode,
    parsed.data.color,
  );

  if (colorModeError) {
    return { message: colorModeError, status: "error" };
  }

  const duplicateVariant = await findDuplicateProductVariant(
    storeId,
    parsed.data,
  );

  if (duplicateVariant) {
    return {
      message: "A variant with this size and color already exists.",
      status: "error",
    };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.create({
        data: {
          ...parsed.data,
          storeId,
        },
      });

      if (parsed.data.stock > 0) {
        await tx.inventoryMovement.create({
          data: {
            quantity: parsed.data.stock,
            reason: "Initial stock",
            storeId,
            type: InventoryMovementType.MANUAL_ADJUSTMENT,
            variantId: variant.id,
          },
        });
      }
    });
  } catch (error) {
    return productVariantError(error);
  }

  revalidatePath("/admin/products");

  return { message: "Variant created.", status: "success" };
}

export async function updateProductVariant(
  _previousState: ProductVariantFormState,
  formData: FormData,
): Promise<ProductVariantFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "").trim();
  const parsed = readProductVariantForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if (!id) {
    return { message: "Variant id is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const product = await prisma.product.findUnique({
    select: { colorMode: true, id: true },
    where: {
      id: parsed.data.productId,
      storeId,
    },
  });

  if (!product) {
    return { message: "Product not found.", status: "error" };
  }

  const colorModeError = validateVariantColorMode(
    product.colorMode,
    parsed.data.color,
  );

  if (colorModeError) {
    return { message: colorModeError, status: "error" };
  }

  const duplicateVariant = await findDuplicateProductVariant(
    storeId,
    parsed.data,
    id,
  );

  if (duplicateVariant) {
    return {
      message: "A variant with this size and color already exists.",
      status: "error",
    };
  }

  try {
    await prisma.productVariant.update({
      data: {
        size: parsed.data.size,
        color: parsed.data.color,
        isActive: parsed.data.isActive,
        sku: parsed.data.sku,
        price: parsed.data.price,
      },
      where: {
        id,
        productId: parsed.data.productId,
        storeId,
      },
    });
  } catch (error) {
    return productVariantError(error);
  }

  revalidatePath("/admin/products");

  return { message: "Variant updated.", status: "success" };
}

export async function adjustInventory(
  _previousState: InventoryAdjustmentFormState,
  formData: FormData,
): Promise<InventoryAdjustmentFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readInventoryAdjustmentForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      const variant = await tx.productVariant.findUnique({
        select: { id: true },
        where: {
          id: parsed.data.variantId,
          productId: parsed.data.productId,
          storeId,
        },
      });

      if (!variant) {
        throw new Error("VARIANT_NOT_FOUND");
      }

      if (parsed.data.quantity < 0) {
        const update = await tx.productVariant.updateMany({
          data: {
            stock: {
              decrement: Math.abs(parsed.data.quantity),
            },
          },
          where: {
            id: parsed.data.variantId,
            productId: parsed.data.productId,
            stock: {
              gte: Math.abs(parsed.data.quantity),
            },
            storeId,
          },
        });

        if (update.count === 0) {
          throw new Error("INSUFFICIENT_STOCK");
        }
      } else {
        await tx.productVariant.update({
          data: {
            stock: {
              increment: parsed.data.quantity,
            },
          },
          where: {
            id: parsed.data.variantId,
            productId: parsed.data.productId,
            storeId,
          },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          quantity: parsed.data.quantity,
          reason: parsed.data.reason,
          storeId,
          type: InventoryMovementType.MANUAL_ADJUSTMENT,
          variantId: parsed.data.variantId,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VARIANT_NOT_FOUND") {
      return { message: "Variant not found.", status: "error" };
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return {
        message: "Adjustment cannot reduce stock below zero.",
        status: "error",
      };
    }

    throw error;
  }

  revalidatePath("/admin/products");

  return { message: "Stock adjusted.", status: "success" };
}

export async function deleteProductVariant(
  _previousState: ProductVariantFormState,
  formData: FormData,
): Promise<ProductVariantFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "").trim();
  const productId = String(formData.get("productId") ?? "").trim();

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if (!id || !productId) {
    return { message: "Variant id is required.", status: "error" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.inventoryMovement.deleteMany({
        where: {
          storeId,
          variantId: id,
        },
      });

      await tx.productVariant.delete({
        where: {
          id,
          productId,
          storeId,
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return { message: "Variant not found.", status: "error" };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        message: "Variant cannot be deleted because it is already used.",
        status: "error",
      };
    }

    throw error;
  }

  revalidatePath("/admin/products");

  return { message: "Variant deleted.", status: "success" };
}

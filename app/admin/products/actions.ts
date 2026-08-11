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
  modelCode: string | null;
  description: string | null;
  audience: AudienceValue;
  basePrice: string;
  saleUnit: SaleUnitValue;
  colorMode: ColorModeValue;
  sizeDisplayText: string | null;
  isFeatured: boolean;
  isActive: boolean;
};

type ProductFormData =
  | {
      data: ProductPayload;
      variants: ProductVariantInput[];
    }
  | {
      error: string;
    };

type ProductVariantInput = {
  size: string;
  color: string | null;
  stock: number;
  isActive: boolean;
  sku: string | null;
  price: string | null;
};

type ProductVariantPayload = ProductVariantInput & {
  productId: string;
};

type ProductVariantsFormData =
  | {
      data: ProductVariantInput[];
    }
  | {
      error: string;
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
    return { error: "El id del producto es obligatorio." };
  }

  if (!size) {
    return { error: "El talle es obligatorio." };
  }

  if (/[,+/;|]/.test(size) || /\b(AND|Y)\b/.test(size)) {
    return {
      error: "Crea una variante por talle. No combines talles en una variante.",
    };
  }

  if (!/^\d+$/.test(stockValue)) {
    return { error: "El stock debe ser cero o mayor." };
  }

  if (priceValue && !/^\d+(\.\d{1,2})?$/.test(priceValue)) {
    return {
      error: "El precio de la variante debe ser cero o mayor y hasta 2 decimales.",
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
    return { error: "El id del producto es obligatorio." };
  }

  if (!variantId) {
    return { error: "El id de la variante es obligatorio." };
  }

  if (!/^[+-]?[1-9]\d*$/.test(quantityValue)) {
    return { error: "El ajuste debe ser un numero entero distinto de cero." };
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
): Promise<{ storagePath: string; url: string } | { error: string }> {
  const supabase = requireSupabaseStorageClient();

  if (!supabase) {
    return {
      error: "Las variables de entorno de Supabase Storage son obligatorias para subir imagenes.",
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

  return { storagePath: filename, url: data.publicUrl };
}

function readProductVariants(formData: FormData): ProductVariantsFormData {
  const rawValue = String(formData.get("variants") ?? "[]");
  let rawVariants: unknown;

  try {
    rawVariants = JSON.parse(rawValue);
  } catch {
    return { error: "Las variantes no tienen un formato valido." };
  }

  if (!Array.isArray(rawVariants)) {
    return { error: "Las variantes no tienen un formato valido." };
  }

  const variants: ProductVariantInput[] = [];

  for (const rawVariant of rawVariants) {
    if (!rawVariant || typeof rawVariant !== "object") {
      return { error: "Las variantes no tienen un formato valido." };
    }

    const variant = rawVariant as Record<string, unknown>;
    const size = String(variant.size ?? "").trim().toUpperCase();
    const color = optionalText(String(variant.color ?? ""));
    const stockValue = String(variant.stock ?? "").trim();
    const priceValue = String(variant.price ?? "").trim();
    const sku = optionalText(String(variant.sku ?? ""));

    if (!size) {
      return { error: "El talle es obligatorio en cada variante." };
    }

    if (/[,+/;|]/.test(size) || /\b(AND|Y)\b/.test(size)) {
      return {
        error: "Crea una variante por talle. No combines talles en una variante.",
      };
    }

    if (!/^\d+$/.test(stockValue)) {
      return { error: "El stock debe ser cero o mayor." };
    }

    if (priceValue && !/^\d+(\.\d{1,2})?$/.test(priceValue)) {
      return {
        error: "El precio de la variante debe ser cero o mayor y hasta 2 decimales.",
      };
    }

    variants.push({
      color,
      isActive: variant.isActive !== false,
      price: priceValue || null,
      size,
      sku,
      stock: Number.parseInt(stockValue, 10),
    });
  }

  return { data: variants };
}

async function removeProductImageFile(storagePath: string) {
  const supabase = requireSupabaseStorageClient();

  if (!supabase) {
    return;
  }

  const { error } = await supabase.storage
    .from(productImagesBucket)
    .remove([storagePath]);

  if (error) {
    console.error(error.message);
  }
}

function readProductForm(formData: FormData): ProductFormData {
  const name = String(formData.get("name") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const audience = String(formData.get("audience") ?? "");
  const basePrice = String(formData.get("basePrice") ?? "").trim();
  const saleUnit = String(formData.get("saleUnit") ?? "");
  const colorMode = String(formData.get("colorMode") ?? "");
  const modelCode = optionalText(formData.get("modelCode"));
  const description = optionalText(formData.get("description"));
  const sizeDisplayText = optionalText(formData.get("sizeDisplayText"));
  const variants = readProductVariants(formData);
  const inventoryMode = String(formData.get("inventoryMode") ?? "");
  const simpleStockValue = String(formData.get("simpleStock") ?? "").trim();

  if ("error" in variants) {
    return variants;
  }

  if (inventoryMode === "SIMPLE") {
    if (colorMode === ColorMode.VARIANTS) {
      return {
        error: "Los productos con colores por variante necesitan variantes manuales.",
      };
    }

    if (!/^\d+$/.test(simpleStockValue)) {
      return { error: "El stock debe ser cero o mayor." };
    }

    variants.data = [
      {
        color: null,
        isActive: true,
        price: null,
        size: "UNICO",
        sku: null,
        stock: Number.parseInt(simpleStockValue, 10),
      },
    ];
  } else if (inventoryMode === "VARIANTS" && variants.data.length === 0) {
    return { error: "Agrega al menos una variante o selecciona producto simple." };
  } else if (inventoryMode && !["SIMPLE", "VARIANTS"].includes(inventoryMode)) {
    return { error: "El modo de inventario no es valido." };
  }

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const slug = slugify(name);

  if (!slug) {
    return { error: "El nombre debe incluir al menos una letra o numero." };
  }

  if (!categoryId) {
    return { error: "La categoria es obligatoria." };
  }

  if (!audienceValues.includes(audience as AudienceValue)) {
    return { error: "La audiencia no es valida." };
  }

  if (!saleUnitValues.includes(saleUnit as SaleUnitValue)) {
    return { error: "La unidad de venta no es valida." };
  }

  if (!colorModeValues.includes(colorMode as ColorModeValue)) {
    return { error: "El modo de color no es valido." };
  }

  if (!/^\d+(\.\d{1,2})?$/.test(basePrice)) {
    return {
      error: "El precio base debe ser cero o mayor y hasta 2 decimales.",
    };
  }

  return {
    data: {
      name,
      slug,
      categoryId,
      modelCode,
      description,
      audience: audience as AudienceValue,
      basePrice,
      saleUnit: saleUnit as SaleUnitValue,
      colorMode: colorMode as ColorModeValue,
      sizeDisplayText,
      isFeatured: formData.get("isFeatured") === "on",
      isActive: formData.get("isActive") === "on",
    },
    variants: variants.data,
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
    return "La categoria seleccionada no es valida.";
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
      return "Agrega colores a las variantes existentes antes de cambiar el modo de color a VARIANTS.";
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
  const seenTalles = new Set<string>();

  for (const variant of variants) {
    if (seenTalles.has(variant.size)) {
      return "Elimina talles duplicados antes de cambiar el modo de color desde VARIANTS.";
    }

    seenTalles.add(variant.size);
  }

  return null;
}

function validateVariantColorMode(
  colorMode: ColorModeValue,
  color: string | null,
) {
  if (colorMode === ColorMode.VARIANTS && !color) {
    return "El color es obligatorio cuando el modo de color del producto es VARIANTS.";
  }

  if (colorMode !== ColorMode.VARIANTS && color) {
    return "El color de variante solo se permite cuando el modo de color del producto es VARIANTS.";
  }

  return null;
}

function validateNewProductVariants(
  colorMode: ColorModeValue,
  variants: ProductVariantInput[],
) {
  const seenVariants = new Set<string>();

  for (const variant of variants) {
    const colorModeError = validateVariantColorMode(colorMode, variant.color);

    if (colorModeError) {
      return colorModeError;
    }

    const key = `${variant.size}::${variant.color ?? ""}`;

    if (seenVariants.has(key)) {
      return "Ya existe una variante con este talle y color.";
    }

    seenVariants.add(key);
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
        message: "Hay talles duplicados que impiden cambiar este modo de color.",
        status: "error",
      };
    }

    return {
      message: "Ya existe un producto con este slug.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return {
      message: "Producto no encontrado.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return {
      message: "La categoria seleccionada no es valida.",
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
        message: "Ya existe una variante con este SKU.",
        status: "error",
      };
    }

    return {
      message: "Ya existe una variante con este talle y color.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return {
      message: "Variante no encontrada.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2003"
  ) {
    return {
      message: "El producto seleccionado no es valido.",
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
  const imageValue = formData.get("image");
  const parsed = readProductForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  const variantError = validateNewProductVariants(
    parsed.data.colorMode,
    parsed.variants,
  );

  if (variantError) {
    return { message: variantError, status: "error" };
  }

  const imageFile =
    imageValue instanceof File && imageValue.size > 0 ? imageValue : null;

  let uploadedImageStoragePath: string | null = null;

  if (imageFile) {
    if (!allowedImageTypes.has(imageFile.type)) {
      return {
        message: "La imagen debe ser AVIF, JPG, PNG o WebP.",
        status: "error",
      };
    }

    if (imageFile.size > maxImageSize) {
      return {
        message: "La imagen debe pesar 5 MB o menos.",
        status: "error",
      };
    }
  }

  const relationError = await validateProductRelations(storeId, parsed.data);

  if (relationError) {
    return { message: relationError, status: "error" };
  }

  let product: { id: string; name: string };

  try {
    product = await prisma.product.create({
      data: {
        ...parsed.data,
        storeId,
      },
    });
  } catch (error) {
    return productError(error);
  }

  if (imageFile) {
    const uploaded = await uploadProductImageFile(
      storeId,
      product.id,
      imageFile,
    );

    if ("error" in uploaded) {
      await prisma.product.delete({
        where: { id: product.id, storeId },
      });
      return { message: uploaded.error, status: "error" };
    }

    uploadedImageStoragePath = uploaded.storagePath;

    try {
      await prisma.productImage.create({
        data: {
          alt: product.name,
          productId: product.id,
          sortOrder: 0,
          storeId,
          url: uploaded.url,
        },
      });
    } catch (error) {
      await removeProductImageFile(uploaded.storagePath);
      await prisma.product.delete({
        where: { id: product.id, storeId },
      });
      return productError(error);
    }
  }

  if (parsed.variants.length > 0) {
    try {
      await prisma.$transaction(async (tx) => {
        for (const variant of parsed.variants) {
          const createdVariant = await tx.productVariant.create({
            data: {
              ...variant,
              productId: product.id,
              storeId,
            },
          });

          if (variant.stock > 0) {
            await tx.inventoryMovement.create({
              data: {
                quantity: variant.stock,
                reason: "Stock inicial",
                storeId,
                type: InventoryMovementType.MANUAL_ADJUSTMENT,
                variantId: createdVariant.id,
              },
            });
          }
        }
      });
    } catch (error) {
      if (uploadedImageStoragePath) {
        await removeProductImageFile(uploadedImageStoragePath);
      }

      await prisma.product.delete({
        where: { id: product.id, storeId },
      });
      return productVariantError(error);
    }
  }

  revalidatePath("/admin/products");

  return { message: "Producto creado.", status: "success" };
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
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!id) {
    return { message: "El id del producto es obligatorio.", status: "error" };
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

  return { message: "Producto actualizado.", status: "success" };
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
  const fileValue = formData.get("image");
  const alt = optionalText(formData.get("alt"));
  const sortOrder = readSortOrder(formData.get("sortOrder"));

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!productId) {
    return { message: "El id del producto es obligatorio.", status: "error" };
  }

  if (!(fileValue instanceof File && fileValue.size > 0)) {
    return { message: "La imagen es obligatoria.", status: "error" };
  }

  if (sortOrder === null) {
    return { message: "El orden debe ser cero o mayor.", status: "error" };
  }

  const product = await prisma.product.findUnique({
    select: { id: true },
    where: {
      id: productId,
      storeId,
    },
  });

  if (!product) {
    return { message: "Producto no encontrado.", status: "error" };
  }

  if (!allowedImageTypes.has(fileValue.type)) {
    return {
      message: "La imagen debe ser AVIF, JPG, PNG o WebP.",
      status: "error",
    };
  }

  if (fileValue.size > maxImageSize) {
    return {
      message: "La imagen debe pesar 5 MB o menos.",
      status: "error",
    };
  }

  const uploaded = await uploadProductImageFile(storeId, productId, fileValue);

  if ("error" in uploaded) {
    return { message: uploaded.error, status: "error" };
  }

  await prisma.productImage.create({
    data: {
      alt,
      productId,
      sortOrder,
      storeId,
      url: uploaded.url,
    },
  });

  revalidatePath("/admin/products");

  return { message: "Imagen agregada.", status: "success" };
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
    return { message: "Se requiere acceso a la tienda.", status: "error" };
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
    return { message: "Producto no encontrado.", status: "error" };
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
      message: "Ya existe una variante con este talle y color.",
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
            reason: "Stock inicial",
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

  return { message: "Variante creada.", status: "success" };
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
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!id) {
    return { message: "El id de la variante es obligatorio.", status: "error" };
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
    return { message: "Producto no encontrado.", status: "error" };
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
      message: "Ya existe una variante con este talle y color.",
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

  return { message: "Variante actualizada.", status: "success" };
}

export async function adjustInventory(
  _previousState: InventoryAdjustmentFormState,
  formData: FormData,
): Promise<InventoryAdjustmentFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readInventoryAdjustmentForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
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
      return { message: "Variante no encontrada.", status: "error" };
    }

    if (error instanceof Error && error.message === "INSUFFICIENT_STOCK") {
      return {
        message: "El ajuste no puede dejar el stock debajo de cero.",
        status: "error",
      };
    }

    throw error;
  }

  revalidatePath("/admin/products");

  return { message: "Stock ajustado.", status: "success" };
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
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!id || !productId) {
    return { message: "El id de la variante es obligatorio.", status: "error" };
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
      return { message: "Variante no encontrada.", status: "error" };
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return {
        message: "La variante no se puede eliminar porque ya esta en uso.",
        status: "error",
      };
    }

    throw error;
  }

  revalidatePath("/admin/products");

  return { message: "Variante eliminada.", status: "success" };
}

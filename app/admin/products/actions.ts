"use server";

import { createClient } from "@supabase/supabase-js";
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

export type ProductImageFormState = ProductFormState;

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
    const product = await prisma.product.findUnique({
      select: {
        images: {
          select: {
            url: true,
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

    await prisma.product.delete({
      where: {
        id,
        storeId,
      },
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

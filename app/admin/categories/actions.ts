"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_CACHE_TAG } from "@/lib/storefront";

export type CategoryFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

type CategoryFormData =
  | {
      data: {
        name: string;
        slug: string;
        isActive: boolean;
      };
    }
  | {
      error: string;
    };

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readCategoryForm(formData: FormData): CategoryFormData {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "El nombre es obligatorio." };
  }

  const slug = slugify(name);

  if (!slug) {
    return { error: "El nombre debe incluir al menos una letra o numero." };
  }

  return {
    data: {
      name,
      slug,
      isActive: formData.get("isActive") === "on",
    },
  };
}

function categoryError(error: unknown): CategoryFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "Ya existe una categoria con este slug.",
      status: "error",
    };
  }

  throw error;
}

export async function createCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readCategoryForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  try {
    const lastCategory = await prisma.category.findFirst({
      where: { storeId },
      orderBy: [{ sortOrder: "desc" }, { createdAt: "desc" }],
      select: { sortOrder: true },
    });

    await prisma.category.create({
      data: {
        ...parsed.data,
        sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
        storeId,
      },
    });
  } catch (error) {
    return categoryError(error);
  }

  revalidateTag(STOREFRONT_CACHE_TAG, 'max');
  revalidatePath("/admin/categories");

  return { message: "Categoria creada.", status: "success" };
}

export async function updateCategory(
  _previousState: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "");
  const parsed = readCategoryForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!id) {
    return { message: "El id de la categoria es obligatorio.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  try {
    await prisma.category.update({
      data: parsed.data,
      where: {
        id,
        storeId,
      },
    });
  } catch (error) {
    return categoryError(error);
  }

  revalidateTag(STOREFRONT_CACHE_TAG, 'max');
  revalidatePath("/admin/categories");

  return { message: "Categoria actualizada.", status: "success" };
}

export async function deleteCategory(formData: FormData) {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "");

  if (!id || !storeId) {
    return;
  }

  const category = await prisma.category.findUnique({
    select: {
      _count: {
        select: {
          products: true,
        },
      },
    },
    where: {
      id,
      storeId,
    },
  });

  if (!category) {
    return;
  }

  if (category._count.products > 0) {
    await prisma.category.update({
      data: {
        isActive: false,
      },
      where: {
        id,
        storeId,
      },
    });
  } else {
    await prisma.category.delete({
      where: {
        id,
        storeId,
      },
    });
  }

  revalidateTag(STOREFRONT_CACHE_TAG, 'max');
  revalidatePath("/admin/categories");
}

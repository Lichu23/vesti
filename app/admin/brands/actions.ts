"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type BrandFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

type BrandFormData =
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

function readBrandForm(formData: FormData): BrandFormData {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    return { error: "Name is required." };
  }

  const slug = slugify(name);

  if (!slug) {
    return { error: "Name must contain at least one letter or number." };
  }

  return {
    data: {
      name,
      slug,
      isActive: formData.get("isActive") === "on",
    },
  };
}

function brandError(error: unknown): BrandFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "A brand with this slug already exists.",
      status: "error",
    };
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2025"
  ) {
    return {
      message: "Brand not found.",
      status: "error",
    };
  }

  throw error;
}

export async function createBrand(
  _previousState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const parsed = readBrandForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  try {
    await prisma.brand.create({
      data: {
        ...parsed.data,
        storeId,
      },
    });
  } catch (error) {
    return brandError(error);
  }

  revalidatePath("/admin/brands");

  return { message: "Brand created.", status: "success" };
}

export async function updateBrand(
  _previousState: BrandFormState,
  formData: FormData,
): Promise<BrandFormState> {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "");
  const parsed = readBrandForm(formData);

  if (!storeId) {
    return { message: "Store access is required.", status: "error" };
  }

  if (!id) {
    return { message: "Brand id is required.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  try {
    await prisma.brand.update({
      data: parsed.data,
      where: {
        id,
        storeId,
      },
    });
  } catch (error) {
    return brandError(error);
  }

  revalidatePath("/admin/brands");

  return { message: "Brand updated.", status: "success" };
}

export async function deleteBrand(formData: FormData) {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const id = String(formData.get("id") ?? "");

  if (!id || !storeId) {
    return;
  }

  try {
    await prisma.brand.delete({
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

  revalidatePath("/admin/brands");
}

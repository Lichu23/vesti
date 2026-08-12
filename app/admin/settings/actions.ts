"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { UserRole } from "@/generated/prisma/enums";
import { requireOwnerSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { STOREFRONT_CACHE_TAG } from "@/lib/storefront";

export type StoreSettingsFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

export type StoreInviteFormState = StoreSettingsFormState;

type StoreSettingsPayload = {
  isActive: boolean;
  name: string;
  slug: string;
  whatsapp: string | null;
};

type StoreSettingsFormData =
  | {
      data: StoreSettingsPayload;
    }
  | {
      error: string;
    };

function optionalText(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text ? text : null;
}

function normalizeEmail(value: FormDataEntryValue | null) {
  return String(value ?? "").trim().toLowerCase();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function readStoreSettingsForm(formData: FormData): StoreSettingsFormData {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const whatsapp = optionalText(formData.get("whatsapp"));

  if (!name) {
    return { error: "El nombre de la tienda es obligatorio." };
  }

  const slug = slugify(slugInput || name);

  if (!slug) {
    return { error: "El slug debe incluir al menos una letra o numero." };
  }

  if (whatsapp && !/^[+()\d\s-]{6,32}$/.test(whatsapp)) {
    return {
      error: "El WhatsApp debe usar numeros, espacios, +, guiones o parentesis.",
    };
  }

  return {
    data: {
      isActive: formData.get("isActive") === "on",
      name,
      slug,
      whatsapp,
    },
  };
}

function storeSettingsError(error: unknown): StoreSettingsFormState {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  ) {
    return {
      message: "Ya existe una tienda con este slug.",
      status: "error",
    };
  }

  throw error;
}

export async function updateStoreSettings(
  _previousState: StoreSettingsFormState,
  formData: FormData,
): Promise<StoreSettingsFormState> {
  const session = await requireOwnerSession();
  const storeId = session.user.storeId;
  const parsed = readStoreSettingsForm(formData);

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if ("error" in parsed) {
    return { message: parsed.error, status: "error" };
  }

  try {
    await prisma.store.update({
      data: parsed.data,
      where: {
        id: storeId,
      },
    });
  } catch (error) {
    return storeSettingsError(error);
  }

  revalidateTag(STOREFRONT_CACHE_TAG, "max");
  revalidatePath("/");
  revalidateTag(STOREFRONT_CACHE_TAG, "max");
  revalidatePath("/admin");
  revalidateTag(STOREFRONT_CACHE_TAG, "max");
  revalidatePath("/admin/settings");

  return { message: "Configuracion actualizada.", status: "success" };
}

export async function createStoreInvite(
  _previousState: StoreInviteFormState,
  formData: FormData,
): Promise<StoreInviteFormState> {
  const session = await requireOwnerSession();
  const storeId = session.user.storeId;
  const email = normalizeEmail(formData.get("email"));
  const roleInput = String(formData.get("role") ?? UserRole.ADMIN);
  const role = roleInput === UserRole.OWNER ? UserRole.OWNER : UserRole.ADMIN;

  if (!storeId) {
    return { message: "Se requiere acceso a la tienda.", status: "error" };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { message: "Ingresa un email valido.", status: "error" };
  }

  const existingUser = await prisma.user.findUnique({
    select: {
      id: true,
      storeId: true,
    },
    where: {
      email,
    },
  });

  if (existingUser?.storeId) {
    return {
      message:
        existingUser.storeId === storeId
          ? "Este usuario ya tiene acceso a la tienda."
          : "Este usuario ya pertenece a otra tienda.",
      status: "error",
    };
  }

  await prisma.storeInvite.upsert({
    create: {
      email,
      role,
      storeId,
    },
    update: {
      acceptedAt: null,
      role,
    },
    where: {
      storeId_email: {
        email,
        storeId,
      },
    },
  });

  revalidateTag(STOREFRONT_CACHE_TAG, 'max');
  revalidatePath("/admin/settings");

  return { message: "Invitacion guardada.", status: "success" };
}

export async function removeStoreInvite(formData: FormData) {
  const session = await requireOwnerSession();
  const storeId = session.user.storeId;
  const inviteId = String(formData.get("inviteId") ?? "");

  if (!storeId || !inviteId) {
    return;
  }

  await prisma.storeInvite.deleteMany({
    where: {
      acceptedAt: null,
      id: inviteId,
      storeId,
    },
  });

  revalidateTag(STOREFRONT_CACHE_TAG, 'max');
  revalidatePath("/admin/settings");
}

export async function removeStoreAdmin(formData: FormData) {
  const session = await requireOwnerSession();
  const storeId = session.user.storeId;
  const userId = String(formData.get("userId") ?? "");

  if (!storeId || !userId) {
    return;
  }

  if (userId === session.user.id) {
    return;
  }

  await prisma.user.updateMany({
    data: {
      storeId: null,
      role: UserRole.ADMIN,
    },
    where: {
      id: userId,
      role: UserRole.ADMIN,
      storeId,
    },
  });

  revalidateTag(STOREFRONT_CACHE_TAG, 'max');
  revalidatePath("/admin/settings");
}

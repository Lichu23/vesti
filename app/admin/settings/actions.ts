"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export type StoreSettingsFormState = {
  message: string;
  status: "idle" | "error" | "success";
};

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
  const session = await requireAdminSession();
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

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/settings");

  return { message: "Configuracion actualizada.", status: "success" };
}

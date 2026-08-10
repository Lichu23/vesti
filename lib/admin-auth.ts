import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

export async function requireAdminSession() {
  const session = await auth();

  if (!session?.user) {
    redirect("/api/auth/signin");
  }

  if (!session.user.storeId) {
    redirect("/");
  }

  if (!["OWNER", "ADMIN"].includes(session.user.role)) {
    redirect("/");
  }

  return session;
}

export async function requireOwnerSession() {
  const session = await requireAdminSession();

  if (session.user.role !== "OWNER") {
    redirect("/admin");
  }

  return session;
}

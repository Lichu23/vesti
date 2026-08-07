import { requireAdminSession } from "@/lib/admin-auth";
import Link from "next/link";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-zinc-500">Thoemia Intimo</p>
      <h1 className="text-3xl font-semibold">Panel admin</h1>
      <p className="text-zinc-600">
        Sesion iniciada como {session.user.email}
      </p>
      <nav className="flex flex-wrap justify-center gap-3">
        <Link
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          href="/admin/categories"
        >
          Manage categories
        </Link>
        <Link
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          href="/admin/brands"
        >
          Manage brands
        </Link>
        <Link
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
          href="/admin/products"
        >
          Manage products
        </Link>
      </nav>
    </main>
  );
}

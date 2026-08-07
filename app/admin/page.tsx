import { requireAdminSession } from "@/lib/admin-auth";

export default async function AdminPage() {
  const session = await requireAdminSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <p className="text-sm text-zinc-500">Thoemia Intimo</p>
      <h1 className="text-3xl font-semibold">Panel admin</h1>
      <p className="text-zinc-600">
        Sesion iniciada como {session.user.email}
      </p>
    </main>
  );
}

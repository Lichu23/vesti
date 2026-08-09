import { BrandForm } from "@/app/admin/brands/brand-form";
import {
  createBrand,
  deleteBrand,
  updateBrand,
} from "@/app/admin/brands/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminBrandsPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;

  if (!storeId) {
    return null;
  }

  const brands = await prisma.brand.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
    },
    where: {
      storeId,
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">Catalogo</p>
        <h1 className="text-3xl font-semibold">Marcas</h1>
        <p className="text-sm text-zinc-600">
          Administra las marcas de productos de la tienda.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Nueva marca</h2>
        <BrandForm action={createBrand} buttonLabel="Crear marca" />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Marcas existentes</h2>

        {brands.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            Todavia no hay marcas.
          </p>
        ) : (
          <div className="grid gap-4">
            {brands.map((brand) => (
              <article
                className="grid gap-4 rounded-xl border p-4"
                key={brand.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{brand.name}</h3>
                    <p className="text-sm text-zinc-500">
                      /{brand.slug}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                    {brand.isActive ? "Activo" : "Oculto"}
                  </span>
                </div>

                <BrandForm
                  action={updateBrand}
                  brand={brand}
                  buttonLabel="Actualizar marca"
                />

                <form action={deleteBrand}>
                  <input name="id" type="hidden" value={brand.id} />
                  <button
                    className="text-sm font-medium text-red-600"
                    type="submit"
                  >
                    Eliminar marca
                  </button>
                </form>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

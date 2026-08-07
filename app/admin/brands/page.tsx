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
        <p className="text-sm text-zinc-500">Phase 2 Catalog</p>
        <h1 className="text-3xl font-semibold">Brands</h1>
        <p className="text-sm text-zinc-600">
          Manage product brands for the storefront.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">New brand</h2>
        <BrandForm action={createBrand} buttonLabel="Create brand" />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Existing brands</h2>

        {brands.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            No brands yet.
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
                    {brand.isActive ? "Active" : "Hidden"}
                  </span>
                </div>

                <BrandForm
                  action={updateBrand}
                  brand={brand}
                  buttonLabel="Update brand"
                />

                <form action={deleteBrand}>
                  <input name="id" type="hidden" value={brand.id} />
                  <button
                    className="text-sm font-medium text-red-600"
                    type="submit"
                  >
                    Delete brand
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

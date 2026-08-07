import { CategoryForm } from "@/app/admin/categories/category-form";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/categories/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminCategoriesPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;

  if (!storeId) {
    return null;
  }

  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      isActive: true,
      sortOrder: true,
    },
    where: {
      storeId,
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-8">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">Phase 2 Catalog</p>
        <h1 className="text-3xl font-semibold">Categories</h1>
        <p className="text-sm text-zinc-600">
          Manage storefront groups for products.
        </p>
      </header>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">New category</h2>
        <CategoryForm action={createCategory} buttonLabel="Create category" />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Existing categories</h2>

        {categories.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            No categories yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => (
              <article
                className="grid gap-4 rounded-xl border p-4"
                key={category.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-zinc-500">
                      /{category.slug}
                    </p>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                    {category.isActive ? "Active" : "Hidden"}
                  </span>
                </div>

                <CategoryForm
                  action={updateCategory}
                  buttonLabel="Update category"
                  category={category}
                />

                <form action={deleteCategory}>
                  <input name="id" type="hidden" value={category.id} />
                  <button
                    className="text-sm font-medium text-red-600"
                    type="submit"
                  >
                    Delete category
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

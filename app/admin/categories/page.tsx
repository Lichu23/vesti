import {
  AdminEmptyState,
  AdminPagination,
  AdminShell,
  TrashIcon,
} from "@/app/admin/admin-ui";
import { CategoryModal } from "@/app/admin/categories/category-modal";
import { ConfirmActionForm } from "@/app/admin/confirm-action-form";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/app/admin/categories/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import Image from "next/image";

type AdminCategoriesPageProps = {
  searchParams: Promise<{
    pagina?: string | string[];
  }>;
};

const categoriesPerPage = 9;

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getPageParam(value?: string | string[]) {
  const page = Number.parseInt(getSingleParam(value) ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminCategoriesPage({
  searchParams,
}: AdminCategoriesPageProps) {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const params = await searchParams;
  const currentPage = getPageParam(params.pagina);

  if (!storeId) {
    return null;
  }

  const [store, categoryCount] = await Promise.all([
    prisma.store.findUnique({
      select: {
        name: true,
      },
      where: {
        id: storeId,
      },
    }),
    prisma.category.count({
      where: {
        storeId,
      },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(categoryCount / categoriesPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const categories = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: {
      id: true,
      isActive: true,
      name: true,
      products: {
        orderBy: [{ updatedAt: "desc" }],
        select: {
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              alt: true,
              url: true,
            },
            take: 1,
          },
        },
        take: 1,
        where: {
          isActive: true,
        },
      },
      slug: true,
      _count: {
        select: {
          products: true,
        },
      },
    },
    where: {
      storeId,
    },
    skip: (safeCurrentPage - 1) * categoriesPerPage,
    take: categoriesPerPage,
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("[admin categories]", {
      page: safeCurrentPage,
      pageSize: categoriesPerPage,
      returnedCategories: categories.length,
      totalCategories: categoryCount,
    });
  }

  return (
    <AdminShell>
      <div className="space-y-2">
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
          Panel de inventario
        </h1>
        <p className="text-lg text-muted-foreground">
          Administra los productos y colecciones de{" "}
          {store?.name ?? "Thoemia Intimo"}.
        </p>
      </div>

      <section className="space-y-8">
        <div className="grid gap-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-lg text-muted-foreground">
            {categoryCount} colecciones
          </p>
          <CategoryModal
            action={createCategory}
            buttonLabel="Crear categoria"
            description="Crea una coleccion para organizar los productos."
            title="Nueva categoria"
            trigger={{ label: "Nueva categoria", type: "button" }}
          />
        </div>

        {categories.length === 0 ? (
          <AdminEmptyState
            action={
              <CategoryModal
                action={createCategory}
                buttonLabel="Crear categoria"
                description="Crea una coleccion para organizar los productos."
                title="Nueva categoria"
                trigger={{ label: "Crear categoria", type: "button" }}
              />
            }
            description="Crea tu primera categoria para organizar el catalogo."
            title="Todavia no hay categorias"
          />
        ) : (
          <div className="grid gap-5 xl:grid-cols-3">
            {categories.map((category) => {
              const image = category.products[0]?.images[0];

              return (
                <article
                  className="grid gap-4 rounded-[4px] border border-border bg-card p-4 sm:grid-cols-[80px_minmax(0,1fr)_auto] sm:items-center sm:gap-5 sm:p-5"
                  key={category.id}
                >
                  {image ? (
                        <div className="relative aspect-square overflow-hidden rounded-[4px] bg-muted">
                          <Image alt={image.alt ?? category.name} className="object-cover" fill sizes="(max-width: 640px) 50vw, 180px" src={image.url} />
                        </div>
                  ) : (
                    <div className="flex aspect-square items-center justify-center rounded-[4px] bg-muted text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Sin imagen
                    </div>
                  )}

                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-2xl leading-tight text-foreground">
                      {category.name}
                    </h2>
                    {!category.isActive ? (
                      <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Oculta
                      </span>
                    ) : null}
                    <p className="mt-1 text-sm text-muted-foreground">
                      {category._count.products} productos
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-4 border-t border-border pt-3 text-muted-foreground sm:flex-col sm:border-t-0 sm:pt-0">
                    <CategoryModal
                      action={updateCategory}
                      buttonLabel="Actualizar categoria"
                      category={category}
                      description="Actualiza nombre y visibilidad."
                      title="Editar categoria"
                      trigger={{
                        label: `Editar ${category.name}`,
                        type: "icon",
                      }}
                    />
                    <ConfirmActionForm
                      action={deleteCategory}
                      ariaLabel={`Eliminar ${category.name}`}
                      buttonClassName="cursor-pointer transition hover:text-destructive"
                      buttonContent={<TrashIcon />}
                      confirmMessage={`¿Eliminar ${category.name}? Si contiene productos, se ocultara en lugar de borrar sus relaciones.`}
                      fields={{ id: category.id }}
                    />
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <AdminPagination
          basePath="/admin/categories"
          currentPage={safeCurrentPage}
          totalPages={totalPages}
        />
      </section>
    </AdminShell>
  );
}

import {
  AdminEmptyState,
  AdminPagination,
  AdminShell,
  formatAdminPrice,
} from "@/app/admin/admin-ui";
import { AdminProductsFilterForm } from "@/app/admin/products/admin-products-filter-form";
import { ProductModal } from "@/app/admin/products/product-modal";
import {
  ProductDeleteForm,
  ProductDeleteProvider,
} from "@/app/admin/products/product-delete-form";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/admin/products/actions";
import Image from "next/image";
import {
  parseProductSort,
  parseProductStockFilter,
} from "@/app/admin/products/products-filters";
import { requireAdminSession } from "@/lib/admin-auth";
import { LOW_STOCK_THRESHOLD } from "@/lib/admin-dashboard";
import { prisma } from "@/lib/prisma";

type AdminProductsPageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
    ordenar?: string | string[];
    pagina?: string | string[];
    stock?: string | string[];
  }>;
};

const productsPerPage = 10;

function getSingleParam(value?: string | string[]) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getProductStock(product: {
  variants: {
    stock: number;
  }[];
}) {
  return product.variants.reduce((total, variant) => total + variant.stock, 0);
}

// Same rule as the dashboard: an active variant with few units left.
function getStockStatus(product: {
  variants: {
    isActive: boolean;
    stock: number;
  }[];
}) {
  if (getProductStock(product) === 0) {
    return { className: "bg-destructive/10 text-destructive", label: "Sin stock" };
  }

  const isLow = product.variants.some(
    (variant) => variant.isActive && variant.stock <= LOW_STOCK_THRESHOLD,
  );

  return isLow
    ? { className: "bg-amber-50 text-amber-900", label: "Stock bajo" }
    : { className: "bg-secondary text-foreground", label: "En stock" };
}

function getPageParam(value?: string | string[]) {
  const page = Number.parseInt(getSingleParam(value) ?? "1", 10);

  return Number.isFinite(page) && page > 0 ? page : 1;
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;
  const params = await searchParams;
  const query = getSingleParam(params.buscar)?.trim();
  const categoryId = getSingleParam(params.categoria);
  const currentPage = getPageParam(params.pagina);
  const sort = parseProductSort(getSingleParam(params.ordenar));
  const stockFilter = parseProductStockFilter(getSingleParam(params.stock));

  if (!storeId) {
    return null;
  }

  const productWhere = {
    ...(categoryId ? { categoryId } : {}),
    ...(stockFilter === "bajo"
      ? {
          isActive: true,
          variants: {
            some: {
              isActive: true,
              stock: { lte: LOW_STOCK_THRESHOLD },
            },
          },
        }
      : {}),
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" as const } },
            {
              category: {
                name: {
                  contains: query,
                  mode: "insensitive" as const,
                },
              },
            },
          ],
        }
      : {}),
    storeId,
  };

  const [categories, productCount, totalProductCount] =
    await Promise.all([
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
        },
        where: {
          storeId,
        },
      }),
      prisma.product.count({
        where: productWhere,
      }),
      prisma.product.count({
        where: {
          storeId,
        },
      }),
    ]);
  const totalPages = Math.max(1, Math.ceil(productCount / productsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const products = await prisma.product.findMany({
    include: {
      category: {
        select: {
          name: true,
        },
      },
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          alt: true,
          sortOrder: true,
          url: true,
        },
      },
      variants: {
        orderBy: [{ size: "asc" }, { color: "asc" }],
        select: {
          id: true,
          color: true,
          isActive: true,
          price: true,
          size: true,
          sku: true,
          stock: true,
        },
      },
    },
    orderBy: sort
      ? [{ basePrice: sort === "price-asc" ? "asc" : "desc" }, { name: "asc" }]
      : [{ name: "asc" }],
    skip: (safeCurrentPage - 1) * productsPerPage,
    take: productsPerPage,
    where: productWhere,
  });

  if (process.env.NODE_ENV !== "production") {
    console.info("[admin products]", {
      page: safeCurrentPage,
      pageSize: productsPerPage,
      returnedProducts: products.length,
      totalProducts: productCount,
    });
  }

  return (
    <AdminShell>
      <h1 className="font-serif text-3xl leading-tight text-foreground max-sm:mb-4 sm:text-5xl">
        Panel de inventario
      </h1>
      {categories.length === 0 ? (
        <p className="rounded-[4px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Crea al menos una categoria antes de crear productos.
        </p>
      ) : null}

      <ProductDeleteProvider action={deleteProduct}>
        <section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
          <AdminProductsFilterForm
            categories={categories}
            categoryId={categoryId}
            query={query}
            sort={sort}
            stock={stockFilter}
          />

          <ProductModal
            action={createProduct}
            buttonLabel="Crear producto"
            categories={categories}
            description="Crea el producto base desde una ventana dedicada."
            title="Nuevo producto"
            trigger={{ label: "Nuevo producto", type: "button" }}
          />
        </div>

        <div className="overflow-hidden rounded-[4px] border border-border bg-card">
          <div className="hidden grid-cols-[minmax(320px,1.7fr)_180px_140px_140px_110px] border-b border-border px-5 py-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground md:grid">
            <span>Producto</span>
            <span>Categoria</span>
            <span>Precio</span>
            <span>Stock</span>
            <span className="text-right">Acciones</span>
          </div>

          {products.length === 0 ? (
            <div className="p-5">
              {totalProductCount === 0 ? (
                <AdminEmptyState
                  action={
                    <ProductModal
                      action={createProduct}
                      buttonLabel="Crear producto"
                      categories={categories}
                      description="Crea el producto base desde una ventana dedicada."
                      title="Nuevo producto"
                      trigger={{ label: "Crear producto", type: "button" }}
                    />
                  }
                  description="Crea tu primer producto para empezar a cargar el catalogo."
                  title="Todavia no hay productos"
                />
              ) : (
                <AdminEmptyState
                  action={null}
                  description="Proba cambiar la busqueda, la categoria o los filtros."
                  title="No hay productos para mostrar"
                />
              )}
            </div>
          ) : (
            <div>
              {products.map((product) => {
                const image = product.images[0];
                const stockStatus = getStockStatus(product);

                return (
                  <article
                    className="grid min-w-0 gap-4 border-b border-border p-4 last:border-b-0 md:grid-cols-[minmax(320px,1.7fr)_180px_140px_140px_110px] md:items-center md:px-5 md:py-4"
                    key={product.id}
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      {image ? (
                        <div
                          aria-label={image.alt ?? product.name}
                            className="relative size-16 overflow-hidden rounded-[4px] bg-muted"
                          >
                            <Image alt={image.alt ?? product.name} className="object-cover" fill sizes="64px" src={image.url} />
                          </div>
                      ) : (
                        <div className="flex size-16 items-center justify-center rounded-[4px] bg-muted text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                          Sin imagen
                        </div>
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-semibold text-foreground">
                          {product.name}
                        </h2>
                        {!product.isActive ? (
                          <span className="mt-1 inline-flex rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                            Oculto
                          </span>
                        ) : null}
                        <p className="text-sm text-muted-foreground">
                          Talle: {product.sizeDisplayText ?? "Unico"}
                        </p>
                      </div>
                    </div>

                    <div className="grid min-w-0 gap-3 text-sm md:contents">
                      <p className="flex items-center justify-between gap-3 text-muted-foreground md:block">
                        <span className="font-medium text-foreground md:hidden">
                          Categoria
                        </span>
                        {product.category.name}
                      </p>
                      <p className="flex items-center justify-between gap-3 md:block">
                        <span className="font-medium text-foreground md:hidden">
                          Precio
                        </span>
                        <span className="font-serif text-xl text-foreground">
                          {formatAdminPrice(Number(product.basePrice))}
                        </span>
                      </p>
                      <p className="flex items-center justify-between gap-3 md:block">
                        <span className="font-medium text-foreground md:hidden">
                          Stock
                        </span>
                        <span
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${stockStatus.className}`}
                        >
                          {stockStatus.label}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-4 border-t border-border pt-3 text-muted-foreground md:border-t-0 md:pt-0">
                      <ProductModal
                        action={updateProduct}
                        buttonLabel="Actualizar producto"
                        categories={categories}
                        description="Edita el producto, sus variantes y el stock."
                        product={{
                          id: product.id,
                          name: product.name,
                          categoryId: product.categoryId,
                          modelCode: product.modelCode,
                          description: product.description,
                          audience: product.audience,
                          basePrice: product.basePrice.toString(),
                          saleUnit: product.saleUnit,
                          colorMode: product.colorMode,
                          sizeDisplayText: product.sizeDisplayText,
                          isFeatured: product.isFeatured,
                          isActive: product.isActive,
                          variants: product.variants.map((variant) => ({
                            id: variant.id,
                            color: variant.color,
                            isActive: variant.isActive,
                            price: variant.price?.toString() ?? null,
                            size: variant.size,
                            sku: variant.sku,
                            stock: variant.stock,
                          })),
                          image: product.images[0]
                            ? {
                                alt: product.images[0].alt,
                                url: product.images[0].url,
                              }
                            : null,
                        }}
                        title="Editar producto"
                        trigger={{
                          label: `Editar ${product.name}`,
                          type: "icon",
                        }}
                      />
                      <ProductDeleteForm
                        productId={product.id}
                        productName={product.name}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <AdminPagination
          basePath="/admin/products"
          currentPage={safeCurrentPage}
          searchParams={{
            buscar: query,
            categoria: categoryId,
            ordenar: sort,
            stock: stockFilter,
          }}
          totalPages={totalPages}
        />
        </section>
      </ProductDeleteProvider>
    </AdminShell>
  );
}

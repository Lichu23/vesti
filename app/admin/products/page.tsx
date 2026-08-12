import {
  AdminEmptyState,
  AdminPagination,
  AdminShell,
  formatAdminPrice,
  TrashIcon,
} from "@/app/admin/admin-ui";
import { AdminProductsFilterForm } from "@/app/admin/products/admin-products-filter-form";
import { ProductModal } from "@/app/admin/products/product-modal";
import {
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductVariant,
  updateProduct,
  updateProductVariant,
  adjustInventory,
} from "@/app/admin/products/actions";
import { InventoryAdjustmentForm } from "@/app/admin/products/inventory-adjustment-form";
import {
  ProductVariantDeleteForm,
  ProductVariantForm,
} from "@/app/admin/products/product-variant-form";
import Image from "next/image";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type AdminProductsPageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
    pagina?: string | string[];
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

function getStockLabel(stock: number) {
  return stock > 0 ? "En stock" : "Sin stock";
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

  if (!storeId) {
    return null;
  }

  const productWhere = {
    ...(categoryId ? { categoryId } : {}),
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

  const [store, categories, productCount, totalProductCount] =
    await Promise.all([
      prisma.store.findUnique({
        select: {
          name: true,
        },
        where: {
          id: storeId,
        },
      }),
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
          inventoryMovements: {
            orderBy: [{ createdAt: "desc" }],
            select: {
              id: true,
              createdAt: true,
              quantity: true,
              reason: true,
              type: true,
            },
            take: 5,
          },
          isActive: true,
          price: true,
          size: true,
          sku: true,
          stock: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
    skip: (safeCurrentPage - 1) * productsPerPage,
    take: productsPerPage,
    where: productWhere,
  });

  return (
    <AdminShell activeSection="products">
      <div className="space-y-2">
        <h1 className="font-serif text-3xl leading-tight text-foreground sm:text-5xl">
          Panel de inventario
        </h1>
        <p className="text-lg text-muted-foreground">
          Administra los productos y colecciones de{" "}
          {store?.name ?? "Thoemia Intimo"}.
        </p>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-[4px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Crea al menos una categoria antes de crear productos.
        </p>
      ) : null}

      <section className="space-y-6">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
          <AdminProductsFilterForm
            categories={categories}
            categoryId={categoryId}
            query={query}
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
                  description="Proba cambiar la busqueda o elegir otra categoria."
                  title="No hay productos para mostrar"
                />
              )}
            </div>
          ) : (
            <div>
              {products.map((product) => {
                const image = product.images[0];
                const stock = getProductStock(product);

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
                          className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                            stock > 0
                              ? "bg-secondary text-foreground"
                              : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {getStockLabel(stock)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center justify-end gap-4 border-t border-border pt-3 text-muted-foreground md:border-t-0 md:pt-0">
                      <ProductModal
                        action={updateProduct}
                        buttonLabel="Actualizar producto"
                        categories={categories}
                        description="Edita la informacion base del producto."
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
                      >
                        <section className="grid gap-3 rounded-[4px] bg-muted p-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold">Variantes</h4>
                            <p className="text-sm text-muted-foreground">
                              Carga talles, colores, precios y stock por
                              variante.
                            </p>
                          </div>

                          {product.variants.length === 0 ? (
                            <p className="rounded-[4px] border bg-card p-3 text-sm text-muted-foreground">
                              Todavia no hay variantes.
                            </p>
                          ) : (
                            <div className="grid gap-3">
                              {product.variants.map((variant) => (
                                <article
                                  className="grid gap-3 rounded-[4px] border bg-card p-3"
                                  key={variant.id}
                                >
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1 text-sm">
                                      <p className="font-medium">
                                        {variant.size}
                                        {variant.color
                                          ? ` - ${variant.color}`
                                          : ""}
                                      </p>
                                      <p className="text-muted-foreground">
                                        Stock: {variant.stock}
                                        {variant.price
                                          ? ` - ${formatAdminPrice(Number(variant.price))}`
                                          : " - Usa precio base"}
                                      </p>
                                      {variant.sku ? (
                                        <p className="text-muted-foreground">
                                          SKU: {variant.sku}
                                        </p>
                                      ) : null}
                                    </div>
                                    <span className="rounded-full bg-secondary px-3 py-1 text-xs">
                                      {variant.isActive ? "Activo" : "Oculto"}
                                    </span>
                                  </div>

                                  <ProductVariantForm
                                    action={updateProductVariant}
                                    buttonLabel="Actualizar variante"
                                    colorMode={product.colorMode}
                                    productId={product.id}
                                    stockLocked
                                    variant={{
                                      id: variant.id,
                                      size: variant.size,
                                      color: variant.color,
                                      stock: variant.stock,
                                      isActive: variant.isActive,
                                      sku: variant.sku,
                                      price: variant.price?.toString() ?? null,
                                    }}
                                  />

                                  <ProductVariantDeleteForm
                                    action={deleteProductVariant}
                                    productId={product.id}
                                    variantId={variant.id}
                                  />

                                  <section className="grid gap-3 rounded-[4px] bg-background p-3">
                                    <div className="space-y-1">
                                      <h5 className="text-sm font-semibold">
                                        Inventario
                                      </h5>
                                      <p className="text-xs text-muted-foreground">
                                        Agrega ajustes manuales positivos o
                                        negativos.
                                      </p>
                                    </div>

                                    <InventoryAdjustmentForm
                                      action={adjustInventory}
                                      productId={product.id}
                                      variantId={variant.id}
                                    />

                                    {variant.inventoryMovements.length ===
                                    0 ? (
                                      <p className="text-sm text-muted-foreground">
                                        Sin movimientos recientes.
                                      </p>
                                    ) : (
                                      <div className="grid gap-2">
                                        {variant.inventoryMovements.map(
                                          (movement) => (
                                            <div
                                              className="flex flex-wrap items-center justify-between gap-2 rounded-[4px] border bg-card p-2 text-sm"
                                              key={movement.id}
                                            >
                                              <div>
                                                <p className="font-medium">
                                                  {movement.quantity > 0
                                                    ? "+"
                                                    : ""}
                                                  {movement.quantity}{" "}
                                                  <span className="text-muted-foreground">
                                                    Ajuste manual
                                                  </span>
                                                </p>
                                                {movement.reason ? (
                                                  <p className="text-muted-foreground">
                                                    {movement.reason}
                                                  </p>
                                                ) : null}
                                              </div>
                                              <time className="text-xs text-muted-foreground">
                                                {movement.createdAt.toLocaleString(
                                                  "en-US",
                                                )}
                                              </time>
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    )}
                                  </section>
                                </article>
                              ))}
                            </div>
                          )}

                          <details className="rounded-lg border bg-card p-3">
                            <summary className="flex cursor-pointer list-none items-center gap-2 text-primary">
                              <span
                                aria-hidden="true"
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary text-sm leading-none"
                              >
                                +
                              </span>
                              Crear variantes
                            </summary>
                            <div className="mt-3">
                              <ProductVariantForm
                                action={createProductVariant}
                                buttonLabel="Crear variante"
                                colorMode={product.colorMode}
                                productId={product.id}
                              />
                            </div>
                          </details>
                        </section>

                      </ProductModal>
                      <form action={deleteProduct}>
                        <input name="id" type="hidden" value={product.id} />
                        <button
                          aria-label={`Eliminar ${product.name}`}
                          className="cursor-pointer transition hover:text-destructive"
                          type="submit"
                        >
                          <TrashIcon />
                        </button>
                      </form>
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
          }}
          totalPages={totalPages}
        />
      </section>
    </AdminShell>
  );
}

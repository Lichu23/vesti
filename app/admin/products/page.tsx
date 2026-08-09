import {
  AdminEmptyState,
  AdminPagination,
  AdminShell,
  formatAdminPrice,
  InventoryStats,
  SearchIcon,
  TrashIcon,
} from "@/app/admin/admin-ui";
import { ProductModal } from "@/app/admin/products/product-modal";
import {
  createProduct,
  createProductVariant,
  deleteProduct,
  deleteProductImage,
  deleteProductVariant,
  updateProduct,
  updateProductVariant,
  adjustInventory,
} from "@/app/admin/products/actions";
import { InventoryAdjustmentForm } from "@/app/admin/products/inventory-adjustment-form";
import { ProductImageForm } from "@/app/admin/products/product-image-form";
import {
  ProductVariantDeleteForm,
  ProductVariantForm,
} from "@/app/admin/products/product-variant-form";
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
            {
              brand: {
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

  const [store, categories, brands, metricProducts, productCount] =
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
      prisma.brand.findMany({
        orderBy: [{ name: "asc" }],
        select: {
          id: true,
          name: true,
        },
        where: {
          storeId,
        },
      }),
      prisma.product.findMany({
        select: {
          basePrice: true,
          variants: {
            select: {
              price: true,
              stock: true,
            },
            where: {
              isActive: true,
            },
          },
        },
        where: {
          storeId,
        },
      }),
      prisma.product.count({
        where: productWhere,
      }),
    ]);
  const totalPages = Math.max(1, Math.ceil(productCount / productsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const products = await prisma.product.findMany({
    include: {
      brand: {
        select: {
          name: true,
        },
      },
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

  const outOfStockCount = metricProducts.filter(
    (product) =>
      product.variants.length === 0 ||
      product.variants.every((variant) => variant.stock <= 0),
  ).length;
  const stockValue = metricProducts.reduce(
    (productTotal, product) =>
      productTotal +
      product.variants.reduce(
        (variantTotal, variant) =>
          variantTotal +
          variant.stock * Number(variant.price ?? product.basePrice),
        0,
      ),
    0,
  );

  return (
    <AdminShell activeSection="products">
      <div className="space-y-2">
        <h1 className="font-serif text-4xl leading-tight text-foreground sm:text-5xl">
          Panel de inventario
        </h1>
        <p className="text-lg text-muted-foreground">
          Administra los productos y colecciones de{" "}
          {store?.name ?? "Thoemia Intimo"}.
        </p>
      </div>

      <InventoryStats
        categoryCount={categories.length}
        outOfStockCount={outOfStockCount}
        productCount={metricProducts.length}
        stockValue={stockValue}
      />

      {categories.length === 0 ? (
        <p className="rounded-[4px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Crea al menos una categoria antes de crear productos.
        </p>
      ) : null}

      <section className="space-y-6">
        <form className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_220px_auto_auto]">
          <label className="flex min-h-14 items-center gap-3 rounded-full border border-border bg-card px-5 text-muted-foreground">
            <SearchIcon />
            <input
              className="min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
              defaultValue={query}
              name="buscar"
              placeholder="Buscar por nombre, marca o categoria..."
              type="search"
            />
          </label>

          <select
            className="min-h-14 cursor-pointer rounded-full border border-border bg-card px-5 text-base text-foreground outline-none"
            defaultValue={categoryId ?? ""}
            name="categoria"
          >
            <option value="">Todas las categorias</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          <button
            className="inline-flex min-h-14 cursor-pointer items-center justify-center rounded-full border border-border bg-card px-6 text-sm font-semibold text-foreground transition hover:border-primary"
            type="submit"
          >
            Filtrar
          </button>

          <ProductModal
            action={createProduct}
            brands={brands}
            buttonLabel="Crear producto"
            categories={categories}
            description="Crea el producto base desde una ventana dedicada."
            title="Nuevo producto"
            trigger={{ label: "Nuevo producto", type: "button" }}
          />
        </form>

        <div className="overflow-x-auto rounded-[4px] border border-border bg-card">
          <div className="grid grid-cols-[minmax(320px,1.7fr)_180px_180px_140px_140px_110px] border-b border-border px-5 py-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Producto</span>
            <span>Categoria</span>
            <span>Marca</span>
            <span>Precio</span>
            <span>Stock</span>
            <span className="text-right">Acciones</span>
          </div>

          {products.length === 0 ? (
            <div className="p-5">
              {metricProducts.length === 0 ? (
                <AdminEmptyState
                  action={
                    <ProductModal
                      action={createProduct}
                      brands={brands}
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
                    className="grid grid-cols-[minmax(320px,1.7fr)_180px_180px_140px_140px_110px] items-center border-b border-border px-5 py-4 last:border-b-0"
                    key={product.id}
                  >
                    <div className="flex items-center gap-4">
                      {image ? (
                        <div
                          aria-label={image.alt ?? product.name}
                          className="size-16 rounded-[4px] bg-muted bg-cover bg-center"
                          role="img"
                          style={{ backgroundImage: `url(${image.url})` }}
                        />
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

                    <span className="text-muted-foreground">
                      {product.category.name}
                    </span>
                    <span className="text-muted-foreground">
                      {product.brand?.name ?? "Thoemia"}
                    </span>
                    <span className="font-serif text-xl text-foreground">
                      {formatAdminPrice(Number(product.basePrice))}
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
                    <div className="flex justify-end gap-4 text-muted-foreground">
                      <ProductModal
                        action={updateProduct}
                        brands={brands}
                        buttonLabel="Actualizar producto"
                        categories={categories}
                        description="Edita la informacion base del producto."
                        product={{
                          id: product.id,
                          name: product.name,
                          categoryId: product.categoryId,
                          brandId: product.brandId,
                          modelCode: product.modelCode,
                          description: product.description,
                          audience: product.audience,
                          basePrice: product.basePrice.toString(),
                          saleUnit: product.saleUnit,
                          packQuantity: product.packQuantity,
                          colorMode: product.colorMode,
                          sizeDisplayText: product.sizeDisplayText,
                          isFeatured: product.isFeatured,
                          isActive: product.isActive,
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

                          <ProductVariantForm
                            action={createProductVariant}
                            buttonLabel="Crear variante"
                            colorMode={product.colorMode}
                            productId={product.id}
                          />
                        </section>

                        <section className="grid gap-3 rounded-[4px] bg-muted p-4">
                          <div className="space-y-1">
                            <h4 className="font-semibold">Imagenes</h4>
                            <p className="text-sm text-muted-foreground">
                              Carga imagenes del producto.
                            </p>
                          </div>

                          {product.images.length === 0 ? (
                            <p className="rounded-[4px] border bg-card p-3 text-sm text-muted-foreground">
                              Todavia no hay imagenes.
                            </p>
                          ) : (
                            <div className="grid gap-3 md:grid-cols-2">
                              {product.images.map((image) => (
                                <article
                                  className="grid gap-3 rounded-[4px] border bg-card p-3"
                                  key={image.id}
                                >
                                  <div
                                    aria-label={image.alt ?? product.name}
                                    className="aspect-square w-full rounded-[4px] bg-muted bg-cover bg-center"
                                    role="img"
                                    style={{
                                      backgroundImage: `url(${image.url})`,
                                    }}
                                  />
                                  <div className="space-y-1 text-sm">
                                    <p className="break-all text-muted-foreground">
                                      {image.url}
                                    </p>
                                    <p className="text-muted-foreground">
                                      Orden: {image.sortOrder}
                                    </p>
                                    {image.alt ? (
                                      <p className="text-muted-foreground">
                                        Alt: {image.alt}
                                      </p>
                                    ) : null}
                                  </div>
                                  <form action={deleteProductImage}>
                                    <input
                                      name="id"
                                      type="hidden"
                                      value={image.id}
                                    />
                                    <button
                                      className="cursor-pointer text-sm font-medium text-destructive"
                                      type="submit"
                                    >
                                      Eliminar imagen
                                    </button>
                                  </form>
                                </article>
                              ))}
                            </div>
                          )}

                          <ProductImageForm productId={product.id} />
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

import { ProductForm } from "@/app/admin/products/product-form";
import { ProductImageForm } from "@/app/admin/products/product-image-form";
import {
  createProduct,
  deleteProduct,
  deleteProductImage,
  updateProduct,
} from "@/app/admin/products/actions";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminProductsPage() {
  const session = await requireAdminSession();
  const storeId = session.user.storeId;

  if (!storeId) {
    return null;
  }

  const [categories, brands, products] = await Promise.all([
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
      },
      orderBy: [{ name: "asc" }],
      where: {
        storeId,
      },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-8">
      <header className="space-y-2">
        <p className="text-sm text-zinc-500">Phase 2 Catalog</p>
        <h1 className="text-3xl font-semibold">Products</h1>
        <p className="text-sm text-zinc-600">
          Manage storefront products and product images. Variants come in a
          later slice.
        </p>
      </header>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Create at least one category before creating products.
        </p>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">New product</h2>
        <ProductForm
          action={createProduct}
          brands={brands}
          buttonLabel="Create product"
          categories={categories}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="text-xl font-semibold">Existing products</h2>

        {products.length === 0 ? (
          <p className="rounded-xl border p-4 text-sm text-zinc-600">
            No products yet.
          </p>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <article
                className="grid gap-4 rounded-xl border p-4"
                key={product.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-zinc-500">/{product.slug}</p>
                    <p className="text-sm text-zinc-600">
                      {product.category.name}
                      {product.brand ? ` - ${product.brand.name}` : ""}
                    </p>
                    <p className="text-sm text-zinc-600">
                      {product.audience} - ${product.basePrice.toString()} - {product.saleUnit}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
                      {product.isActive ? "Active" : "Hidden"}
                    </span>
                    {product.isFeatured ? (
                      <span className="rounded-full bg-zinc-900 px-3 py-1 text-xs text-white">
                        Featured
                      </span>
                    ) : null}
                  </div>
                </div>

                <ProductForm
                  action={updateProduct}
                  brands={brands}
                  buttonLabel="Update product"
                  categories={categories}
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
                />

                <section className="grid gap-3 rounded-xl bg-zinc-50 p-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold">Images</h4>
                    <p className="text-sm text-zinc-600">
                      Upload a product image or add an image URL.
                    </p>
                  </div>

                  {product.images.length === 0 ? (
                    <p className="rounded-lg border bg-white p-3 text-sm text-zinc-600">
                      No images yet.
                    </p>
                  ) : (
                    <div className="grid gap-3 md:grid-cols-2">
                      {product.images.map((image) => (
                        <article
                          className="grid gap-3 rounded-lg border bg-white p-3"
                          key={image.id}
                        >
                          <div
                            aria-label={image.alt ?? product.name}
                            className="aspect-square w-full rounded-md bg-zinc-100 bg-cover bg-center"
                            role="img"
                            style={{ backgroundImage: `url(${image.url})` }}
                          />
                          <div className="space-y-1 text-sm">
                            <p className="break-all text-zinc-600">
                              {image.url}
                            </p>
                            <p className="text-zinc-500">
                              Sort order: {image.sortOrder}
                            </p>
                            {image.alt ? (
                              <p className="text-zinc-500">
                                Alt: {image.alt}
                              </p>
                            ) : null}
                          </div>
                          <form action={deleteProductImage}>
                            <input name="id" type="hidden" value={image.id} />
                            <button
                              className="text-sm font-medium text-red-600"
                              type="submit"
                            >
                              Delete image
                            </button>
                          </form>
                        </article>
                      ))}
                    </div>
                  )}

                  <ProductImageForm productId={product.id} />
                </section>

                <form action={deleteProduct}>
                  <input name="id" type="hidden" value={product.id} />
                  <button
                    className="text-sm font-medium text-red-600"
                    type="submit"
                  >
                    Delete product
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

import { ProductForm } from "@/app/admin/products/product-form";
import {
  createProduct,
  deleteProduct,
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
          Manage storefront products. Images and variants come in later slices.
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

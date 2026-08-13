import { unstable_cache } from "next/cache";
import { notFound } from "next/navigation";
import { cache } from "react";

import { Audience, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type StorefrontHomeFilters = {
  audience?: Audience;
  categorySlug?: string;
  page?: number;
  query?: string;
  sort?: string;
};

export const STOREFRONT_PAGE_SIZE = 15;
export const STOREFRONT_CACHE_TAG = "storefront-catalog";

const storefrontAudiences = [Audience.WOMEN, Audience.MEN, Audience.KIDS] as const;

export const getPrimaryStore = cache(async () => {
  return prisma.store.findFirst({
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      whatsapp: true,
    },
    where: {
      isActive: true,
    },
  });
});

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  saleUnit: true,
  sizeDisplayText: true,
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  images: {
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      alt: true,
      url: true,
    },
    take: 1,
  },
  variants: {
    orderBy: [{ size: "asc" }, { color: "asc" }],
    select: {
      color: true,
      id: true,
      price: true,
      size: true,
      stock: true,
    },
    where: {
      isActive: true,
    },
  },
} satisfies Prisma.ProductSelect;

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  _count: {
    select: {
      products: {
        where: {
          isActive: true,
        },
      },
    },
  },
} satisfies Prisma.CategorySelect;

function getProductOrderBy(sort?: string): Prisma.ProductOrderByWithRelationInput[] {
  if (sort === "newest") {
    return [{ updatedAt: "desc" as const }];
  }

  if (sort === "price-asc") {
    return [{ basePrice: "asc" as const }, { name: "asc" as const }];
  }

  if (sort === "price-desc") {
    return [{ basePrice: "desc" as const }, { name: "asc" as const }];
  }

  return [{ isFeatured: "desc" as const }, { updatedAt: "desc" as const }];
}

async function getStorefrontHomeUncached(filters: StorefrontHomeFilters = {}) {
  const startedAt = performance.now();
  const store = await getPrimaryStore();
  const query = filters.query?.trim();
  const page = Math.max(1, filters.page ?? 1);

  if (!store) {
    return {
      activeCategory: null,
      audienceCategories: {
        [Audience.WOMEN]: [],
        [Audience.MEN]: [],
        [Audience.KIDS]: [],
      },
      categories: [],
      products: [],
      totalProducts: 0,
      store: null,
    };
  }

  const [categories, products, totalProducts, activeCategory, ...audienceCategoryLists] =
    await Promise.all([
    prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        _count: {
          select: {
            products: {
              where: {
                ...(filters.audience ? { audience: filters.audience } : {}),
                isActive: true,
              },
            },
          },
        },
      },
      where: {
        isActive: true,
        ...(filters.audience
          ? {
              products: {
                some: {
                  audience: filters.audience,
                  isActive: true,
                },
              },
            }
          : {}),
        storeId: store.id,
      },
    }),
    prisma.product.findMany({
      orderBy: getProductOrderBy(filters.sort),
      select: productSelect,
      skip: (page - 1) * STOREFRONT_PAGE_SIZE,
      take: STOREFRONT_PAGE_SIZE,
      where: {
        ...(filters.categorySlug
          ? {
              category: {
                isActive: true,
                slug: filters.categorySlug,
              },
            }
          : {
              category: {
                isActive: true,
              },
            }),
        ...(filters.audience ? { audience: filters.audience } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                {
                  description: {
                    contains: query,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
        isActive: true,
        storeId: store.id,
      },
    }),
    prisma.product.count({
      where: {
        ...(filters.categorySlug
          ? { category: { isActive: true, slug: filters.categorySlug } }
          : { category: { isActive: true } }),
        ...(filters.audience ? { audience: filters.audience } : {}),
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" as const } },
                { description: { contains: query, mode: "insensitive" as const } },
              ],
            }
          : {}),
        isActive: true,
        storeId: store.id,
      },
    }),
    filters.categorySlug
      ? prisma.category.findFirst({
          select: {
            name: true,
            slug: true,
          },
          where: {
            isActive: true,
            slug: filters.categorySlug,
            storeId: store.id,
          },
        })
      : null,
    ...storefrontAudiences.map((audience) =>
      prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: categorySelect,
        where: {
          isActive: true,
          products: {
            some: {
              audience,
              isActive: true,
            },
          },
          storeId: store.id,
        },
      }),
    ),
  ]);

  if (process.env.NODE_ENV !== "production") {
    console.info("[storefront database]", {
      durationMs: Math.round(performance.now() - startedAt),
      productsReturned: products.length,
      totalProducts,
    });
  }

  return {
    activeCategory,
    audienceCategories: {
      [Audience.WOMEN]: audienceCategoryLists[0],
      [Audience.MEN]: audienceCategoryLists[1],
      [Audience.KIDS]: audienceCategoryLists[2],
    },
    categories,
    products,
    totalProducts,
    store,
  };
}

const getCachedStorefrontHome = unstable_cache(
  async (filters: StorefrontHomeFilters) => getStorefrontHomeUncached(filters),
  ["storefront-home"],
  { revalidate: 300, tags: [STOREFRONT_CACHE_TAG] },
);

export async function getStorefrontHome(filters: StorefrontHomeFilters = {}) {
  const startedAt = performance.now();
  const result = await getCachedStorefrontHome(filters);

  if (process.env.NODE_ENV !== "production") {
    console.info("[storefront pagination]", {
      page: Math.max(1, filters.page ?? 1),
      pageSize: STOREFRONT_PAGE_SIZE,
      returnedProducts: result.products.length,
      totalProducts: result.totalProducts,
      offset: (Math.max(1, filters.page ?? 1) - 1) * STOREFRONT_PAGE_SIZE,
    });
    console.info("[storefront timing]", {
      cacheAndLoadMs: Math.round(performance.now() - startedAt),
      filters: {
        audience: filters.audience,
        categorySlug: filters.categorySlug,
        page: filters.page ?? 1,
        query: filters.query,
        sort: filters.sort,
      },
    });
  }

  return result;
}

export async function getCategoryPage(slug: string) {
  const store = await getPrimaryStore();

  if (!store) {
    notFound();
  }

  const category = await prisma.category.findFirst({
    select: {
      id: true,
      name: true,
      slug: true,
      products: {
        orderBy: [{ name: "asc" }],
        select: productSelect,
        where: {
          isActive: true,
        },
      },
    },
    where: {
      isActive: true,
      slug,
      storeId: store.id,
    },
  });

  if (!category) {
    notFound();
  }

  return {
    category,
    store,
  };
}

export const getStorefrontProduct = cache(async (slug: string) => {
  const store = await getPrimaryStore();

  if (!store) {
    notFound();
  }

  const product = await prisma.product.findFirst({
    select: {
      ...productSelect,
      images: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          alt: true,
          url: true,
        },
      },
    },
    where: {
      category: {
        isActive: true,
      },
      isActive: true,
      slug,
      storeId: store.id,
    },
  });

  if (!product) {
    notFound();
  }

  if (process.env.NODE_ENV !== "production") {
    console.info("[storefront product]", {
      imageCount: product.images.length,
      slug,
      variantCount: product.variants.length,
    });
  }

  return {
    product,
    store,
  };
});

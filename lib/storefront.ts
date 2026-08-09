import { notFound } from "next/navigation";
import { cache } from "react";

import { Audience, Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

type StorefrontHomeFilters = {
  audience?: Audience;
  categorySlug?: string;
  query?: string;
  sort?: string;
};

const storefrontAudiences = [Audience.WOMEN, Audience.MEN, Audience.KIDS] as const;

export async function getPrimaryStore() {
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
}

const productSelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  basePrice: true,
  saleUnit: true,
  packQuantity: true,
  sizeDisplayText: true,
  brand: {
    select: {
      name: true,
    },
  },
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

export async function getStorefrontHome(filters: StorefrontHomeFilters = {}) {
  const store = await getPrimaryStore();
  const query = filters.query?.trim();

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
      store: null,
    };
  }

  const [categories, products, activeCategory, ...audienceCategoryLists] =
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
      take: 24,
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
                {
                  brand: {
                    name: { contains: query, mode: "insensitive" as const },
                  },
                },
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

  return {
    activeCategory,
    audienceCategories: {
      [Audience.WOMEN]: audienceCategoryLists[0],
      [Audience.MEN]: audienceCategoryLists[1],
      [Audience.KIDS]: audienceCategoryLists[2],
    },
    categories,
    products,
    store,
  };
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

  return {
    product,
    store,
  };
});

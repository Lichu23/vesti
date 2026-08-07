import { notFound } from "next/navigation";

import { prisma } from "@/lib/prisma";

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

export async function getStorefrontHome() {
  const store = await getPrimaryStore();

  if (!store) {
    return {
      categories: [],
      featuredProducts: [],
      store: null,
    };
  }

  const [categories, featuredProducts] = await Promise.all([
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
                isActive: true,
              },
            },
          },
        },
      },
      where: {
        isActive: true,
        storeId: store.id,
      },
    }),
    prisma.product.findMany({
      orderBy: [{ updatedAt: "desc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        basePrice: true,
        images: {
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
          select: {
            alt: true,
            url: true,
          },
          take: 1,
        },
      },
      take: 6,
      where: {
        category: {
          isActive: true,
        },
        isActive: true,
        isFeatured: true,
        storeId: store.id,
      },
    }),
  ]);

  return {
    categories,
    featuredProducts,
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
        select: {
          id: true,
          name: true,
          slug: true,
          basePrice: true,
          images: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              alt: true,
              url: true,
            },
            take: 1,
          },
        },
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

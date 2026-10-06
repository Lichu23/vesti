import { Audience } from "@/generated/prisma/client";

import { AudiencePage } from "../../audience-page";

type PageProps = {
  params: Promise<{ categoria: string }>;
  searchParams: Promise<{
    buscar?: string | string[];
    ordenar?: string | string[];
    pagina?: string | string[];
  }>;
};

export default async function HombreCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria } = await params;

  return (
    <AudiencePage
      basePath="/hombre"
      categoria={categoria}
      config={{
        audience: Audience.MEN,
        description: "Productos para hombre",
        title: "Hombre",
      }}
      searchParams={searchParams}
    />
  );
}

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

export default async function UnisexCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria } = await params;

  return (
    <AudiencePage
      basePath="/unisex"
      categoria={categoria}
      config={{
        audience: Audience.UNISEX,
        description: "Productos unisex",
        title: "Unisex",
      }}
      searchParams={searchParams}
    />
  );
}

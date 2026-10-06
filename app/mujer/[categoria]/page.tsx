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

export default async function MujerCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria } = await params;

  return (
    <AudiencePage
      basePath="/mujer"
      categoria={categoria}
      config={{
        audience: Audience.WOMEN,
        description: "Productos para mujer",
        title: "Mujer",
      }}
      searchParams={searchParams}
    />
  );
}

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

export default async function NinosCategoryPage({
  params,
  searchParams,
}: PageProps) {
  const { categoria } = await params;

  return (
    <AudiencePage
      basePath="/ninos"
      categoria={categoria}
      config={{
        audience: Audience.KIDS,
        description: "Productos para ninos",
        title: "Ninos",
      }}
      searchParams={searchParams}
    />
  );
}

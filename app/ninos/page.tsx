import { Audience } from "@/generated/prisma/client";

import { AudiencePage } from "../audience-page";

type PageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
    ordenar?: string | string[];
  }>;
};

export default function NinosPage({ searchParams }: PageProps) {
  return (
    <AudiencePage
      basePath="/ninos"
      config={{
        audience: Audience.KIDS,
        description: "Productos para ninos",
        title: "Ninos",
      }}
      searchParams={searchParams}
    />
  );
}

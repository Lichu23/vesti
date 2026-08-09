import { Audience } from "@/generated/prisma/client";

import { AudiencePage } from "../audience-page";

type PageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
    ordenar?: string | string[];
  }>;
};

export default function MujerPage({ searchParams }: PageProps) {
  return (
    <AudiencePage
      basePath="/mujer"
      config={{
        audience: Audience.WOMEN,
        description: "Productos para mujer",
        title: "Mujer",
      }}
      searchParams={searchParams}
    />
  );
}

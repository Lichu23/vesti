import { Audience } from "@/generated/prisma/client";

import { AudiencePage } from "../audience-page";

type PageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
    ordenar?: string | string[];
  }>;
};

export default function HombrePage({ searchParams }: PageProps) {
  return (
    <AudiencePage
      basePath="/hombre"
      config={{
        audience: Audience.MEN,
        description: "Productos para hombre",
        title: "Hombre",
      }}
      searchParams={searchParams}
    />
  );
}

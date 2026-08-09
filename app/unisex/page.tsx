import { Audience } from "@/generated/prisma/client";

import { AudiencePage } from "../audience-page";

type PageProps = {
  searchParams: Promise<{
    buscar?: string | string[];
    categoria?: string | string[];
    ordenar?: string | string[];
  }>;
};

export default function UnisexPage({ searchParams }: PageProps) {
  return (
    <AudiencePage
      basePath="/unisex"
      config={{
        audience: Audience.UNISEX,
        description: "Productos unisex",
        title: "Unisex",
      }}
      searchParams={searchParams}
    />
  );
}

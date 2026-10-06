export const AUDIENCE_PATHS = ["/mujer", "/hombre", "/ninos", "/unisex"] as const;

export type StorefrontListParams = {
  buscar?: string;
  ordenar?: string;
  pagina?: string;
};

function buildQuery(params: StorefrontListParams) {
  const searchParams = new URLSearchParams();

  if (params.buscar) searchParams.set("buscar", params.buscar);
  if (params.ordenar && params.ordenar !== "relevance") {
    searchParams.set("ordenar", params.ordenar);
  }
  if (params.pagina && params.pagina !== "1") {
    searchParams.set("pagina", params.pagina);
  }

  const query = searchParams.toString();

  return query ? `?${query}` : "";
}

/** `/mujer` or `/mujer/lenceria` plus the list params as a query string. */
export function buildAudienceHref(
  audiencePath: string,
  categorySlug: string | undefined,
  params: StorefrontListParams = {},
) {
  const path = categorySlug ? `${audiencePath}/${categorySlug}` : audiencePath;

  return `${path}${buildQuery(params)}`;
}

/** Splits `/mujer/lenceria` into its audience path and category slug. */
export function parseStorefrontPath(pathname: string) {
  const [, first, second] = pathname.split("/");
  const audiencePath = AUDIENCE_PATHS.find((path) => path === `/${first}`);

  return {
    audiencePath,
    categorySlug: audiencePath ? second : undefined,
  };
}

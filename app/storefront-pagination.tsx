import Link from "next/link";

type StorefrontPaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  params?: Record<string, string | undefined>;
};

export function StorefrontPagination({ basePath, currentPage, totalPages, params = {} }: StorefrontPaginationProps) {
  if (totalPages <= 1) return null;

  function href(page: number) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) searchParams.set(key, value);
    if (page > 1) searchParams.set("pagina", String(page));
    const query = searchParams.toString();
    return query ? `${basePath}?${query}` : basePath;
  }

  return (
    <nav aria-label="Paginacion de productos" className="flex items-center justify-center gap-4 pt-4">
      {currentPage > 1 ? <Link className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary" href={href(currentPage - 1)}>Anterior</Link> : null}
      <span className="text-sm text-muted-foreground">Pagina {currentPage} de {totalPages}</span>
      {currentPage < totalPages ? <Link className="rounded-full border border-border px-4 py-2 text-sm hover:border-primary" href={href(currentPage + 1)}>Siguiente</Link> : null}
    </nav>
  );
}

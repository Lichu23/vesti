export function StorefrontProductLoading() {
  return (
    <div
      aria-busy="true"
      aria-label="Cargando productos"
      className="min-w-0 px-5 py-10 sm:px-8"
      role="status"
    >
      <div className="flex min-h-32 flex-col items-center justify-center gap-3">
        <div
          aria-hidden="true"
          className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary"
        />
        <span className="text-sm font-medium text-muted-foreground">
          Cargando...
        </span>
      </div>

      <div
        aria-hidden="true"
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <div className="space-y-3" key={index}>
            <div className="aspect-square animate-pulse rounded bg-secondary" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-1/3 animate-pulse rounded bg-secondary" />
          </div>
        ))}
      </div>
    </div>
  );
}

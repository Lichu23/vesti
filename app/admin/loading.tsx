export default function Loading() {
  return (
    <main
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen min-w-0 overflow-x-hidden bg-background text-foreground"
    >
      <div className="mx-auto grid max-w-[1720px] gap-6 px-4 py-6 sm:px-10 sm:py-10 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <aside className="hidden animate-pulse lg:block" aria-hidden="true">
          <div className="h-9 w-36 rounded bg-secondary" />
          <div className="mt-2 h-3 w-24 rounded bg-secondary" />
          <div className="mt-3 h-6 w-20 rounded-full bg-secondary" />
          <div className="mt-8 h-11 rounded-full bg-secondary" />
          <div className="mb-6 mt-12 h-3 w-24 rounded bg-secondary" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div className="h-12 rounded bg-secondary" key={index} />
            ))}
          </div>
        </aside>

        <section className="relative min-w-0 space-y-10 overflow-x-hidden">
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
            <div
              aria-hidden="true"
              className="size-10 animate-spin rounded-full border-4 border-secondary border-t-primary"
            />
            <p className="text-sm font-medium text-muted-foreground">
              Cargando...
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

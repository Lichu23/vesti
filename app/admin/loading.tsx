export default function Loading() {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="min-h-screen min-w-0 overflow-x-hidden bg-background text-foreground"
    >
      <div className="mx-auto max-w-[1720px] px-4 py-6 sm:px-10 sm:py-10">
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
    </div>
  );
}

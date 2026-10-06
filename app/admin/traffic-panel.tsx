"use client";

import { LoaderCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { AdminSelect } from "@/app/admin/admin-select";
import type { TrafficReport } from "@/lib/analytics-query";

type Status = "unconfigured" | "unavailable" | "forbidden" | "unauthorized";
const number = new Intl.NumberFormat("es-AR");
const date = (value: string) => new Date(value).toLocaleDateString("es-AR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function statusMessage(status: Status) {
  if (status === "unconfigured") {
    return "Las estadísticas aún no están configuradas para esta tienda.";
  }

  if (status === "forbidden" || status === "unauthorized") {
    return "No tienes acceso a las estadísticas de esta tienda.";
  }

  return "Estadísticas temporalmente no disponibles. Intenta actualizar más tarde.";
}

function TrafficResults({ report }: { report: TrafficReport }) {
  const [showAllPages, setShowAllPages] = useState(false);
  const max = Math.max(1, ...report.daily.map((day) => day.pageviews));
  const visiblePages = showAllPages ? report.pages : report.pages.slice(0, 3);
  const hiddenPageCount = Math.max(0, report.pages.length - 3);

  return <div className="mt-5 space-y-6">
    <dl className="grid grid-cols-2 gap-3 sm:gap-4">
      {[["Páginas vistas", report.pageviews], ["Visitantes", report.visitors]].map(([label, value]) => <div key={label}>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="font-serif text-4xl">{number.format(Number(value))}</dd>
      </div>)}
    </dl>
    {report.pageviews === 0 ? <p className="text-sm text-muted-foreground">No hay visitas registradas en este período.</p> : <>
      <figure>
        <figcaption className="mb-3 text-sm font-semibold">Páginas vistas por día (UTC)</figcaption>
        <div className="flex h-28 items-end gap-1" aria-hidden="true">
          {report.daily.map((day) => <div key={day.date} className="flex h-full min-w-0 flex-1 items-end" title={`${date(day.date)}: ${number.format(day.pageviews)}`}>
            <div className="w-full rounded-t bg-primary" style={{ height: `${day.pageviews / max * 100}%` }} />
          </div>)}
        </div>
        <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{date(report.since)}</span><span>{date(report.until)}</span></div>
        <details className="mt-3 text-sm"><summary className="cursor-pointer">Ver datos diarios</summary>
          <table className="mt-2 w-full text-left"><thead><tr><th scope="col">Fecha (UTC)</th><th scope="col">Páginas vistas</th></tr></thead>
            <tbody>{report.daily.map((day) => <tr key={day.date}><td>{date(day.date)}</td><td>{number.format(day.pageviews)}</td></tr>)}</tbody>
          </table>
        </details>
      </figure>
      <div><h3 className="mb-2 text-sm font-semibold">Páginas más vistas</h3>
        <table className="w-full table-fixed text-left text-sm"><thead><tr><th scope="col">Página</th><th className="w-24 text-right" scope="col">Vistas</th></tr></thead>
          <tbody>{visiblePages.map((page) => <tr key={page.path} className="border-t border-border"><td className="break-all py-2 pr-3">{page.path}</td><td className="text-right">{number.format(page.pageviews)}</td></tr>)}</tbody>
        </table>
        {hiddenPageCount > 0 ? <button type="button" className="mt-3 text-sm font-semibold text-primary underline-offset-4 hover:underline" aria-expanded={showAllPages} onClick={() => setShowAllPages((value) => !value)}>
          {showAllPages ? "Ver menos" : `Ver ${hiddenPageCount} páginas más`}
        </button> : null}
      </div>
    </>}
    <p className="text-xs text-muted-foreground">Consultado: {new Date(report.updatedAt).toLocaleString("es-AR")} · Caché de aproximadamente 5 minutos. Producción, sin administración.</p>
  </div>;
}

export function TrafficPanel() {
  const [days, setDays] = useState("7");
  const [report, setReport] = useState<TrafficReport | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const mounted = useRef(true);
  const controller = useRef<AbortController | null>(null);

  const refresh = useCallback(async (period: string) => {
    if (controller.current) return;

    setIsRefreshing(true);
    setStatus(null);
    setReport(null);
    const requestController = new AbortController();
    controller.current = requestController;
    const timeout = setTimeout(() => requestController.abort(), 12_000);

    try {
      const response = await fetch(`/api/admin/analytics?days=${period}`, {
        cache: "no-store",
        signal: requestController.signal,
      });
      const body = await response.json();

      if (!mounted.current) return;

      if (body.status === "ready" && response.ok) {
        setReport(body.report);
        return;
      }

      setStatus(["unconfigured", "forbidden", "unauthorized"].includes(body.status) ? body.status : "unavailable");
    } catch {
      if (mounted.current) setStatus("unavailable");
    } finally {
      clearTimeout(timeout);
      if (controller.current === requestController) {
        controller.current = null;
        if (mounted.current) setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh(days);
  }, [days, refresh]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.abort();
      controller.current = null;
    };
  }, []);

  return <section className="rounded-[4px] border border-border bg-card p-4 sm:p-6" aria-busy={isRefreshing} aria-labelledby="traffic-title">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div><h2 id="traffic-title" className="font-serif text-3xl">Tráfico web</h2><p className="text-sm text-muted-foreground">Días completos hasta ayer (UTC).</p></div>
      <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
        <label className="flex items-center gap-2 text-sm">Período <AdminSelect className="min-w-44 rounded-md border border-border bg-background p-2 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20" disabled={isRefreshing} name="period" onValueChange={setDays} options={[{ label: "Últimos 7 días", value: "7" }, { label: "Últimos 30 días", value: "30" }]} value={days} /></label>
        <button type="button" className="cursor-pointer rounded-full border border-border px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" disabled={isRefreshing} aria-describedby={isRefreshing ? "traffic-refresh-status" : undefined} onClick={() => void refresh(days)}>Actualizar</button>
      </div>
    </div>
    {isRefreshing ? <div id="traffic-refresh-status" className="mt-5 flex items-start gap-3" role="status" aria-live="polite">
      <LoaderCircle className="mt-0.5 size-5 shrink-0 animate-spin text-primary" aria-hidden="true" />
      <div>
        <p className="text-sm text-muted-foreground">Cargando estadísticas…</p>
        <p className="mt-1 text-xs text-muted-foreground">Consultando visitas y páginas vistas de Vercel Analytics.</p>
      </div>
    </div> : null}
    {status ? <p className="mt-5 text-sm text-muted-foreground" role={report ? "alert" : "status"}>{statusMessage(status)}</p> : null}
    {report ? <TrafficResults report={report} /> : !status && !isRefreshing ? <p className="py-8 text-sm text-muted-foreground" role="status">Cargando estadísticas…</p> : null}
  </section>;
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Field, TextInput } from "@/components/ui";
import { useAppData } from "@/hooks/useAppData";
import { formatFechaHoy, formatFechaLegible } from "@/lib/storage";
import { exportarLibroRangoPDF, exportarRegistroPDF } from "@/lib/pdf-export";
import { exportarLibroRangoExcel } from "@/lib/excel-export";
import { filtrarRegistrosPorRango } from "@/lib/export-range";
import { evaluarRegistro } from "@/lib/rangos-legales";

function defaultRango(fechas: string[]): { desde: string; hasta: string } {
  const hoy = formatFechaHoy();
  if (fechas.length === 0) {
    const mes = hoy.slice(0, 7);
    return { desde: `${mes}-01`, hasta: hoy };
  }
  const ordenadas = [...fechas].sort();
  return { desde: ordenadas[0], hasta: ordenadas[ordenadas.length - 1] };
}

export default function HistorialPage() {
  const { data } = useAppData();
  const registros = data?.registros ?? [];
  const hoy = formatFechaHoy();
  const [desde, setDesde] = useState(() => `${hoy.slice(0, 7)}-01`);
  const [hasta, setHasta] = useState(hoy);
  const [rangoListo, setRangoListo] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (!data || rangoListo) return;
    const rango = defaultRango(data.registros.map((r) => r.fecha));
    setDesde(rango.desde);
    setHasta(rango.hasta);
    setRangoListo(true);
  }, [data, rangoListo]);

  const enRango = useMemo(
    () => filtrarRegistrosPorRango(registros, desde, hasta),
    [registros, desde, hasta],
  );

  const exportarDia = (fecha: string) => {
    if (!data) return;
    const registro = data.registros.find((r) => r.fecha === fecha);
    if (registro) exportarRegistroPDF(data, registro);
  };

  const exportarPdfRango = () => {
    if (!data) return;
    setMensaje(null);
    const ok = exportarLibroRangoPDF(data, desde, hasta);
    if (!ok) setMensaje("No hay registros en el rango seleccionado.");
  };

  const exportarExcelRango = () => {
    if (!data) return;
    setMensaje(null);
    const ok = exportarLibroRangoExcel(data, desde, hasta);
    if (!ok) setMensaje("No hay registros en el rango seleccionado.");
  };

  return (
    <main className="page-shell mx-auto max-w-lg">
      <AppHeader title="Historial" subtitle="Registros guardados por fecha" />

      <div className="space-y-3 p-4">
        {registros.length > 0 ? (
          <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
            <h2 className="font-display text-lg font-semibold text-[var(--deep)]">Exportar</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Elige un rango de fechas y descarga en PDF o Excel.
            </p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Field label="Desde">
                <TextInput
                  type="date"
                  value={desde}
                  max={hasta || undefined}
                  onChange={(e) => setDesde(e.target.value)}
                />
              </Field>
              <Field label="Hasta">
                <TextInput
                  type="date"
                  value={hasta}
                  min={desde || undefined}
                  onChange={(e) => setHasta(e.target.value)}
                />
              </Field>
            </div>

            <p className="mt-3 text-xs text-[var(--muted)]">
              {enRango.length} registro(s) en el rango
            </p>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={exportarPdfRango}
                disabled={enRango.length === 0}
                className="rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 px-3 py-2.5 text-sm font-semibold text-[var(--deep)] disabled:opacity-50"
              >
                Exportar PDF
              </button>
              <button
                type="button"
                onClick={exportarExcelRango}
                disabled={enRango.length === 0}
                className="rounded-xl bg-[var(--deep)] px-3 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
              >
                Exportar Excel
              </button>
            </div>

            {mensaje ? (
              <p className="mt-2 text-sm text-[var(--danger,#b45309)]">{mensaje}</p>
            ) : null}
          </section>
        ) : null}

        {registros.length === 0 ? (
          <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
            <p className="text-[var(--muted)]">Aun no hay registros guardados.</p>
            <Link href="/registro" className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
              Crear primer registro
            </Link>
          </div>
        ) : (
          registros.map((r) => {
            const operador = data?.configuracion.operadores.find((o) => o.id === r.operadorId);
            const laboresCompletadas = Object.values(r.labores).filter(Boolean).length;
            const totalLabores = Object.keys(r.labores).length;
            const alertas = evaluarRegistro(r).length;

            return (
              <div key={r.id} className="rounded-2xl border border-[var(--border)] bg-white p-4">
                <Link href={`/registro?fecha=${r.fecha}`} className="block">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-lg font-semibold text-[var(--deep)]">
                      {formatFechaLegible(r.fecha)}
                    </p>
                    <span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-xs font-medium text-[var(--deep)]">
                      {laboresCompletadas}/{totalLabores} labores
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Operador: {operador?.nombre || "Sin asignar"}
                    {alertas > 0 ? ` · ${alertas} alerta(s)` : ""}
                    {r.firmaOperador ? " · Firmado" : " · Sin firma"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    Actualizado: {new Date(r.actualizadoEn).toLocaleString("es-CO")}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => exportarDia(r.fecha)}
                  className="mt-3 w-full rounded-xl bg-[var(--deep)] px-3 py-2 text-sm font-medium text-white"
                >
                  Exportar PDF del dia
                </button>
              </div>
            );
          })
        )}
      </div>

      <BottomNav active="/historial" />
    </main>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { useAppData } from "@/hooks/useAppData";
import { buildDashboardMetrics } from "@/lib/dashboard-metrics";

const DEEP = "#0b3d5c";
const ACCENT = "#1a8f8f";
const ALERT = "#d95f4a";
const FOAM = "#7eb8c9";

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(digits);
}

export default function DashboardPage() {
  const { data, ready } = useAppData();
  const metrics = useMemo(
    () => (data ? buildDashboardMetrics(data) : null),
    [data],
  );

  const actualizado = useMemo(
    () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    [data],
  );

  return (
    <main className="page-shell mx-auto max-w-lg">
      <AppHeader
        title="Dashboard"
        subtitle="Indicadores sanitarios en vivo"
      />

      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </span>
            <p className="text-sm font-medium text-[var(--deep)]">Datos en vivo</p>
          </div>
          <p className="text-xs text-[var(--muted)]">Act. {actualizado}</p>
        </div>

        {!ready || !metrics ? (
          <p className="text-sm text-[var(--muted)]">Cargando indicadores…</p>
        ) : metrics.serie.length === 0 ? (
          <section className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
            <p className="text-[var(--muted)]">Aún no hay registros para graficar.</p>
            <Link
              href="/registro"
              className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]"
            >
              Crear primer registro
            </Link>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Kpi
                label="Alertas hoy"
                value={String(metrics.alertasHoy)}
                tone={metrics.alertasHoy > 0 ? "alert" : "ok"}
              />
              <Kpi
                label="Cumplimiento"
                value={metrics.cumplimientoPct === null ? "—" : `${metrics.cumplimientoPct}%`}
                tone={
                  metrics.cumplimientoPct === null
                    ? "neutral"
                    : metrics.cumplimientoPct >= 80
                      ? "ok"
                      : "alert"
                }
              />
              <Kpi label="pH actual" value={fmt(metrics.ultimoPh)} />
              <Kpi label="Cloro (mg/L)" value={fmt(metrics.ultimoCloro)} />
              <Kpi label="Turbidez" value={fmt(metrics.ultimaTurbidez)} />
              <Kpi label="Registros (14d)" value={String(metrics.registrosUltimos14)} />
            </div>

            <ChartCard title="pH diario" hint={`Rango legal ${metrics.rangos.phMin}–${metrics.rangos.phMax}`}>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={metrics.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c5d9e4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <YAxis domain={[6.5, 8.5]} tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [fmt(Number(value)), "pH"]}
                  />
                  <ReferenceLine y={metrics.rangos.phMin} stroke={ALERT} strokeDasharray="4 4" />
                  <ReferenceLine y={metrics.rangos.phMax} stroke={ALERT} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="ph"
                    stroke={ACCENT}
                    fill={ACCENT}
                    fillOpacity={0.15}
                    strokeWidth={2}
                    connectNulls
                    name="pH"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Cloro libre" hint={`Rango legal ${metrics.rangos.cloroMin}–${metrics.rangos.cloroMax} mg/L`}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={metrics.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c5d9e4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <YAxis domain={[0, 4]} tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value) => [`${fmt(Number(value))} mg/L`, "Cloro"]}
                  />
                  <ReferenceLine y={metrics.rangos.cloroMin} stroke={ALERT} strokeDasharray="4 4" />
                  <ReferenceLine y={metrics.rangos.cloroMax} stroke={ALERT} strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="cloro"
                    stroke={DEEP}
                    fill={DEEP}
                    fillOpacity={0.12}
                    strokeWidth={2}
                    connectNulls
                    name="Cloro"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Turbidez y bañistas" hint={`Turbidez máx. ${metrics.rangos.turbidezMax} UNT`}>
              <ResponsiveContainer width="100%" height={220}>
                <ComposedChart data={metrics.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c5d9e4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <ReferenceLine
                    yAxisId="left"
                    y={metrics.rangos.turbidezMax}
                    stroke={ALERT}
                    strokeDasharray="4 4"
                  />
                  <Bar yAxisId="right" dataKey="banistas" fill={FOAM} name="Bañistas" radius={[4, 4, 0, 0]} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="turbidez"
                    stroke={ALERT}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    connectNulls
                    name="Turbidez"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Alertas por día" hint="Días con parámetros fuera de rango">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={metrics.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#c5d9e4" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#5b7283" }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="alertas" fill={ALERT} name="Alertas" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <Link
                href="/registro"
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 text-center font-semibold text-white"
              >
                Nuevo registro
              </Link>
              <Link
                href="/historial"
                className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-center font-semibold text-[var(--deep)]"
              >
                Ver historial
              </Link>
            </div>
          </>
        )}
      </div>

      <BottomNav active="/dashboard" />
    </main>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #c5d9e4",
  fontSize: 12,
};

function ChartCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
      <h2 className="font-display text-lg font-semibold text-[var(--deep)]">{title}</h2>
      {hint ? <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Kpi({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "ok" | "alert";
}) {
  const toneClass =
    tone === "ok"
      ? "border-[var(--accent)]/40 bg-[var(--accent)]/10"
      : tone === "alert"
        ? "border-[var(--alert)]/40 bg-[var(--alert)]/10"
        : "border-[var(--border)] bg-white";

  return (
    <div className={`rounded-2xl border p-3 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-[var(--deep)]">{value}</p>
    </div>
  );
}

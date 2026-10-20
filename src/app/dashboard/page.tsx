"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Pie,
  PieChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/AppShell";
import { FrecuenciaBadge } from "@/components/ui";
import { useAppData } from "@/hooks/useAppData";
import { buildDashboardMetrics, type DashboardMetrics, type IndicadorParametro, type SerieCalidad } from "@/lib/dashboard-metrics";
import { FRECUENCIA_LABEL } from "@/lib/fields";
import { formatFechaLegible } from "@/lib/storage";

const BLUE = "#309cd8";
const PURPLE = "#8b6bc4";
const ORANGE = "#f59e0b";
const TEAL = "#14b8a6";
const GREEN = "#10b981";
const RED = "#ef4444";
const GRAY = "#94a3b8";
const TICK = { fontSize: 11, fill: "#8a96b0" };
const MAX_PENDIENTES = 9;

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid var(--border)",
  backgroundColor: "var(--surface)",
  color: "var(--foreground)",
  fontSize: 12,
};

function fmt(v: number | null | undefined, digits = 1): string {
  if (v === null || v === undefined) return "—";
  return Number(v).toFixed(digits);
}

type ParametroGrafica = "ph" | "cloro" | "cloroCombinado" | "turbidez";

function configGrafica(rangos: DashboardMetrics["rangos"]): Record<
  ParametroGrafica,
  { label: string; unidad: string; color: string; min?: number; max: number; dominio: [number, number] }
> {
  return {
    ph: { label: "pH", unidad: "", color: BLUE, min: rangos.phMin, max: rangos.phMax, dominio: [6.5, 8.5] },
    cloro: { label: "Cloro libre", unidad: "mg/L", color: PURPLE, min: rangos.cloroMin, max: rangos.cloroMax, dominio: [0, 4] },
    cloroCombinado: { label: "Cloro combinado", unidad: "mg/L", color: TEAL, max: rangos.cloroCombinadoMax, dominio: [0, 1.5] },
    turbidez: { label: "Turbidez", unidad: "UNT", color: ORANGE, max: rangos.turbidezMax, dominio: [0, 8] },
  };
}

export default function DashboardPage() {
  const { data, ready } = useAppData();
  const metrics = useMemo(() => (data ? buildDashboardMetrics(data) : null), [data]);

  const actualizado = useMemo(
    () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  return (
    <AppShell active="/dashboard" title="Dashboard" subtitle="Indicadores sanitarios en vivo" width="wide">
      <div className="space-y-4 lg:space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--accent)] opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--accent)]" />
            </span>
            <p className="text-sm font-medium text-[var(--deep)]">
              Datos en vivo{metrics ? ` · ${metrics.instalacionNombre}` : ""}
            </p>
          </div>
          <p className="text-xs text-[var(--muted)]">
            {metrics ? `${formatFechaLegible(metrics.hoy)} · ` : ""}Act. {actualizado}
          </p>
        </div>

        {!ready || !metrics ? (
          <p className="text-sm text-[var(--muted)]">Cargando indicadores…</p>
        ) : (
          <Dashboard metrics={metrics} />
        )}
      </div>
    </AppShell>
  );
}

function Dashboard({ metrics }: { metrics: DashboardMetrics }) {
  const [parametro, setParametro] = useState<ParametroGrafica>("ph");
  const graficas = configGrafica(metrics.rangos);
  const g = graficas[parametro];
  const { hoyEstado, indicadores, seguridad, labores } = metrics;

  const estadoDia = hoyEstado.cerrado
    ? { valor: "Cerrado", detalle: "Dia firmado y bloqueado", tono: "ok" as const }
    : hoyEstado.existe
      ? {
          valor: `${hoyEstado.fasesCompletadas}/4`,
          detalle: hoyEstado.siguienteFase ? `Sigue: ${hoyEstado.siguienteFase}` : "Momentos registrados",
          tono: "neutral" as const,
        }
      : { valor: "Sin iniciar", detalle: "Aun no hay registro hoy", tono: "alert" as const };

  return (
    <>
      {!metrics.motorActivo ? (
        <p className="rounded-2xl border border-amber-400/50 bg-amber-400/10 px-4 py-2.5 text-xs text-[var(--foreground)]">
          Motor normativo en modo informativo: las bandas de las graficas son rangos de referencia, no
          alarmas legales activas.
        </p>
      ) : null}

      {/* Estado general */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 lg:gap-4">
        <StatCard label="Estado del dia" value={estadoDia.valor} detail={estadoDia.detalle} tone={estadoDia.tono} color={BLUE} icon={<IconCalendar />} />
        <StatCard
          label="Alertas hoy"
          value={String(metrics.alertasHoy)}
          detail={metrics.alertasHoy > 0 ? "Parametros fuera de rango" : "Sin alertas sanitarias"}
          tone={metrics.alertasHoy > 0 ? "alert" : "ok"}
          color={RED}
          icon={<IconAlert />}
        />
        <StatCard
          label="Cumplimiento"
          value={metrics.cumplimientoPct === null ? "—" : `${metrics.cumplimientoPct}%`}
          detail={`${metrics.diasOk} de ${metrics.registrosUltimos14} dias sin alertas`}
          tone={metrics.cumplimientoPct === null ? "neutral" : metrics.cumplimientoPct >= 80 ? "ok" : "alert"}
          color={GREEN}
          icon={<IconShield />}
        />
        <StatCard
          label="Ultima visita"
          value={metrics.ultimaVisita ? formatFechaLegible(metrics.ultimaVisita.fecha).slice(0, 5) : "—"}
          detail={metrics.ultimaVisita?.autoridadSanitaria ?? "Sin visitas registradas"}
          color={PURPLE}
          icon={<IconBadge />}
        />
      </div>

      {/* Parametros clave con tendencia */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 lg:gap-4">
        <ParamCard label="pH" ind={indicadores.ph} digits={2} color={BLUE} serie={metrics.serie} dataKey="ph" rango={`${metrics.rangos.phMin}–${metrics.rangos.phMax}`} />
        <ParamCard label="Cloro libre" unidad="mg/L" ind={indicadores.cloro} color={PURPLE} serie={metrics.serie} dataKey="cloro" rango={`${metrics.rangos.cloroMin}–${metrics.rangos.cloroMax}`} />
        <ParamCard label="Turbidez" unidad="UNT" ind={indicadores.turbidez} color={ORANGE} serie={metrics.serie} dataKey="turbidez" rango={`máx. ${metrics.rangos.turbidezMax}`} />
        <ParamCard
          label="Bañistas"
          ind={indicadores.banistas}
          digits={0}
          color={TEAL}
          serie={metrics.serie}
          dataKey="banistas"
          rango={indicadores.banistas.aforo ? `aforo ${indicadores.banistas.aforo}` : "sin aforo"}
        />
      </div>

      {/* Tendencia + mediciones de hoy */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card
          className="lg:col-span-2"
          title="Tendencia de calidad del agua"
          hint={`Ultimos ${metrics.serie.length} registros · banda verde = rango ${metrics.motorActivo ? "legal" : "de referencia"}`}
          action={
            <div className="flex flex-wrap gap-1 rounded-xl bg-[var(--foam)] p-1">
              {(Object.keys(graficas) as ParametroGrafica[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setParametro(k)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    parametro === k ? "bg-[var(--surface)] text-[var(--deep)] shadow-sm" : "text-[var(--muted)]"
                  }`}
                >
                  {graficas[k].label}
                </button>
              ))}
            </div>
          }
        >
          {metrics.serie.length === 0 ? (
            <Vacio texto="Aun no hay registros para graficar." />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={metrics.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-tendencia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={g.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={g.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRAY} strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} />
                <YAxis domain={g.dominio} tick={TICK} tickLine={false} axisLine={false} allowDataOverflow />
                <ReferenceArea y1={g.min ?? g.dominio[0]} y2={g.max} fill={GREEN} fillOpacity={0.08} />
                {g.min !== undefined ? <ReferenceLine y={g.min} stroke={GREEN} strokeDasharray="4 4" /> : null}
                <ReferenceLine y={g.max} stroke={RED} strokeDasharray="4 4" />
                <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${fmt(Number(v), 2)} ${g.unidad}`, g.label]} />
                <Area
                  type="monotone"
                  dataKey={parametro}
                  stroke={g.color}
                  fill="url(#grad-tendencia)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: g.color }}
                  activeDot={{ r: 5 }}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Mediciones de hoy" hint="Por momento del dia">
          <MedicionesHoy metrics={metrics} />
        </Card>
      </div>

      {/* Donas de operacion */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 lg:gap-6">
        <Card title="Progreso del dia">
          <Donut
            centro={`${hoyEstado.fasesCompletadas}/4`}
            sub="momentos"
            datos={[
              { name: "Completados", value: hoyEstado.fasesCompletadas, color: BLUE },
              { name: "Pendientes", value: 4 - hoyEstado.fasesCompletadas, color: GRAY },
            ]}
          />
        </Card>
        <Card title="Dispositivos de seguridad">
          <Donut
            centro={`${seguridad.aceptable}/${seguridad.aceptable + seguridad.noAceptable + seguridad.sinRegistrar}`}
            sub="aceptables"
            datos={[
              { name: "Aceptable", value: seguridad.aceptable, color: GREEN },
              { name: "No aceptable", value: seguridad.noAceptable, color: RED },
              { name: "Sin registrar", value: seguridad.sinRegistrar, color: GRAY },
            ]}
          />
        </Card>
        <Card title="Labores de hoy">
          <Donut
            centro={labores.total ? `${Math.round((labores.completadas / labores.total) * 100)}%` : "—"}
            sub={`${labores.completadas} de ${labores.total}`}
            datos={[
              { name: "Hechas", value: labores.completadas, color: ORANGE },
              { name: "Pendientes", value: labores.total - labores.completadas, color: GRAY },
            ]}
          />
        </Card>
        <Card title="Cumplimiento 14 dias">
          <Donut
            centro={metrics.cumplimientoPct === null ? "—" : `${metrics.cumplimientoPct}%`}
            sub="dias en rango"
            datos={[
              { name: "Sin alertas", value: metrics.diasOk, color: GREEN },
              { name: "Con alertas", value: metrics.diasConAlerta, color: RED },
            ]}
          />
        </Card>
      </div>

      {/* Banistas + alertas recientes */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card
          className="lg:col-span-2"
          title="Bañistas por dia"
          hint={indicadores.banistas.aforo ? `Linea roja = aforo maximo (${indicadores.banistas.aforo})` : "Configure el aforo maximo de la instalacion"}
        >
          {metrics.serie.length === 0 ? (
            <Vacio texto="Sin datos de bañistas." />
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={metrics.serie} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="grad-banistas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={1} />
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0.45} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={GRAY} strokeOpacity={0.25} vertical={false} />
                <XAxis dataKey="label" tick={TICK} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={TICK} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  cursor={{ fill: GRAY, fillOpacity: 0.1 }}
                  formatter={(v) => [String(v), "Bañistas"]}
                />
                {indicadores.banistas.aforo ? (
                  <ReferenceLine y={indicadores.banistas.aforo} stroke={RED} strokeDasharray="4 4" />
                ) : null}
                <Bar dataKey="banistas" name="Bañistas" fill="url(#grad-banistas)" radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Alertas recientes" hint="Lecturas fuera de rango">
          {metrics.alertasRecientes.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <IconShield />
              </span>
              <p className="text-sm text-[var(--muted)]">Sin alertas en los ultimos registros.</p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--border)]">
              {metrics.alertasRecientes.map((a) => (
                <li key={`${a.fecha}-${a.id}`} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{a.campo}</p>
                    <p className="text-xs text-[var(--muted)]">
                      {formatFechaLegible(a.fecha)} · {a.valor}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase text-white ${
                      a.nivel === "critico" ? "bg-red-500" : "bg-amber-500"
                    }`}
                  >
                    {a.nivel === "critico" ? "Critico" : "Advertencia"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* Pendientes + accesos */}
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <Card className="lg:col-span-2" title="Pendientes de hoy" hint="Momentos, parametros y labores que corresponden hoy">
          {metrics.pendientes.length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--muted)]">Todo al dia. No hay pendientes.</p>
          ) : (
            <ul className="grid gap-2 sm:grid-cols-2">
              {metrics.pendientes.slice(0, MAX_PENDIENTES).map((p) => (
                <li
                  key={p.id}
                  className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 ${
                    p.tipo === "fase" ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)]"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[var(--foreground)]">{p.texto}</p>
                    <p className="text-[11px] text-[var(--muted)]">
                      {p.tipo === "fase" ? p.detalle : p.tipo === "parametro" ? "Parametro quimico" : "Labor"}
                    </p>
                  </div>
                  {p.frecuencia ? <FrecuenciaBadge label={FRECUENCIA_LABEL[p.frecuencia]} /> : null}
                </li>
              ))}
              {metrics.pendientes.length > MAX_PENDIENTES ? (
                <li>
                  <Link
                    href="/registro"
                    className="flex h-full items-center justify-center rounded-xl border border-dashed border-[var(--border)] px-3 py-2 text-sm font-semibold text-[var(--accent)]"
                  >
                    +{metrics.pendientes.length - MAX_PENDIENTES} pendientes mas en el registro
                  </Link>
                </li>
              ) : null}
            </ul>
          )}
        </Card>

        <Card title="Accesos rapidos">
          <div className="grid gap-2">
            <QuickLink href="/registro" label="Registro diario" detail="Continuar el dia" primary />
            <QuickLink href="/historial" label="Historial" detail={`${metrics.totalRegistros} registros`} />
            <QuickLink href="/visitas" label="Visitas de inspeccion" detail={`${metrics.totalVisitas} registradas`} />
          </div>
        </Card>
      </div>
    </>
  );
}

function Card({
  title,
  hint,
  action,
  className = "",
  children,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)] sm:p-5 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-[var(--deep)]">{title}</h2>
          {hint ? <p className="mt-0.5 text-xs text-[var(--muted)]">{hint}</p> : null}
        </div>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Vacio({ texto }: { texto: string }) {
  return (
    <div className="flex h-56 flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm text-[var(--muted)]">{texto}</p>
      <Link href="/registro" className="text-sm font-semibold text-[var(--accent)]">
        Ir al registro diario
      </Link>
    </div>
  );
}

function StatCard({
  label,
  value,
  detail,
  color,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  color: string;
  icon: React.ReactNode;
  tone?: "neutral" | "ok" | "alert";
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[var(--shadow-soft)]">
      <span
        aria-hidden
        className="absolute -right-6 -top-6 h-24 w-24 rounded-full"
        style={{ backgroundColor: color, opacity: 0.14 }}
      />
      <span className="absolute right-3 top-3" style={{ color }}>
        {icon}
      </span>
      <p className="font-display text-2xl font-bold text-[var(--deep)] sm:text-3xl">
        {value}
        {tone !== "neutral" ? (
          <span className={`ml-1.5 inline-block h-2 w-2 rounded-full align-middle ${tone === "ok" ? "bg-emerald-500" : "bg-red-500"}`} />
        ) : null}
      </p>
      <p className="mt-0.5 text-sm font-medium text-[var(--foreground)]">{label}</p>
      <p className="mt-0.5 truncate text-xs text-[var(--muted)]">{detail}</p>
    </div>
  );
}

function ParamCard({
  label,
  unidad,
  ind,
  digits = 1,
  color,
  serie,
  dataKey,
  rango,
}: {
  label: string;
  unidad?: string;
  ind: IndicadorParametro;
  digits?: number;
  color: string;
  serie: SerieCalidad[];
  dataKey: keyof SerieCalidad;
  rango: string;
}) {
  const gradId = `spark-${String(dataKey)}`;
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-soft)]">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-4 pb-0">
        <div className="flex flex-wrap items-start justify-between gap-x-2 gap-y-1">
          <p className="text-sm text-[var(--muted)]">
            {label}
            {unidad ? ` (${unidad})` : ""}
          </p>
          <EstadoChip estado={ind.estado} />
        </div>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="font-display text-3xl font-bold text-[var(--deep)]">{fmt(ind.actual, digits)}</p>
          {ind.delta !== null ? (
            <span className="text-xs font-semibold text-[var(--muted)]" title="Cambio frente a la medicion anterior">
              {ind.delta > 0 ? "▲ +" : ind.delta < 0 ? "▼ " : ""}
              {fmt(ind.delta, digits)}
            </span>
          ) : null}
        </div>
        <p className="text-[11px] text-[var(--muted)]">Rango {rango}</p>
      </div>
      <div className="h-16">
        {serie.length > 1 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={serie} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradId})`} connectNulls dot={false} isAnimationActive={false} baseValue="dataMin" />
            </AreaChart>
          </ResponsiveContainer>
        ) : null}
      </div>
    </div>
  );
}

function EstadoChip({ estado }: { estado: IndicadorParametro["estado"] }) {
  if (estado === "sin_dato") {
    return <span className="rounded-full bg-[var(--foam)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">Sin dato</span>;
  }
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ${estado === "ok" ? "bg-emerald-500" : "bg-red-500"}`}
    >
      {estado === "ok" ? "En rango" : "Fuera de rango"}
    </span>
  );
}

function Donut({
  centro,
  sub,
  datos,
}: {
  centro: string;
  sub: string;
  datos: { name: string; value: number; color: string }[];
}) {
  const total = datos.reduce((s, d) => s + d.value, 0);
  const visibles = total > 0 ? datos : [{ name: "Sin datos", value: 1, color: GRAY }];
  return (
    <div>
      <div className="relative h-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={visibles}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="92%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={visibles.filter((d) => d.value > 0).length > 1 ? 3 : 0}
              cornerRadius={6}
              stroke="none"
            >
              {visibles.map((d) => (
                <Cell key={d.name} fill={d.color} fillOpacity={d.color === GRAY ? 0.35 : 1} />
              ))}
            </Pie>
            {total > 0 ? <Tooltip contentStyle={tooltipStyle} /> : null}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold text-[var(--deep)]">{centro}</span>
          <span className="text-xs text-[var(--muted)]">{sub}</span>
        </div>
      </div>
      <ul className="mt-3 space-y-1">
        {datos.map((d) => (
          <li key={d.name} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-[var(--foreground)]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color, opacity: d.color === GRAY ? 0.5 : 1 }} />
              {d.name}
            </span>
            <span className="font-semibold text-[var(--deep)]">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MedicionesHoy({ metrics }: { metrics: DashboardMetrics }) {
  const { rangos } = metrics;
  const filas: {
    label: string;
    key: "ph" | "orp" | "cloroLibre" | "cloroCombinado";
    digits: number;
    fuera?: (v: number) => boolean;
  }[] = [
    { label: "pH", key: "ph", digits: 2, fuera: (v) => v < rangos.phMin || v > rangos.phMax },
    { label: "ORP (mV)", key: "orp", digits: 0 },
    { label: "Cloro libre", key: "cloroLibre", digits: 2, fuera: (v) => v < rangos.cloroMin || v > rangos.cloroMax },
    { label: "Cloro comb.", key: "cloroCombinado", digits: 2, fuera: (v) => v > rangos.cloroCombinadoMax },
  ];
  const momentos = metrics.medicionesHoy;
  const titulos = { manana: "Apert.", mediodia: "Medio.", tarde: "Tarde" };

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--border)]">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[var(--foam)] text-[11px] uppercase tracking-wide text-[var(--muted)]">
            <th className="px-3 py-2 text-left font-semibold">Parametro</th>
            {momentos.map((m) => (
              <th key={m.momento} className="px-2 py-2 text-right font-semibold">
                {titulos[m.momento]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {filas.map((f) => (
            <tr key={f.key}>
              <td className="px-3 py-2.5 font-medium text-[var(--foreground)]">{f.label}</td>
              {momentos.map((m) => {
                const v = m[f.key];
                const mal = v !== null && f.fuera?.(v);
                return (
                  <td key={m.momento} className="px-2 py-2.5 text-right">
                    {v === null ? (
                      <span className="text-[var(--muted)]">—</span>
                    ) : (
                      <span
                        className={`rounded-md px-1.5 py-0.5 font-semibold ${
                          mal ? "bg-red-500/15 text-red-600" : "text-[var(--deep)]"
                        }`}
                      >
                        {fmt(v, f.digits)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function QuickLink({ href, label, detail, primary }: { href: string; label: string; detail: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-xl px-4 py-3 transition hover:brightness-105 ${
        primary ? "bg-[var(--accent)] text-white" : "border border-[var(--border)] bg-[var(--surface)] text-[var(--deep)]"
      }`}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className={`block text-xs ${primary ? "text-white/80" : "text-[var(--muted)]"}`}>{detail}</span>
      </span>
      <span aria-hidden>→</span>
    </Link>
  );
}

const iconProps = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

function IconCalendar() {
  return (
    <svg {...iconProps}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg {...iconProps}>
      <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg {...iconProps}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconBadge() {
  return (
    <svg {...iconProps}>
      <path d="M9 12h6M9 16h6M9 8h2" />
      <rect x="4" y="2" width="16" height="20" rx="2" />
    </svg>
  );
}

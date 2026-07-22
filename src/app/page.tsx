"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { useAppData } from "@/hooks/useAppData";
import { formatFechaHoy, formatFechaLegible } from "@/lib/storage";
import { evaluarRegistro } from "@/lib/rangos-legales";
import { AlertasPanel } from "@/components/AlertasPanel";
import { exportarRegistroPDF } from "@/lib/pdf-export";
import { getSyncStatus } from "@/lib/sync";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default function HomePage() {
  const { data, ready } = useAppData();
  const hoy = formatFechaHoy();
  const config = data?.configuracion;
  const registroHoy = data?.registros.find((r) => r.fecha === hoy);
  const configCompleta = Boolean(config?.razonSocial && config?.nombreEstanque);
  const alertasHoy = registroHoy ? evaluarRegistro(registroHoy) : [];
  const syncStatus = ready ? getSyncStatus() : { configured: false, lastSync: null };

  return (
    <AppShell
      active="/"
      title={config?.nombreEstanque || "Libro de Control Sanitario"}
      subtitle={config?.razonSocial || "Configure su instalación para comenzar"}
      width="wide"
    >
      <div className="space-y-4 lg:space-y-6">
        {isSupabaseConfigured() ? <SubscriptionBanner /> : null}

        {!configCompleta ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <p className="font-semibold text-amber-900">Configuración pendiente</p>
            <p className="mt-1 text-sm text-amber-800">
              Complete los datos de la instalación antes de registrar controles diarios.
            </p>
            <Link
              href="/configuracion"
              className="mt-3 inline-block rounded-xl bg-amber-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Ir a configuración
            </Link>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-5 lg:gap-6">
          <section className="rounded-2xl bg-[var(--deep)] p-5 text-white sm:p-6 lg:col-span-3">
            <p className="text-sm text-[var(--foam)]/80">Registro de hoy</p>
            <p className="font-display mt-1 text-3xl font-bold sm:text-4xl">{formatFechaLegible(hoy)}</p>
            <p className="mt-2 text-sm">
              {registroHoy
                ? `Última actualización: ${new Date(registroHoy.actualizadoEn).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}`
                : "Aún no hay registro para hoy"}
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
              <Link
                href="/registro"
                className="inline-flex flex-1 items-center justify-center rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
              >
                {registroHoy ? "Continuar registro" : "Iniciar registro del dia"}
              </Link>
              {registroHoy && data ? (
                <button
                  type="button"
                  onClick={() => exportarRegistroPDF(data, registroHoy)}
                  className="inline-flex flex-1 items-center justify-center rounded-2xl border border-white/30 px-4 py-3 text-sm font-medium text-white"
                >
                  Exportar PDF de hoy
                </button>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 lg:col-span-2">
            <h2 className="font-display text-lg font-semibold text-[var(--deep)]">
              Estado sanitario de hoy
            </h2>
            <div className="mt-3">
              {registroHoy ? (
                <AlertasPanel alertas={alertasHoy} compact={alertasHoy.length === 0} />
              ) : (
                <p className="text-sm text-[var(--muted)]">Sin registro para evaluar aún.</p>
              )}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-4">
          <Link href="/dashboard" className="rounded-2xl bg-[var(--accent)] px-4 py-4 text-center sm:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/80">Panel</p>
            <p className="mt-1 font-display text-lg font-bold text-white">Dashboard en vivo</p>
          </Link>
          <Link
            href="/visitas"
            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-4 text-center sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">Visitas</p>
            <p className="mt-1 font-display text-lg font-bold text-[var(--deep)]">
              {ready ? String(data?.visitas.length ?? 0) : "—"}
            </p>
          </Link>
          <StatCard label="Registros" value={ready ? String(data?.registros.length ?? 0) : "—"} />
          <StatCard label="Operadores" value={ready ? String(config?.operadores.length ?? 0) : "—"} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-[var(--deep)]">Sincronizacion</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              {syncStatus.configured
                ? syncStatus.lastSync
                  ? `Ultima sincronizacion: ${new Date(syncStatus.lastSync).toLocaleString("es-CO")}`
                  : "Supabase listo. Sincronice desde Configuracion."
                : "Configure Supabase en .env.local para respaldo en la nube."}
            </p>
            <Link href="/configuracion" className="mt-2 inline-block text-sm font-semibold text-[var(--accent)]">
              Configuracion de instalacion
            </Link>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold text-[var(--deep)]">Marco normativo</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">
              Basado en el Libro Estándar de Registro de Control Sanitario de Estanques de Piscinas
              (Antioquia). Ley 9/1979, Decreto 3751/1993, Ley 1209/2008, Resoluciones 1618/2010 y 1510/2011.
            </p>
          </section>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-[var(--deep)]">{value}</p>
    </div>
  );
}

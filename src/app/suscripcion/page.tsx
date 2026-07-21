"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { SaveButton } from "@/components/ui";
import type { SubscriptionInfo } from "@/lib/subscription";
import { formatCop, getPlan, type PlanId } from "@/lib/plans";
import { createClient } from "@/lib/supabase/client";
import { fetchJson } from "@/lib/fetch-json";

interface StatusResponse {
  configured?: boolean;
  user?: { email?: string } | null;
  subscription?: SubscriptionInfo | null;
  error?: string;
}

function SuscripcionContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const planPaid = searchParams.get("plan") as PlanId | null;
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [email, setEmail] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [configured, setConfigured] = useState(true);
  const [statusError, setStatusError] = useState("");

  useEffect(() => {
    fetchJson<StatusResponse>("/api/subscription/status").then((d) => {
      if (!d) {
        setStatusError("No se pudo cargar el estado de la suscripcion.");
        return;
      }
      setConfigured(d.configured !== false);
      if (d.error) setStatusError(d.error);
      if (d.subscription) setSub(d.subscription);
      else setSub(null);
      setEmail(d.user?.email ?? "");
    });
  }, [success]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const openStripePortal = async () => {
    setPortalLoading(true);
    try {
      const data = await fetchJson<{ url?: string; error?: string }>("/api/billing/portal", {
        method: "POST",
      });
      if (data?.url) window.location.href = data.url;
      else if (data?.error) setStatusError(data.error);
    } finally {
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4">
      {statusError ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{statusError}</div>
      ) : null}

      {!configured ? (
        <div className="rounded-xl bg-[var(--foam)] px-4 py-3 text-sm text-[var(--deep)]">
          Modo local: Supabase no configurado. La app funciona sin suscripcion en nube.
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Pago procesado con {success === "stripe" ? "Stripe" : "Wompi"}.
          {planPaid ? ` Plan ${getPlan(planPaid).nombre} activado.` : ""}
        </div>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--deep)]">Mi cuenta</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">{email}</p>
      </section>

      {sub ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <h2 className="font-display text-lg font-semibold text-[var(--deep)]">Suscripcion</h2>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Estado</span>
              <span className={`font-semibold ${sub.puedeUsarApp ? "text-emerald-700" : "text-red-600"}`}>
                {sub.enTrial ? "Prueba gratis" : sub.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Plan</span>
              <span className="font-medium capitalize">{sub.plan}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Proveedor</span>
              <span className="font-medium capitalize">{sub.proveedor ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Vence</span>
              <span className="font-medium">
                {sub.fechaVencimiento
                  ? new Date(sub.fechaVencimiento).toLocaleDateString("es-CO")
                  : "-"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Dias restantes</span>
              <span className="font-medium">{sub.diasRestantes}</span>
            </div>
          </div>

          {!sub.puedeUsarApp ? (
            <Link
              href="/planes"
              className="mt-4 flex w-full items-center justify-center rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white"
            >
              Renovar suscripcion
            </Link>
          ) : null}

          {sub.proveedor === "stripe" && sub.status === "activa" ? (
            <button
              type="button"
              onClick={openStripePortal}
              disabled={portalLoading}
              className="mt-2 w-full rounded-xl border border-[var(--border)] py-2.5 text-sm font-medium"
            >
              {portalLoading ? "Cargando..." : "Gestionar pago en Stripe"}
            </button>
          ) : null}
        </section>
      ) : configured && !sub && !statusError ? (
        <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
          <p className="text-sm text-[var(--muted)]">
            No hay suscripcion activa. Elija un plan para continuar usando la app despues del periodo de prueba.
          </p>
          <Link
            href="/planes"
            className="mt-3 flex w-full items-center justify-center rounded-xl bg-[var(--accent)] py-3 text-sm font-semibold text-white"
          >
            Ver planes
          </Link>
        </section>
      ) : null}

      <section className="rounded-2xl border border-[var(--border)] bg-white p-4">
        <h2 className="font-display text-lg font-semibold text-[var(--deep)]">Precios</h2>
        <div className="mt-2 space-y-1 text-sm">
          <p>Mensual: {formatCop(getPlan("mensual").precioCop)}</p>
          <p>Anual: {formatCop(getPlan("anual").precioCop)}</p>
        </div>
        <Link href="/planes" className="mt-3 inline-block text-sm font-semibold text-[var(--accent)]">
          Ver planes y pagar
        </Link>
      </section>

      <SaveButton onClick={handleLogout} label="Cerrar sesion" />
    </div>
  );
}

export default function SuscripcionPage() {
  return (
    <main className="page-shell mx-auto max-w-lg">
      <AppHeader title="Mi suscripcion" subtitle="Estado de cuenta y pagos" />
      <Suspense fallback={<div className="p-4">Cargando...</div>}>
        <SuscripcionContent />
      </Suspense>
      <BottomNav active="/suscripcion" />
    </main>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { PLANS, formatCop, type PlanId } from "@/lib/plans";
import type { SubscriptionInfo } from "@/lib/subscription";
import { getAppData } from "@/lib/storage";
import { fetchJson } from "@/lib/fetch-json";

function PlanesContent() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";
  const [loading, setLoading] = useState<PlanId | "">("");
  const [provider, setProvider] = useState<"stripe" | "wompi" | "">("");
  const [error, setError] = useState("");
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    fetchJson<{ subscription?: SubscriptionInfo }>("/api/subscription/status").then((d) => {
      if (d?.subscription) setSub(d.subscription);
    });
  }, []);

  const checkout = async (plan: PlanId, metodo: "stripe" | "wompi") => {
    setLoading(plan);
    setProvider(metodo);
    setError("");
    const instalacionId = getAppData().instalacionId;

    try {
      const res = await fetch(`/api/checkout/${metodo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, instalacionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al iniciar pago");
      window.location.href = data.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setLoading("");
      setProvider("");
    }
  };

  return (
    <div className="space-y-4 lg:space-y-6">
      {expired ? (
        <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Su periodo de prueba o suscripcion ha vencido. Elija un plan para continuar.
        </div>
      ) : null}

      {sub?.enTrial ? (
        <div className="rounded-xl bg-[var(--foam)] px-4 py-3 text-sm text-[var(--deep)]">
          Prueba gratis: {sub.diasRestantes} dia(s) restantes
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="grid gap-4 md:grid-cols-2 lg:gap-6">
      {PLANS.map((plan) => (
        <div key={plan.id} className="rounded-2xl border-2 border-[var(--border)] bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--deep)]">{plan.nombre}</h2>
              <p className="mt-1 text-sm text-[var(--muted)]">{plan.descripcion}</p>
              {plan.ahorro ? (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-800">
                  {plan.ahorro}
                </span>
              ) : null}
            </div>
            <div className="text-right">
              <p className="font-display text-2xl font-bold text-[var(--accent)]">
                {formatCop(plan.precioCop)}
              </p>
              <p className="text-xs text-[var(--muted)]">/{plan.periodo}</p>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              type="button"
              disabled={loading !== ""}
              onClick={() => checkout(plan.id, "wompi")}
              className="w-full rounded-xl bg-[var(--deep)] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading === plan.id && provider === "wompi"
                ? "Redirigiendo..."
                : "Pagar con Wompi (PSE, Nequi, tarjetas CO)"}
            </button>
            <button
              type="button"
              disabled={loading !== ""}
              onClick={() => checkout(plan.id, "stripe")}
              className="w-full rounded-xl border-2 border-[var(--accent)] py-3 text-sm font-semibold text-[var(--accent)] disabled:opacity-50"
            >
              {loading === plan.id && provider === "stripe"
                ? "Redirigiendo..."
                : "Pagar con Stripe (tarjeta internacional)"}
            </button>
          </div>
        </div>
      ))}
      </div>

      <div className="rounded-xl bg-white p-4 text-sm text-[var(--muted)]">
        <p className="font-semibold text-[var(--deep)]">Metodos de pago</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li><strong>Wompi:</strong> PSE, Nequi, Daviplata, tarjetas debito/credito Colombia</li>
          <li><strong>Stripe:</strong> Visa, Mastercard internacional. Renovacion automatica.</li>
        </ul>
      </div>

      {sub?.puedeUsarApp ? (
        <Link href="/" className="block text-center text-sm font-semibold text-[var(--accent)]">
          Volver a la app
        </Link>
      ) : null}
    </div>
  );
}

export default function PlanesPage() {
  return (
    <AppShell
      active="/planes"
      title="Planes y precios"
      subtitle="Elija como desea pagar su suscripcion"
      width="wide"
    >
      <Suspense fallback={<div className="py-4">Cargando...</div>}>
        <PlanesContent />
      </Suspense>
    </AppShell>
  );
}

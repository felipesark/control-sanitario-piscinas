"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SubscriptionInfo } from "@/lib/subscription";
import { fetchJson } from "@/lib/fetch-json";

export function SubscriptionBanner() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);

  useEffect(() => {
    fetchJson<{ subscription?: SubscriptionInfo }>("/api/subscription/status").then((d) => {
      if (d?.subscription) setSub(d.subscription);
    });
  }, []);

  if (!sub) return null;

  if (sub.enTrial) {
    return (
      <div className="rounded-2xl border border-[var(--accent)] bg-[var(--accent)]/10 p-4">
        <p className="text-sm font-semibold text-[var(--deep)]">
          Prueba gratis: {sub.diasRestantes} dia(s) restantes
        </p>
        <Link href="/planes" className="mt-1 inline-block text-sm text-[var(--accent)]">
          Ver planes y precios
        </Link>
      </div>
    );
  }

  if (!sub.puedeUsarApp) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-800">Suscripcion vencida</p>
        <Link href="/planes" className="mt-1 inline-block text-sm font-semibold text-red-700">
          Renovar ahora
        </Link>
      </div>
    );
  }

  return null;
}

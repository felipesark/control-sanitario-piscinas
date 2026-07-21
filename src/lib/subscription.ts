export type SubscriptionStatus = "trial" | "activa" | "vencida" | "cancelada" | "none";

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  plan: string;
  proveedor: string | null;
  fechaVencimiento: string | null;
  diasRestantes: number;
  puedeUsarApp: boolean;
  enTrial: boolean;
}

export interface SuscripcionRow {
  id: string;
  user_id: string;
  plan: string;
  estado: string;
  proveedor: string | null;
  fecha_vencimiento: string;
  proveedor_subscription_id: string | null;
}

export function computeSubscriptionAccess(sub: SuscripcionRow | null): SubscriptionInfo {
  if (!sub) {
    return {
      status: "none",
      plan: "ninguno",
      proveedor: null,
      fechaVencimiento: null,
      diasRestantes: 0,
      puedeUsarApp: false,
      enTrial: false,
    };
  }

  const vence = new Date(sub.fecha_vencimiento);
  const ahora = new Date();
  const diasRestantes = Math.ceil((vence.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24));
  const vigente = vence > ahora && (sub.estado === "activa" || sub.estado === "trial");

  let status: SubscriptionStatus = sub.estado as SubscriptionStatus;
  if (!vigente && sub.estado !== "cancelada") status = "vencida";

  return {
    status,
    plan: sub.plan,
    proveedor: sub.proveedor,
    fechaVencimiento: sub.fecha_vencimiento,
    diasRestantes: Math.max(0, diasRestantes),
    puedeUsarApp: vigente,
    enTrial: sub.estado === "trial" && vigente,
  };
}

export function extensionDays(plan: "mensual" | "anual"): number {
  return plan === "anual" ? 365 : 30;
}

/** Modo local cuando Supabase no esta configurado (desarrollo / demo sin nube). */
export function offlineSubscriptionInfo(): SubscriptionInfo {
  return {
    status: "activa",
    plan: "modo local (sin nube)",
    proveedor: null,
    fechaVencimiento: null,
    diasRestantes: 0,
    puedeUsarApp: true,
    enTrial: false,
  };
}

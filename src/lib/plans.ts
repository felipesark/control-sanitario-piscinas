export type PlanId = "mensual" | "anual";

export interface PlanInfo {
  id: PlanId;
  nombre: string;
  descripcion: string;
  precioCop: number;
  periodo: string;
  ahorro?: string;
}

export const PLANS: PlanInfo[] = [
  {
    id: "mensual",
    nombre: "Plan Mensual",
    descripcion: "1 instalacion, operadores ilimitados, PDF y sincronizacion",
    precioCop: Number(process.env.NEXT_PUBLIC_PRICE_MENSUAL_COP ?? 99000),
    periodo: "mes",
  },
  {
    id: "anual",
    nombre: "Plan Anual",
    descripcion: "Todo incluido con descuento por pago anticipado",
    precioCop: Number(process.env.NEXT_PUBLIC_PRICE_ANUAL_COP ?? 990000),
    periodo: "ano",
    ahorro: "2 meses gratis",
  },
];

export const TRIAL_DAYS = 14;

export function formatCop(amount: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getPlan(planId: PlanId): PlanInfo {
  const plan = PLANS.find((p) => p.id === planId);
  if (!plan) throw new Error("Plan no encontrado");
  return plan;
}

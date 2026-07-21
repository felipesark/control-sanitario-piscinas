import { createAdminClient } from "@/lib/supabase/admin";
import { extensionDays } from "@/lib/subscription";
import type { PlanId } from "@/lib/plans";

export async function activateSubscription(params: {
  userId: string;
  plan: PlanId;
  proveedor: "stripe" | "wompi";
  instalacionId?: string;
  customerId?: string;
  subscriptionId?: string;
  transactionId?: string;
  montoCop?: number;
}): Promise<void> {
  const admin = createAdminClient();
  const days = extensionDays(params.plan);
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + days);

  await admin.from("suscripciones").update({
    estado: "vencida",
    updated_at: new Date().toISOString(),
  }).eq("user_id", params.userId).in("estado", ["trial", "activa"]);

  await admin.from("suscripciones").insert({
    user_id: params.userId,
    instalacion_id: params.instalacionId ?? null,
    plan: params.plan,
    estado: "activa",
    proveedor: params.proveedor,
    proveedor_customer_id: params.customerId ?? null,
    proveedor_subscription_id: params.subscriptionId ?? null,
    proveedor_transaction_id: params.transactionId ?? null,
    monto_cop: params.montoCop ?? null,
    fecha_inicio: new Date().toISOString(),
    fecha_vencimiento: fechaVencimiento.toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (params.instalacionId) {
    await admin.from("profiles").update({
      instalacion_id: params.instalacionId,
    }).eq("id", params.userId);

    await admin.from("instalaciones").upsert({
      id: params.instalacionId,
      user_id: params.userId,
      updated_at: new Date().toISOString(),
    });
  }
}

export async function renewStripeSubscription(params: {
  userId: string;
  subscriptionId: string;
  customerId: string;
  plan: PlanId;
}): Promise<void> {
  const admin = createAdminClient();
  const days = extensionDays(params.plan);
  const fechaVencimiento = new Date();
  fechaVencimiento.setDate(fechaVencimiento.getDate() + days);

  const { data: existing } = await admin
    .from("suscripciones")
    .select("id")
    .eq("proveedor_subscription_id", params.subscriptionId)
    .eq("estado", "activa")
    .maybeSingle();

  if (existing) {
    await admin.from("suscripciones").update({
      fecha_vencimiento: fechaVencimiento.toISOString(),
      updated_at: new Date().toISOString(),
    }).eq("id", existing.id);
  } else {
    await activateSubscription({
      userId: params.userId,
      plan: params.plan,
      proveedor: "stripe",
      customerId: params.customerId,
      subscriptionId: params.subscriptionId,
    });
  }
}

export async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const admin = createAdminClient();
  await admin.from("suscripciones").update({
    estado: "cancelada",
    updated_at: new Date().toISOString(),
  }).eq("proveedor_subscription_id", subscriptionId);
}

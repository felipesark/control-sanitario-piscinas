import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripePortalSession, isStripeConfigured } from "@/lib/stripe";

export async function POST() {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: sub } = await admin
    .from("suscripciones")
    .select("proveedor_customer_id")
    .eq("user_id", user.id)
    .eq("proveedor", "stripe")
    .eq("estado", "activa")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!sub?.proveedor_customer_id) {
    return NextResponse.json({ error: "Sin suscripcion Stripe activa" }, { status: 404 });
  }

  const url = await createStripePortalSession(sub.proveedor_customer_id);
  return NextResponse.json({ url });
}

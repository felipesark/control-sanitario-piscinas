import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createStripeCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import type { PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 503 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json() as { plan?: PlanId; instalacionId?: string };

  if (!body.plan || !["mensual", "anual"].includes(body.plan)) {
    return NextResponse.json({ error: "Plan invalido" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("instalacion_id")
    .eq("id", user.id)
    .maybeSingle();

  const instalacionId = body.instalacionId || profile?.instalacion_id || user.id;

  try {
    const url = await createStripeCheckoutSession({
      userId: user.id,
      email: user.email!,
      plan: body.plan,
      instalacionId,
    });
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

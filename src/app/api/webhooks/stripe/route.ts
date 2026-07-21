import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import { getStripe } from "@/lib/stripe";
import {
  activateSubscription,
  cancelStripeSubscription,
  renewStripeSubscription,
} from "@/lib/subscription-service";
import type { PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const body = await request.text();
  const sig = (await headers()).get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook no configurado" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Firma invalida";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.metadata) {
          await activateSubscription({
            userId: session.metadata.user_id,
            plan: session.metadata.plan as PlanId,
            proveedor: "stripe",
            instalacionId: session.metadata.instalacion_id,
            customerId: session.customer as string,
            subscriptionId: session.subscription as string,
          });
        }
        break;
      }
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | null };
        const subId = invoice.subscription;
        if (!subId) break;
        const sub = await getStripe().subscriptions.retrieve(subId);
        const meta = sub.metadata;
        if (meta.user_id && meta.plan) {
          await renewStripeSubscription({
            userId: meta.user_id,
            subscriptionId: subId,
            customerId: sub.customer as string,
            plan: meta.plan as PlanId,
          });
        }
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await cancelStripeSubscription(sub.id);
        break;
      }
    }
  } catch (e) {
    console.error("Stripe webhook error:", e);
    return NextResponse.json({ error: "Error procesando evento" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
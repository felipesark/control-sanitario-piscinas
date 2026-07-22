import Stripe from "stripe";
import type { PlanId } from "./plans";
import { getAppUrl } from "./app-url";

let stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe {
  if (!stripe) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return stripe;
}

export function getStripePriceId(plan: PlanId): string {
  const id =
    plan === "mensual"
      ? process.env.STRIPE_PRICE_ID_MENSUAL
      : process.env.STRIPE_PRICE_ID_ANUAL;
  if (!id) throw new Error(`STRIPE_PRICE_ID_${plan.toUpperCase()} no configurado`);
  return id;
}

export async function createStripeCheckoutSession(params: {
  userId: string;
  email: string;
  plan: PlanId;
  instalacionId: string;
}): Promise<string> {
  const stripeClient = getStripe();
  const appUrl = getAppUrl();

  const session = await stripeClient.checkout.sessions.create({
    mode: "subscription",
    customer_email: params.email,
    line_items: [{ price: getStripePriceId(params.plan), quantity: 1 }],
    success_url: `${appUrl}/suscripcion?success=stripe&plan=${params.plan}`,
    cancel_url: `${appUrl}/planes?canceled=stripe`,
    metadata: {
      user_id: params.userId,
      plan: params.plan,
      instalacion_id: params.instalacionId,
    },
    subscription_data: {
      metadata: {
        user_id: params.userId,
        plan: params.plan,
        instalacion_id: params.instalacionId,
      },
    },
  });

  if (!session.url) throw new Error("No se pudo crear sesion de Stripe");
  return session.url;
}

export async function createStripePortalSession(customerId: string): Promise<string> {
  const stripeClient = getStripe();
  const appUrl = getAppUrl();
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${appUrl}/suscripcion`,
  });
  return session.url;
}

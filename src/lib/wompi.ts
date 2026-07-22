import crypto from "crypto";
import type { PlanId } from "./plans";
import { getPlan } from "./plans";
import { getAppUrl } from "./app-url";

export function isWompiConfigured(): boolean {
  return Boolean(
    process.env.WOMPI_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
  );
}

function wompiBaseUrl(): string {
  return process.env.WOMPI_API_URL ?? "https://sandbox.wompi.co/v1";
}

interface WompiPaymentLinkResponse {
  data: {
    id: string;
    name: string;
  };
}

export async function createWompiPaymentLink(params: {
  userId: string;
  plan: PlanId;
  instalacionId: string;
}): Promise<{ url: string; linkId: string; reference: string }> {
  const plan = getPlan(params.plan);
  const appUrl = getAppUrl();
  const reference = `csp-${params.userId.slice(0, 8)}-${params.plan}-${Date.now()}`;
  const amountInCents = plan.precioCop * 100;

  const body = {
    name: `Control Sanitario Piscinas - ${plan.nombre}`,
    description: plan.descripcion,
    single_use: true,
    collect_shipping: false,
    currency: "COP",
    amount_in_cents: amountInCents,
    redirect_url: `${appUrl}/suscripcion?success=wompi&plan=${params.plan}&ref=${reference}`,
    reference,
    customer_data: {
      customer_references: [
        { label: "user_id", value: params.userId },
        { label: "plan", value: params.plan },
        { label: "instalacion_id", value: params.instalacionId },
      ],
    },
  };

  const res = await fetch(`${wompiBaseUrl()}/payment_links`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WOMPI_PRIVATE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Wompi error: ${err}`);
  }

  const json = (await res.json()) as WompiPaymentLinkResponse;
  const linkId = json.data.id;
  const checkoutHost = wompiBaseUrl().includes("sandbox")
    ? "https://checkout.wompi.co/l"
    : "https://checkout.wompi.co/l";

  return {
    url: `${checkoutHost}/${linkId}`,
    linkId,
    reference,
  };
}

export function verifyWompiSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const secret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!secret || !signature) return false;

  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return signature === expected;
  } catch {
    return false;
  }
}

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction?: {
      id: string;
      status: string;
      reference: string;
      amount_in_cents: number;
      customer_email?: string;
      customer_data?: { customer_references?: { label: string; value: string }[] };
    };
  };
}

export function parseWompiReferences(
  refs?: { label: string; value: string }[],
): Record<string, string> {
  const map: Record<string, string> = {};
  refs?.forEach((r) => {
    map[r.label] = r.value;
  });
  return map;
}

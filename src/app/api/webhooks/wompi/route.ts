import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { activateSubscription } from "@/lib/subscription-service";
import {
  parseWompiReferences,
  verifyWompiSignature,
  type WompiWebhookEvent,
} from "@/lib/wompi";
import type { PlanId } from "@/lib/plans";

export async function POST(request: Request) {
  const body = await request.text();
  const hdrs = await headers();
  const signature = hdrs.get("x-event-signature-checksum");

  if (!verifyWompiSignature(body, signature)) {
    return NextResponse.json({ error: "Firma invalida" }, { status: 401 });
  }

  const event = JSON.parse(body) as WompiWebhookEvent;

  if (event.event === "transaction.updated") {
    const tx = event.data.transaction;
    if (tx?.status === "APPROVED") {
      const refs = parseWompiReferences(tx.customer_data?.customer_references);
      const userId = refs.user_id;
      const plan = refs.plan as PlanId;
      const instalacionId = refs.instalacion_id;

      if (userId && plan) {
        await activateSubscription({
          userId,
          plan,
          proveedor: "wompi",
          instalacionId,
          transactionId: tx.id,
          montoCop: Math.round(tx.amount_in_cents / 100),
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}

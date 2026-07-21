import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { computeSubscriptionAccess, offlineSubscriptionInfo } from "@/lib/subscription";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      configured: false,
      user: { id: "local", email: "" },
      subscription: offlineSubscriptionInfo(),
    });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({
        configured: true,
        user: null,
        subscription: null,
      });
    }

    const { data: sub, error: subError } = await supabase
      .from("suscripciones")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subError) {
      console.error("subscription/status:", subError.message);
      return NextResponse.json(
        {
          configured: true,
          error: "No se pudo leer la suscripcion. Verifique la tabla suscripciones en Supabase.",
          user: { id: user.id, email: user.email },
          subscription: computeSubscriptionAccess(null),
        },
        { status: 200 },
      );
    }

    return NextResponse.json({
      configured: true,
      user: { id: user.id, email: user.email },
      subscription: computeSubscriptionAccess(sub),
    });
  } catch (error) {
    console.error("subscription/status:", error);
    return NextResponse.json(
      {
        configured: true,
        error: "Error interno al consultar suscripcion",
        subscription: offlineSubscriptionInfo(),
      },
      { status: 500 },
    );
  }
}

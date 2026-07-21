import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/login",
  "/signup",
  "/planes",
  "/auth/callback",
];

const PUBLIC_PREFIXES = [
  "/api/webhooks/",
  "/api/subscription/status",
  "/_next/",
  "/icon",
  "/manifest",
  "/logo-",
];

const STATIC_EXT = /\.(?:png|jpe?g|gif|webp|svg|ico|css|js|map|txt|woff2?)$/i;

function isPublic(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  if (STATIC_EXT.test(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === "/suscripcion" || pathname.startsWith("/api/")) {
    return response;
  }

  const { data: sub } = await supabase
    .from("suscripciones")
    .select("estado, fecha_vencimiento")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const vigente =
    sub &&
    new Date(sub.fecha_vencimiento) > new Date() &&
    (sub.estado === "activa" || sub.estado === "trial");

  if (!vigente && pathname !== "/planes") {
    const planesUrl = request.nextUrl.clone();
    planesUrl.pathname = "/planes";
    planesUrl.searchParams.set("expired", "1");
    return NextResponse.redirect(planesUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|apple-touch-icon\\.png|icon-192\\.png|icon-512\\.png|manifest.json|logo-arespool\\.png|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};

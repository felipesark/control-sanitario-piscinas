/** URL pública de la app (sin BOM ni comillas). */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const cleaned = raw.replace(/^\uFEFF/, "").replace(/^["']|["']$/g, "").trim();
  if (cleaned) return cleaned.replace(/\/$/, "");
  return "http://localhost:3000";
}

/** En el navegador usa el origen actual; en servidor usa NEXT_PUBLIC_APP_URL. */
export function getAuthRedirectUrl(path = "/auth/callback"): string {
  const base =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : getAppUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${normalized}`;
}

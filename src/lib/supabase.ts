export { isSupabaseConfigured, createClient } from "./supabase/client";

import { createClient } from "./supabase/client";

let legacyClient: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  if (!legacyClient) legacyClient = createClient();
  return legacyClient;
}

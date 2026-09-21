import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = fs.readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[line.slice(0, i).trim()] = v.replace(/^\uFEFF/, "");
  }
  return env;
}

const TRIAL_DAYS = 14;
const TARGET_EMAIL = process.argv[2] || null; // null = todos los usuarios

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listErr) {
  console.error("list_users_error=" + listErr.message);
  process.exit(1);
}

let users = listed.users;
if (TARGET_EMAIL) {
  users = users.filter((u) => (u.email || "").toLowerCase() === TARGET_EMAIL.toLowerCase());
  if (!users.length) {
    console.error("user_not_found=" + TARGET_EMAIL);
    process.exit(1);
  }
}

const now = new Date();
const vencimiento = new Date(now);
vencimiento.setDate(vencimiento.getDate() + TRIAL_DAYS);

let ok = 0;
for (const user of users) {
  // Marcar suscripciones previas como vencidas
  await admin
    .from("suscripciones")
    .update({ estado: "vencida", updated_at: now.toISOString() })
    .eq("user_id", user.id)
    .in("estado", ["trial", "activa"]);

  const { error: insErr } = await admin.from("suscripciones").insert({
    user_id: user.id,
    plan: "trial",
    estado: "trial",
    proveedor: "trial",
    fecha_inicio: now.toISOString(),
    fecha_vencimiento: vencimiento.toISOString(),
    updated_at: now.toISOString(),
  });

  if (insErr) {
    console.error(`fail ${user.email}: ${insErr.message}`);
    continue;
  }
  ok++;
  console.log(`ok ${user.email} trial_until=${vencimiento.toISOString()}`);
}

console.log(`done ${ok}/${users.length}`);

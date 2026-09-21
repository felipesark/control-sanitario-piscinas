import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const p = path.join(process.cwd(), ".env.local");
  const raw = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    if (!line || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    let v = line.slice(i + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    env[k] = v.replace(/^\uFEFF/, "");
  }
  return env;
}

function extensionDays(plan) {
  if (plan === "anual") return 365;
  if (plan === "mensual") return 30;
  return 14; // trial u otros
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: rows, error } = await admin
  .from("suscripciones")
  .select("id,user_id,plan,estado,fecha_vencimiento,created_at")
  .in("estado", ["activa", "trial"])
  .order("created_at", { ascending: false });

if (error) {
  console.error("Error leyendo suscripciones:", error.message);
  process.exit(1);
}

// Una fila por usuario (la más reciente activa/trial)
const byUser = new Map();
for (const row of rows ?? []) {
  if (!byUser.has(row.user_id)) byUser.set(row.user_id, row);
}

const today = new Date();
const updates = [];

for (const row of byUser.values()) {
  const days = extensionDays(row.plan);
  const fechaVencimiento = new Date(today);
  fechaVencimiento.setDate(fechaVencimiento.getDate() + days);
  updates.push({
    id: row.id,
    user_id: row.user_id,
    plan: row.plan,
    estado_prev: row.estado,
    fecha_prev: row.fecha_vencimiento,
    fecha_nueva: fechaVencimiento.toISOString(),
    days,
  });
}

console.log(`Usuarios activos/trial a renovar: ${updates.length}`);
for (const u of updates) {
  console.log(
    `- ${u.user_id.slice(0, 8)}… plan=${u.plan} ${u.estado_prev} ${u.fecha_prev} -> ${u.fecha_nueva} (+${u.days}d)`,
  );
}

let ok = 0;
for (const u of updates) {
  const { error: upErr } = await admin
    .from("suscripciones")
    .update({
      estado: "activa",
      fecha_inicio: today.toISOString(),
      fecha_vencimiento: u.fecha_nueva,
      updated_at: new Date().toISOString(),
    })
    .eq("id", u.id);

  if (upErr) {
    console.error(`Fallo ${u.id}:`, upErr.message);
  } else {
    ok++;
  }
}

console.log(`Renovadas correctamente: ${ok}/${updates.length}`);

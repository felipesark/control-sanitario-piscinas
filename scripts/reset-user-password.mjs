import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

const email = process.argv[2];
const password = process.argv[3] || `Temp-${crypto.randomBytes(4).toString("hex")}!`;

if (!email) {
  console.error("Uso: node scripts/reset-user-password.mjs <email> [password]");
  process.exit(1);
}

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
if (listErr) {
  console.error("Error listando usuarios:", listErr.message);
  process.exit(1);
}

const user = listed.users.find((u) => (u.email || "").toLowerCase() === email.toLowerCase());
if (!user) {
  console.error(`No se encontró usuario: ${email}`);
  process.exit(1);
}

const { data, error } = await admin.auth.admin.updateUserById(user.id, {
  password,
  email_confirm: true,
});

if (error) {
  console.error("Error actualizando contraseña:", error.message);
  process.exit(1);
}

console.log(`OK usuario=${data.user.email} id=${data.user.id}`);
console.log(`PASSWORD=${password}`);

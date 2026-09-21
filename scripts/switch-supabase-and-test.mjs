import fs from "fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv() {
  const raw = fs.readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
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

const newUrl = "https://geguxvqjaoqceasgzefd.supabase.co";
let raw = fs.readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
if (/^NEXT_PUBLIC_SUPABASE_URL=/m.test(raw)) {
  raw = raw.replace(/^NEXT_PUBLIC_SUPABASE_URL=.*$/m, `NEXT_PUBLIC_SUPABASE_URL=${newUrl}`);
} else {
  raw += `\nNEXT_PUBLIC_SUPABASE_URL=${newUrl}\n`;
}
fs.writeFileSync(".env.local", raw, "utf8");
console.log("url_updated=" + newUrl);

const env = loadEnv();
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 10 });
if (error) {
  console.log("admin_error=" + error.message);
  process.exit(1);
}
console.log("users=" + data.users.length);
for (const u of data.users.slice(0, 10)) {
  console.log("- " + (u.email || u.id));
}

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
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    env[line.slice(0, i).trim()] = v.replace(/^\uFEFF/, "");
  }
  return env;
}

const env = loadEnv();
const password = process.argv[2];
const client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
const { data, error } = await client.auth.signInWithPassword({
  email: "andres.felipe0921@gmail.com",
  password,
});
if (error) {
  console.log("login_err=" + error.message);
  process.exit(1);
}
console.log("login_ok=" + data.user.email);

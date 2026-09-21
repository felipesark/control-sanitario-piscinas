import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const NEW_URL = "https://geguxvqjaoqceasgzefd.supabase.co";
const ANON = process.env.NEW_ANON;
const SERVICE = process.env.NEW_SERVICE;
const EMAIL = "andres.felipe0921@gmail.com";

if (!ANON || !SERVICE) {
  console.error("missing keys");
  process.exit(1);
}

let raw = fs.readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
const set = (key, value) => {
  const line = `${key}=${value}`;
  if (new RegExp(`^${key}=`, "m").test(raw)) {
    raw = raw.replace(new RegExp(`^${key}=.*$`, "m"), line);
  } else {
    raw += `\n${line}\n`;
  }
};
set("NEXT_PUBLIC_SUPABASE_URL", NEW_URL);
set("NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON);
set("SUPABASE_SERVICE_ROLE_KEY", SERVICE);
fs.writeFileSync(".env.local", raw, "utf8");
console.log("env_updated");

const admin = createClient(NEW_URL, SERVICE, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 200,
});
if (listErr) {
  console.error("list_error=" + listErr.message);
  process.exit(1);
}

console.log("users_total=" + listed.users.length);
for (const u of listed.users) {
  console.log("- " + (u.email || u.id));
}

let user = listed.users.find((u) => (u.email || "").toLowerCase() === EMAIL.toLowerCase());
const password = `Arespool-${crypto.randomBytes(3).toString("hex")}!`;

if (!user) {
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email: EMAIL,
    password,
    email_confirm: true,
  });
  if (createErr) {
    console.error("create_error=" + createErr.message);
    process.exit(1);
  }
  user = created.user;
  console.log("user_created=" + user.email);
} else {
  const { error: upErr } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
  });
  if (upErr) {
    console.error("update_error=" + upErr.message);
    process.exit(1);
  }
  console.log("password_reset=" + user.email);
}

console.log("PASSWORD=" + password);
console.log("USER_ID=" + user.id);

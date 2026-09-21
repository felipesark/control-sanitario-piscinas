import fs from "fs";
import dns from "dns/promises";

const raw = fs.readFileSync(".env.local", "utf8").replace(/^\uFEFF/, "");
const urlLine = raw.split(/\r?\n/).find((l) => l.startsWith("NEXT_PUBLIC_SUPABASE_URL="));
const url = (urlLine?.split("=").slice(1).join("=") || "").trim().replace(/^["']|["']$/g, "").replace(/^\uFEFF/, "");
let host = "";
try {
  host = new URL(url).host;
} catch {
  console.log("URL_INVALID");
  process.exit(1);
}
console.log("host=" + host);
console.log("has_service=" + /SUPABASE_SERVICE_ROLE_KEY=.+/m.test(raw));
try {
  const r = await dns.lookup(host);
  console.log("dns_ok=" + r.address);
} catch (e) {
  console.log("dns_fail=" + e.code);
}

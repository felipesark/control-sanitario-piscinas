import fs from "fs";

const path = ".env.local";
let raw = fs.readFileSync(path, "utf8").replace(/^\uFEFF/, "");
const newUrl = "https://geguxvqjaoqceasgzefd.supabase.co";
raw = raw.replace(
  /^NEXT_PUBLIC_SUPABASE_URL=.*$/m,
  `NEXT_PUBLIC_SUPABASE_URL=${newUrl}`,
);
fs.writeFileSync(path, raw, "utf8");
console.log("updated_url_ok");

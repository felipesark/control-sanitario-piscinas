import { execSync } from "child_process";

const URL = "https://geguxvqjaoqceasgzefd.supabase.co";
const ANON = process.env.NEW_ANON;
const SERVICE = process.env.NEW_SERVICE;
const envs = ["production", "preview", "development"];

function setEnv(name, value, target) {
  try {
    execSync(`npx --yes vercel env rm ${name} ${target} --yes`, {
      stdio: "ignore",
      shell: true,
    });
  } catch {}
  execSync(`npx --yes vercel env add ${name} ${target}`, {
    input: Buffer.from(value, "utf8"),
    stdio: ["pipe", "ignore", "ignore"],
    shell: true,
  });
  console.log(`set ${name} ${target}`);
}

for (const target of envs) {
  setEnv("NEXT_PUBLIC_SUPABASE_URL", URL, target);
  setEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", ANON, target);
  setEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE, target);
}
console.log("vercel_env_done");

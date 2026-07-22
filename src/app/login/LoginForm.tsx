"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AppShell";

const fieldClass = "mb-5 block";
const labelClass = "mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-white/90";
const inputClass =
  "w-full border-0 border-b-[1.5px] border-white/55 bg-transparent px-0 py-2.5 text-white outline-none transition placeholder:text-white/40 focus:border-[#48b4e4] focus:shadow-[0_1px_0_0_#48b4e4]";
const submitClass =
  "mt-2 w-full rounded-full border border-white/35 bg-white/15 px-5 py-3.5 text-base font-bold text-white backdrop-blur-md transition hover:border-[#48b4e4]/70 hover:bg-white/25 hover:-translate-y-px disabled:opacity-65";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Iniciar sesión" subtitle="Supabase no configurado">
        <p className="mb-4 text-sm text-[#ffd0d0]">
          Configure NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local
        </p>
        <p className="mt-5 text-center text-sm text-white/80">
          <Link href="/" className="font-bold text-white underline underline-offset-4 hover:text-[#48b4e4]">
            Volver al inicio
          </Link>
        </p>
      </AuthShell>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(redirect);
    router.refresh();
  };

  return (
    <AuthShell title="Iniciar sesión" subtitle="Acceda a su libro de control sanitario">
      <form onSubmit={handleLogin}>
        <label className={fieldClass}>
          <span className={labelClass}>Correo electrónico</span>
          <input
            className={inputClass}
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operador@piscina.com"
            required
          />
        </label>
        <label className={fieldClass}>
          <span className={labelClass}>Contraseña</span>
          <input
            className={inputClass}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {error ? <p className="mb-4 text-sm text-[#ffd0d0]">{error}</p> : null}
        <button type="submit" className={submitClass} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
        <p className="mt-5 text-center text-sm text-white/80">
          ¿No tiene cuenta?{" "}
          <Link href="/signup" className="font-bold text-white underline underline-offset-4 hover:text-[#48b4e4]">
            Registrarse gratis
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

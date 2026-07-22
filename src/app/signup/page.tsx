"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AppShell";
import { TRIAL_DAYS } from "@/lib/plans";

const fieldClass = "mb-5 block";
const labelClass = "mb-1.5 block text-[0.82rem] font-semibold tracking-wide text-white/90";
const inputClass =
  "w-full border-0 border-b-[1.5px] border-white/55 bg-transparent px-0 py-2.5 text-white outline-none transition placeholder:text-white/40 focus:border-[#48b4e4] focus:shadow-[0_1px_0_0_#48b4e4]";
const submitClass =
  "mt-2 w-full rounded-full border border-white/35 bg-white/15 px-5 py-3.5 text-base font-bold text-white backdrop-blur-md transition hover:border-[#48b4e4]/70 hover:bg-white/25 hover:-translate-y-px disabled:opacity-65";

function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push("/");
    router.refresh();
  };

  return (
    <form onSubmit={handleSignup}>
      <div className="mb-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white/90">
        Prueba gratis por {TRIAL_DAYS} días. Sin tarjeta de crédito.
      </div>
      <label className={fieldClass}>
        <span className={labelClass}>Nombre completo</span>
        <input
          className={inputClass}
          type="text"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>Correo electrónico</span>
        <input
          className={inputClass}
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </label>
      <label className={fieldClass}>
        <span className={labelClass}>Contraseña (mín. 6 caracteres)</span>
        <input
          className={inputClass}
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
      </label>
      {error ? <p className="mb-4 text-sm text-[#ffd0d0]">{error}</p> : null}
      <button type="submit" className={submitClass} disabled={loading}>
        {loading ? "Creando cuenta..." : "Crear cuenta"}
      </button>
      <p className="mt-5 text-center text-sm text-white/80">
        ¿Ya tiene cuenta?{" "}
        <Link href="/login" className="font-bold text-white underline underline-offset-4 hover:text-[#48b4e4]">
          Iniciar sesión
        </Link>
      </p>
    </form>
  );
}

export default function SignupPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Crear cuenta" subtitle="Supabase no configurado">
        <p className="mt-5 text-center text-sm text-white/80">
          <Link href="/" className="font-bold text-white underline underline-offset-4 hover:text-[#48b4e4]">
            Volver
          </Link>
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Empiece su prueba gratuita hoy">
      <Suspense fallback={<p className="text-white/80">Cargando...</p>}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}

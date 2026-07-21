"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AppShell";
import { Field, SaveButton, TextInput } from "@/components/ui";
import { TRIAL_DAYS } from "@/lib/plans";

function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
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
    <div className="space-y-4">
      <div className="rounded-xl bg-[var(--foam)] p-3 text-sm text-[var(--deep)]">
        Prueba gratis por {TRIAL_DAYS} dias. Sin tarjeta de credito.
      </div>
      <Field label="Nombre completo">
        <TextInput value={fullName} onChange={(e) => setFullName(e.target.value)} />
      </Field>
      <Field label="Correo electronico">
        <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      </Field>
      <Field label="Contrasena (min. 6 caracteres)">
        <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <SaveButton onClick={handleSignup} saving={loading} label="Crear cuenta gratis" />
      <p className="text-center text-sm text-[var(--muted)]">
        Ya tiene cuenta?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          Iniciar sesion
        </Link>
      </p>
    </div>
  );
}

export default function SignupPage() {
  if (!isSupabaseConfigured()) {
    return (
      <AuthShell title="Registro" subtitle="Supabase no configurado">
        <Link href="/" className="text-[var(--accent)]">
          Volver
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Crear cuenta" subtitle="Empiece su prueba gratuita hoy">
      <Suspense fallback={<div>Cargando...</div>}>
        <SignupForm />
      </Suspense>
    </AuthShell>
  );
}

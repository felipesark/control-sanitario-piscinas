"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { AuthShell } from "@/components/AppShell";
import { Field, SaveButton, TextInput } from "@/components/ui";

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
      <AuthShell title="Login" subtitle="Supabase no configurado">
        <p className="text-sm text-[var(--muted)]">
          Configure NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local
        </p>
        <Link href="/" className="mt-4 inline-block text-[var(--accent)]">
          Volver al inicio
        </Link>
      </AuthShell>
    );
  }

  const handleLogin = async () => {
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
    <AuthShell title="Iniciar sesion" subtitle="Acceda a su libro de control sanitario">
      <div className="space-y-4">
        <Field label="Correo electronico">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="operador@piscina.com"
          />
        </Field>
        <Field label="Contrasena">
          <TextInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <SaveButton onClick={handleLogin} saving={loading} label="Entrar" />
        <p className="text-center text-sm text-[var(--muted)]">
          No tiene cuenta?{" "}
          <Link href="/signup" className="font-semibold text-[var(--accent)]">
            Registrarse gratis
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}

/** Mensajes de Auth de Supabase en español para el usuario final. */
export function formatAuthError(message: string): string {
  const m = message.toLowerCase();

  if (
    m.includes("failed to fetch") ||
    m.includes("networkerror") ||
    m.includes("fetch failed") ||
    m.includes("network request failed")
  ) {
    return "No se pudo conectar con Supabase. El proyecto de base de datos no está disponible o la URL es incorrecta. Revisa el proyecto en supabase.com/dashboard.";
  }
  if (m.includes("email rate limit exceeded") || m.includes("over_email_send_rate_limit")) {
    return "Se alcanzó el límite de correos de Supabase (pocos por hora). Espera unos minutos o desactiva temporalmente la confirmación de email en Authentication → Providers → Email.";
  }
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Este correo ya está registrado. Intenta iniciar sesión.";
  }
  if (m.includes("invalid login credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (m.includes("email not confirmed")) {
    return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.";
  }
  if (m.includes("password should be at least")) {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (m.includes("unable to validate email") || m.includes("invalid email")) {
    return "El correo electrónico no es válido.";
  }

  return message;
}

interface AppHeaderProps {
  title: string;
  subtitle?: string;
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--deep)] px-4 py-4 text-white safe-top">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--foam)]/70">
        Control Sanitario - Antioquia
      </p>
      <h1 className="mt-1 font-display text-2xl font-bold leading-tight">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm text-[var(--foam)]/80">{subtitle}</p>
      ) : null}
    </header>
  );
}
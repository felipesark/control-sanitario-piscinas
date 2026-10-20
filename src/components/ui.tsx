interface SectionCardProps { title: string; description?: string; children: React.ReactNode; }
export function SectionCard({ title, description, children }: SectionCardProps) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <div className="mb-4">
        <h2 className="font-display text-lg font-semibold text-[var(--deep)]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

interface FieldProps { label: string; hint?: string; invalid?: boolean; children: React.ReactNode; }
export function Field({ label, hint, invalid, children }: FieldProps) {
  return (
    <label
      data-invalid={invalid || undefined}
      className={`block ${invalid ? "[&_input]:border-red-500 [&_input]:ring-2 [&_input]:ring-red-500/20 [&_select]:border-red-500 [&_select]:ring-2 [&_select]:ring-red-500/20 [&_textarea]:border-red-500 [&_textarea]:ring-2 [&_textarea]:ring-red-500/20" : ""}`}
    >
      <span className={`mb-1.5 block text-sm font-medium ${invalid ? "text-red-600" : "text-[var(--foreground)]"}`}>{label}</span>
      {children}
      {invalid ? <span className="mt-1 block text-xs font-medium text-red-600">Falta completar este campo</span> : null}
      {hint ? <span className="mt-1 block text-xs text-[var(--muted)]">{hint}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props} className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ""}`} />
  );
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <TextInput type="number" inputMode="decimal" step="any" {...props} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...props} className={`min-h-24 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ""}`} />
  );
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select {...props} className={`w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-base text-[var(--foreground)] outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 ${props.className ?? ""}`} />
  );
}

const BADGE_COLORS: Record<string, string> = {
  Diaria: "bg-blue-600 text-white",
  Semanal: "bg-orange-500 text-white",
  Mensual: "bg-violet-600 text-white",
  Trimestral: "bg-teal-600 text-white",
  Anual: "bg-rose-600 text-white",
  Eventual: "bg-slate-500 text-white",
};

export function FrecuenciaBadge({ label }: { label: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${BADGE_COLORS[label] ?? "bg-[var(--foam)] text-[var(--deep)]"}`}>{label}</span>;
}

export function ToggleRow({ label, checked, onChange, badge }: { label: string; checked: boolean; onChange: (value: boolean) => void; badge?: string; }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition ${checked ? "border-[var(--accent)] bg-[var(--accent)]/10" : "border-[var(--border)] bg-[var(--surface)]"}`}>
      <span className="pr-3 text-sm font-medium text-[var(--foreground)]">{label}</span>
      <span className="flex items-center gap-2">
        {badge ? <FrecuenciaBadge label={badge} /> : null}
        <span className={`flex h-6 w-11 items-center rounded-full p-0.5 transition ${checked ? "bg-[var(--accent)]" : "bg-[var(--border)]"}`}>
          <span className={`h-5 w-5 rounded-full bg-[var(--surface-elevated)] shadow transition ${checked ? "translate-x-5" : "translate-x-0"}`} />
        </span>
      </span>
    </button>
  );
}

export function AceptableSelect({ value, onChange }: { value: "aceptable" | "no_aceptable" | null; onChange: (value: "aceptable" | "no_aceptable" | null) => void; }) {
  return (
    <SelectInput value={value ?? ""} onChange={(e) => { const v = e.target.value; onChange(v === "" ? null : (v as "aceptable" | "no_aceptable")); }}>
      <option value="">Sin registrar</option>
      <option value="aceptable">Aceptable</option>
      <option value="no_aceptable">No aceptable</option>
    </SelectInput>
  );
}

export function SaveButton({ onClick, saving, label = "Guardar registro" }: { onClick: () => void; saving?: boolean; label?: string; }) {
  return (
    <button type="button" onClick={onClick} disabled={saving} className="w-full rounded-2xl bg-[var(--accent)] px-4 py-3.5 text-base font-semibold text-white shadow-lg shadow-[var(--accent)]/25 transition hover:brightness-105 disabled:opacity-60">
      {saving ? "Guardando..." : label}
    </button>
  );
}
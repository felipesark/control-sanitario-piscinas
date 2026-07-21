"use client";
import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { BottomNav } from "@/components/BottomNav";
import { Field, SaveButton, SectionCard, TextArea, TextInput } from "@/components/ui";
import type { VisitaInspeccion } from "@/lib/types";
import { deleteVisita, listVisitas, saveVisita } from "@/lib/storage";

function emptyVisita(): VisitaInspeccion {
  return { id: crypto.randomUUID(), fecha: new Date().toISOString().slice(0, 10), hora: "", autoridadSanitaria: "", conceptoEmitido: "", funcionarioNombre: "", funcionarioCargo: "" };
}

export default function VisitasPage() {
  const [visitas, setVisitas] = useState<VisitaInspeccion[]>([]);
  const [form, setForm] = useState<VisitaInspeccion>(emptyVisita());
  const [saved, setSaved] = useState(false);
  const load = () => setVisitas(listVisitas());
  useEffect(() => { load(); }, []);
  const handleSave = () => { saveVisita(form); setForm(emptyVisita()); setSaved(true); load(); setTimeout(() => setSaved(false), 2000); };
  const handleDelete = (id: string) => { deleteVisita(id); load(); };

  return (
    <main className="page-shell mx-auto max-w-lg">
      <AppHeader title="Visitas de inspeccion" subtitle="Registro de visitas de autoridades sanitarias" />
      <div className="space-y-4 p-4">
        <SectionCard title="Nueva visita">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Fecha"><TextInput type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} /></Field>
            <Field label="Hora"><TextInput type="time" value={form.hora} onChange={(e) => setForm({ ...form, hora: e.target.value })} /></Field>
          </div>
          <Field label="Nombre autoridad sanitaria"><TextInput value={form.autoridadSanitaria} onChange={(e) => setForm({ ...form, autoridadSanitaria: e.target.value })} /></Field>
          <Field label="Concepto emitido"><TextArea value={form.conceptoEmitido} onChange={(e) => setForm({ ...form, conceptoEmitido: e.target.value })} /></Field>
          <Field label="Nombre del funcionario"><TextInput value={form.funcionarioNombre} onChange={(e) => setForm({ ...form, funcionarioNombre: e.target.value })} /></Field>
          <Field label="Cargo del funcionario"><TextInput value={form.funcionarioCargo} onChange={(e) => setForm({ ...form, funcionarioCargo: e.target.value })} /></Field>
          {saved ? <p className="text-sm text-emerald-700">Visita registrada</p> : null}
          <SaveButton onClick={handleSave} label="Registrar visita" />
        </SectionCard>
        <SectionCard title="Historial de visitas">
          {visitas.length === 0 ? <p className="text-sm text-[var(--muted)]">No hay visitas registradas.</p> : visitas.map((v) => (
            <div key={v.id} className="rounded-xl border border-[var(--border)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-[var(--deep)]">{v.autoridadSanitaria || "Sin autoridad"}</p>
                  <p className="text-sm text-[var(--muted)]">{v.fecha} - {v.hora || "-"}</p>
                </div>
                <button type="button" onClick={() => handleDelete(v.id)} className="text-xs text-[var(--alert)]">Eliminar</button>
              </div>
              <p className="mt-2 text-sm">{v.conceptoEmitido || "Sin concepto"}</p>
              <p className="mt-1 text-xs text-[var(--muted)]">{v.funcionarioNombre} - {v.funcionarioCargo}</p>
            </div>
          ))}
        </SectionCard>
      </div>
      <BottomNav active="/visitas" />
    </main>
  );
}
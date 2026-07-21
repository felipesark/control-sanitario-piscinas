"use client";

import type { Alerta } from "@/lib/rangos-legales";

interface AlertasPanelProps {
  alertas: Alerta[];
  compact?: boolean;
}

export function AlertasPanel({ alertas, compact }: AlertasPanelProps) {
  if (alertas.length === 0) {
    return (
      <div className={`rounded-xl bg-emerald-50 px-3 py-2 ${compact ? "text-xs" : "text-sm"} text-emerald-800`}>
        Todos los parametros dentro del rango legal
      </div>
    );
  }

  const criticos = alertas.filter((a) => a.nivel === "critico").length;

  return (
    <div className="space-y-2">
      <div className={`rounded-xl px-3 py-2 ${criticos > 0 ? "bg-red-50 text-red-800" : "bg-amber-50 text-amber-800"} ${compact ? "text-xs" : "text-sm"}`}>
        {criticos > 0
          ? `${criticos} alerta(s) critica(s) - accion inmediata requerida`
          : `${alertas.length} advertencia(s) sanitarias`}
      </div>
      {!compact && alertas.map((a) => (
        <div
          key={a.id}
          className={`rounded-xl border px-3 py-2 text-sm ${
            a.nivel === "critico"
              ? "border-red-200 bg-red-50 text-red-900"
              : "border-amber-200 bg-amber-50 text-amber-900"
          }`}
        >
          <p className="font-semibold">{a.campo}</p>
          <p className="mt-0.5">{a.mensaje}</p>
          <p className="mt-1 text-xs opacity-70">{a.norma}</p>
        </div>
      ))}
    </div>
  );
}
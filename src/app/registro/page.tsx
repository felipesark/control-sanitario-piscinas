"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RegistroForm } from "@/components/RegistroForm";
import { useAppData } from "@/hooks/useAppData";
import { getInstalacionActiva, getZonaDeInstalacion } from "@/lib/instalaciones";
import { formatFechaHoy, formatFechaLegible, setInstalacionActiva } from "@/lib/storage";

function RegistroContent() {
  const searchParams = useSearchParams();
  const fechaParam = searchParams.get("fecha");
  const { data, refresh } = useAppData();
  const [fecha, setFecha] = useState(fechaParam || formatFechaHoy());

  if (!data) {
    return <div className="p-4 text-sm text-[var(--muted)]">Cargando...</div>;
  }

  const instalacion = getInstalacionActiva(data);
  const zona = getZonaDeInstalacion(data, instalacion);
  const operadores = data.establecimiento.operadores.map((op) => ({
    id: op.id,
    nombre: op.nombre,
  }));
  const salvavidas = data.establecimiento.salvavidas.map((s) => ({
    id: s.id,
    nombre: s.nombre,
  }));

  return (
    <AppShell
      active="/registro"
      title="Registro diario"
      subtitle={`${formatFechaLegible(fecha)} · ${instalacion.nombre}`}
      width="narrow"
    >
      <div className="space-y-4">
        <label className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <span className="mb-2 block text-sm font-medium">Instalacion (libro independiente)</span>
          <select
            value={instalacion.id}
            onChange={(e) => {
              setInstalacionActiva(e.target.value);
              refresh();
            }}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
          >
            {data.instalaciones.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nombre} · {inst.tipoEstructura} · {inst.presentacion}
              </option>
            ))}
          </select>
        </label>

        <label className="block rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5">
          <span className="mb-2 block text-sm font-medium">Seleccionar fecha</span>
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="w-full rounded-xl border border-[var(--border)] px-3 py-2.5"
          />
        </label>

        {operadores.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
            Agregue operadores en Configuracion para asignarlos al registro.
          </p>
        ) : null}

        <RegistroForm
          key={`${instalacion.id}-${fecha}`}
          fecha={fecha}
          instalacion={instalacion}
          zonaHumedaNombre={zona.nombre}
          catalogoRangos={data.rangosCatalogo}
          operadores={operadores}
          salvavidas={salvavidas}
          onSaved={refresh}
        />
      </div>
    </AppShell>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm">Cargando...</div>}>
      <RegistroContent />
    </Suspense>
  );
}

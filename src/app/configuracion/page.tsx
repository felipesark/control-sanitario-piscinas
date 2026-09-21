"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Field, NumberInput, SaveButton, SectionCard, TextInput, ToggleRow } from "@/components/ui";
import type { ConfiguracionInstalacion, Operador } from "@/lib/types";
import { defaultConfiguracion } from "@/lib/defaults";
import { getAppData, loadSampleData, saveConfiguracion, saveRangosCatalogo, setAppData, setInstalacionActiva } from "@/lib/storage";
import { agregarInstalacion } from "@/lib/instalaciones";
import { fusionarBorradorOcr, resumenEstadoCatalogo } from "@/lib/rangos-legales";
import { getSyncStatus, sincronizarConNube } from "@/lib/sync";

function parseNum(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function ConfiguracionPage() {
  const [config, setConfig] = useState<ConfiguracionInstalacion>(defaultConfiguracion());
  const [saved, setSaved] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncing, setSyncing] = useState(false);
  const syncStatus = getSyncStatus();

  useEffect(() => {
    setConfig(getAppData().configuracion);
  }, []);

  const update = (partial: Partial<ConfiguracionInstalacion>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
    setSaved(false);
  };

  const addOperador = (tipo: "operadores" | "salvavidas") => {
    const nuevo: Operador = { id: crypto.randomUUID(), nombre: "", identificacion: "" };
    update({ [tipo]: [...config[tipo], nuevo] });
  };

  const updateOperador = (
    tipo: "operadores" | "salvavidas",
    id: string,
    partial: Partial<Operador>,
  ) => {
    update({
      [tipo]: config[tipo].map((op) => (op.id === id ? { ...op, ...partial } : op)),
    });
  };

  const removeOperador = (tipo: "operadores" | "salvavidas", id: string) => {
    update({ [tipo]: config[tipo].filter((op) => op.id !== id) });
  };

  const handleSave = () => {
    saveConfiguracion(config);
    setSaved(true);
  };

  const handleLoadSample = () => {
    loadSampleData();
    setConfig(getAppData().configuracion);
    setSaved(true);
  };

  const handleAddInstalacion = () => {
    handleSave();
    const next = agregarInstalacion(getAppData(), {
      nombre: `Instalacion ${getAppData().instalaciones.length + 1}`,
    });
    setAppData(next);
    setConfig(next.configuracion);
    setSaved(true);
  };

  const handleSelectInstalacion = (id: string) => {
    handleSave();
    setInstalacionActiva(id);
    setConfig(getAppData().configuracion);
  };

  const handleSync = async () => {
    setSyncing(true);
    const result = await sincronizarConNube();
    setSyncMsg(result.message);
    setSyncing(false);
  };

  return (
    <AppShell
      active="/configuracion"
      title="Configuración"
      subtitle="Datos de la instalación según el encabezado del libro estándar"
      width="wide"
    >
      <div className="mx-auto max-w-3xl space-y-4 lg:space-y-6">
        <SectionCard
          title="Motor de rangos (Res. 234 / 2026)"
          description="Tabla configurable por tipo y categoria. Produccion deshabilitada hasta confirmacion visual del Anexo Tecnico I."
        >
          {(() => {
            const cat = getAppData().rangosCatalogo;
            const estado = resumenEstadoCatalogo(cat);
            return (
              <>
                <p className="rounded-xl bg-sky-50 px-3 py-2 text-sm text-sky-900">{estado.mensaje}</p>
                <p className="text-xs text-[var(--muted)]">
                  Version: {cat.version} · Confirmadas activas: {estado.confirmadas} · Borradores OCR:{" "}
                  {estado.borradores}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const next = fusionarBorradorOcr(getAppData().rangosCatalogo);
                    saveRangosCatalogo(next);
                    setSaved(true);
                  }}
                  className="w-full rounded-xl border border-dashed border-[var(--accent)] py-2 text-sm font-medium text-[var(--accent)]"
                >
                  Cargar borrador OCR (sin activar produccion)
                </button>
                <p className="text-xs text-[var(--muted)]">
                  El borrador incluye el conflicto de cloro libre (0.2-3.0 vs 2.0-4.0). No marca filas como
                  confirmadas ni habilita alarmas. Siguiente paso: foto del Anexo Tecnico I y confirmacion
                  humana fila a fila.
                </p>
              </>
            );
          })()}
        </SectionCard>

        <SectionCard title="Datos de demostracion y sincronizacion">
          <p className="text-sm text-[var(--muted)]">
            Cargue datos de ejemplo para probar la app completa, o sincronice con Supabase en la nube.
          </p>
          <button
            type="button"
            onClick={handleLoadSample}
            className="w-full rounded-xl border border-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent)]"
          >
            Cargar datos de ejemplo (Club Campestre)
          </button>
          <div className="rounded-xl bg-[var(--foam)] p-3 text-sm">
            <p className="font-medium text-[var(--deep)]">
              Nube: {syncStatus.configured ? "Supabase configurado" : "Sin configurar (.env.local)"}
            </p>
            {syncStatus.lastSync ? (
              <p className="mt-1 text-[var(--muted)]">
                Ultima sync: {new Date(syncStatus.lastSync).toLocaleString("es-CO")}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={handleSync}
            disabled={syncing || !syncStatus.configured}
            className="w-full rounded-xl bg-[var(--deep)] py-2.5 text-sm font-semibold text-white disabled:opacity-50"
          >
            {syncing ? "Sincronizando..." : "Sincronizar con la nube"}
          </button>
          {syncMsg ? <p className="text-sm text-[var(--muted)]">{syncMsg}</p> : null}
        </SectionCard>

        <SectionCard title="Instalaciones del establecimiento" description="Cada una tiene su propio libro diario.">
          <select
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
            value={getAppData().instalacionActivaId}
            onChange={(e) => handleSelectInstalacion(e.target.value)}
          >
            {getAppData().instalaciones.map((inst) => (
              <option key={inst.id} value={inst.id}>
                {inst.nombre} · {inst.tipoEstructura}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddInstalacion}
            className="w-full rounded-xl border border-dashed border-[var(--accent)] py-2 text-sm font-medium text-[var(--accent)]"
          >
            + Agregar instalacion (piscina, spa, etc.)
          </button>
        </SectionCard>

        <SectionCard title="Datos de la empresa">
          {[
            ["razonSocial", "Razón social"],
            ["representanteLegal", "Representante legal / propietario"],
            ["administrador", "Administrador"],
            ["direccion", "Dirección"],
            ["municipio", "Municipio"],
            ["localidad", "Localidad"],
            ["telefonoFijo", "Teléfono fijo"],
            ["telefonoMovil", "Teléfono móvil"],
            ["nit", "NIT"],
            ["email", "Correo electrónico"],
          ].map(([key, label]) => (
            <Field key={key} label={label}>
              <TextInput
                value={config[key as keyof ConfiguracionInstalacion] as string}
                onChange={(e) => update({ [key]: e.target.value })}
              />
            </Field>
          ))}
        </SectionCard>

        <SectionCard title="Operadores responsables (OPR)">
          {config.operadores.map((op, i) => (
            <div key={op.id} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Operador {i + 1}</p>
              <Field label="Nombre">
                <TextInput
                  value={op.nombre}
                  onChange={(e) => updateOperador("operadores", op.id, { nombre: e.target.value })}
                />
              </Field>
              <Field label="Número de identificación">
                <TextInput
                  value={op.identificacion}
                  onChange={(e) =>
                    updateOperador("operadores", op.id, { identificacion: e.target.value })
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() => removeOperador("operadores", op.id)}
                className="text-sm text-[var(--alert)]"
              >
                Eliminar operador
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addOperador("operadores")}
            className="w-full rounded-xl border border-dashed border-[var(--accent)] py-2 text-sm font-medium text-[var(--accent)]"
          >
            + Agregar operador
          </button>
        </SectionCard>

        <SectionCard title="Personal de rescate (salvavidas)">
          {config.salvavidas.map((s, i) => (
            <div key={s.id} className="space-y-2 rounded-xl border border-[var(--border)] p-3">
              <p className="text-xs font-semibold uppercase text-[var(--muted)]">Salvavidas {i + 1}</p>
              <Field label="Nombre">
                <TextInput
                  value={s.nombre}
                  onChange={(e) => updateOperador("salvavidas", s.id, { nombre: e.target.value })}
                />
              </Field>
              <Field label="Número de identificación">
                <TextInput
                  value={s.identificacion}
                  onChange={(e) =>
                    updateOperador("salvavidas", s.id, { identificacion: e.target.value })
                  }
                />
              </Field>
              <button
                type="button"
                onClick={() => removeOperador("salvavidas", s.id)}
                className="text-sm text-[var(--alert)]"
              >
                Eliminar salvavidas
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => addOperador("salvavidas")}
            className="w-full rounded-xl border border-dashed border-[var(--accent)] py-2 text-sm font-medium text-[var(--accent)]"
          >
            + Agregar salvavidas
          </button>
        </SectionCard>

        <SectionCard title="Datos del estanque">
          <Field label="Nombre del estanque">
            <TextInput
              value={config.nombreEstanque}
              onChange={(e) => update({ nombreEstanque: e.target.value })}
            />
          </Field>

          <Field label="Tipo de estructura">
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
              value={config.tipoEstructura ?? "IA"}
              onChange={(e) =>
                update({ tipoEstructura: e.target.value as "IA" | "ES" })
              }
            >
              <option value="IA">IA — Instalacion acuatica (piscina)</option>
              <option value="ES">ES — Estructura similar (spa / jacuzzi)</option>
            </select>
          </Field>

          <Field
            label="Categoria"
            hint="Indexa el motor de rangos junto con IA/ES. Los valores numericos siguen pendientes de confirmacion visual del Anexo I."
          >
            <select
              className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
              value={config.categoria ?? ""}
              onChange={(e) =>
                update({
                  categoria: (e.target.value || null) as
                    | "especial"
                    | "primera"
                    | "segunda"
                    | "tercera"
                    | null,
                })
              }
            >
              <option value="">Sin definir (pendiente)</option>
              <option value="especial">Especial</option>
              <option value="primera">1°</option>
              <option value="segunda">2°</option>
              <option value="tercera">3°</option>
            </select>
          </Field>

          <Field label="Zona humeda (conteo compartido de banistas)">
            <TextInput
              value={config.zonaHumedaNombre ?? ""}
              onChange={(e) => update({ zonaHumedaNombre: e.target.value })}
            />
          </Field>

          <p className="text-sm font-medium">Uso</p>
          <ToggleRow label="Colectiva" checked={config.usoColectiva} onChange={(v) => update({ usoColectiva: v })} />
          <ToggleRow label="Público" checked={config.usoPublico} onChange={(v) => update({ usoPublico: v })} />
          <ToggleRow label="Particular" checked={config.usoParticular} onChange={(v) => update({ usoParticular: v })} />

          <p className="text-sm font-medium">Presentación</p>
          <ToggleRow
            label="Descubierta (al aire libre)"
            checked={config.presentacionDescubierta}
            onChange={(v) =>
              update({
                presentacionDescubierta: v,
                presentacionCubierta: v ? false : config.presentacionCubierta,
              })
            }
          />
          <ToggleRow
            label="Cubierta (muestra humedad relativa en el registro)"
            checked={config.presentacionCubierta}
            onChange={(v) =>
              update({
                presentacionCubierta: v,
                presentacionDescubierta: v ? false : config.presentacionDescubierta,
              })
            }
          />

          <div className="grid grid-cols-2 gap-3">
            {[
              ["largo", "Largo (m)"],
              ["ancho", "Ancho (m)"],
              ["diametro", "Diámetro (m)"],
              ["profundidad", "Profundidad (m)"],
              ["volumen", "Volumen (m³)"],
              ["areaSuperficial", "Área superficial (m²)"],
              ["maximoBanistas", "Máx. bañistas"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <NumberInput
                  value={config[key as keyof ConfiguracionInstalacion] as number | "" ?? ""}
                  onChange={(e) => update({ [key]: parseNum(e.target.value) })}
                />
              </Field>
            ))}
          </div>

          <p className="text-sm font-medium">Fuentes de abastecimiento</p>
          <ToggleRow
            label="Agua para consumo humano"
            checked={config.fuenteAguaPotable}
            onChange={(v) => update({ fuenteAguaPotable: v })}
          />
          <ToggleRow
            label="Dulce natural o cruda"
            checked={config.fuenteAguaNatural}
            onChange={(v) => update({ fuenteAguaNatural: v })}
          />

          <p className="text-sm font-medium">Sistema de operación</p>
          <ToggleRow
            label="Recirculación (RE)"
            checked={config.sistemaRecirculacion}
            onChange={(v) => update({ sistemaRecirculacion: v })}
          />
          <ToggleRow
            label="Renovación continua (RC)"
            checked={config.sistemaRenovacionContinua}
            onChange={(v) => update({ sistemaRenovacionContinua: v })}
          />
          <ToggleRow
            label="Desalojo (D)"
            checked={config.sistemaDesalojo}
            onChange={(v) => update({ sistemaDesalojo: v })}
          />
        </SectionCard>

        {saved ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            Configuración guardada
          </p>
        ) : null}
        <SaveButton onClick={handleSave} label="Guardar configuración" />
      </div>
    </AppShell>
  );
}

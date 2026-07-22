"use client";

import { useEffect, useState } from "react";
import type { RegistroDiario } from "@/lib/types";
import { FRECUENCIA_LABEL, LABORES_OPERACION, MANTENIMIENTO_REPARACIONES, MOMENTO_LABEL } from "@/lib/fields";
import { getOrCreateRegistro, saveRegistro } from "@/lib/storage";
import { evaluarRegistro } from "@/lib/rangos-legales";
import { AlertasPanel } from "@/components/AlertasPanel";
import { SignaturePad } from "@/components/SignaturePad";
import {
  AceptableSelect,
  Field,
  NumberInput,
  SaveButton,
  SectionCard,
  TextArea,
  TextInput,
  ToggleRow,
} from "@/components/ui";

interface RegistroFormProps {
  fecha: string;
  operadores: { id: string; nombre: string }[];
  salvavidas: { id: string; nombre: string }[];
  onSaved?: () => void;
}

function parseNum(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function RegistroForm({ fecha, operadores, salvavidas, onSaved }: RegistroFormProps) {
  const [registro, setRegistro] = useState<RegistroDiario | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    setRegistro(getOrCreateRegistro(fecha));
    setSaved(false);
  }, [fecha]);

  if (!registro) return <p className="p-4 text-sm text-[var(--muted)]">Cargando registro...</p>;

  const update = (partial: Partial<RegistroDiario>) => {
    setRegistro((prev) => (prev ? { ...prev, ...partial } : prev));
    setSaved(false);
  };

  const handleSave = () => {
    if (!registro) return;
    setSaving(true);
    saveRegistro(registro);
    setSaving(false);
    setSaved(true);
    onSaved?.();
  };

  const tabs = [
    "Operación",
    "Calidad agua",
    "Labores",
    "Incidencias",
    "Firma",
  ];

  const alertas = evaluarRegistro(registro);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((label, i) => (
          <button
            key={label}
            type="button"
            onClick={() => setTab(i)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
              tab === i
                ? "bg-[var(--deep)] text-white"
                : "bg-[var(--surface)] text-[var(--muted)] border border-[var(--border)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {alertas.length > 0 && tab !== 4 ? (
        <AlertasPanel alertas={alertas} compact />
      ) : null}

      {tab === 0 && (
        <>
          <SectionCard title="Responsables del día" description="Operador y salvavidas según el libro estándar.">
            <Field label="Operador responsable (OPR)">
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
                value={registro.operadorId}
                onChange={(e) => update({ operadorId: e.target.value })}
              >
                <option value="">Seleccionar operador</option>
                {operadores.map((op) => (
                  <option key={op.id} value={op.id}>
                    {op.nombre}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Personal de rescate (salvavidas)">
              <select
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5"
                value={registro.salvavidasId}
                onChange={(e) => update({ salvavidasId: e.target.value })}
              >
                <option value="">Seleccionar salvavidas</option>
                {salvavidas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </SectionCard>

          <SectionCard title="Condiciones de operación" description="Registro diario de operación del estanque.">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Hora inicio">
                <TextInput
                  type="time"
                  value={registro.condiciones.horaInicio}
                  onChange={(e) =>
                    update({ condiciones: { ...registro.condiciones, horaInicio: e.target.value } })
                  }
                />
              </Field>
              <Field label="Hora final">
                <TextInput
                  type="time"
                  value={registro.condiciones.horaFinal}
                  onChange={(e) =>
                    update({ condiciones: { ...registro.condiciones, horaFinal: e.target.value } })
                  }
                />
              </Field>
            </div>
            {[
              ["temperaturaAire", "Temperatura aire (°C)"],
              ["humedadRelativa", "Humedad relativa (%)"],
              ["numeroBanistas", "Número de bañistas / jornada"],
              ["horasFiltracion", "Horas de filtración"],
              ["presionTrabajo", "Presión de trabajo (psi)"],
              ["volumenRecirculado", "Volumen recirculado (m³)"],
              ["nivelAguaProfundidad", "Nivel de agua - profundidad (m)"],
              ["volumenAguaSuministrada", "Volumen agua suministrada (m³)"],
              ["velocidadFlujo", "Velocidad de flujo (m/s)"],
              ["periodoRecirculacion", "Periodo de recirculación (h)"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <NumberInput
                  value={registro.condiciones[key as keyof typeof registro.condiciones] ?? ""}
                  onChange={(e) =>
                    update({
                      condiciones: {
                        ...registro.condiciones,
                        [key]: parseNum(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            ))}
          </SectionCard>
        </>
      )}

      {tab === 1 && (
        <>
          <AlertasPanel alertas={alertas} />
          <SectionCard title="Calidad física del agua" description="Evaluación visual y sensorial diaria.">
            {(
              [
                ["color", "Color (visual)"],
                ["materiaFlotante", "Materia flotante"],
                ["olor", "Olor (olfato)"],
                ["transparencia", "Transparencia"],
              ] as const
            ).map(([key, label]) => (
              <Field key={key} label={label}>
                <AceptableSelect
                  value={registro.calidadFisica[key]}
                  onChange={(value) =>
                    update({ calidadFisica: { ...registro.calidadFisica, [key]: value } })
                  }
                />
              </Field>
            ))}
          </SectionCard>

          <SectionCard
            title="Calidad química del agua"
            description="(*) Análisis in situ. (a) Mañana, (b) Mediodía, (c) Tarde."
          >
            {(["potencialOxidacion", "ph", "cloroLibre", "cloroCombinado"] as const).map((campo) => (
              <div key={campo} className="space-y-2 rounded-xl bg-[var(--foam)] p-3">
                <p className="text-sm font-semibold text-[var(--deep)]">
                  {campo === "potencialOxidacion" && "Potencial oxidación reducción (mV)"}
                  {campo === "ph" && "pH"}
                  {campo === "cloroLibre" && "Cloro residual libre (mg/L)"}
                  {campo === "cloroCombinado" && "Cloro combinado (mg/L)"}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {(["manana", "mediodia", "tarde"] as const).map((momento) => (
                    <Field key={momento} label={MOMENTO_LABEL[momento]}>
                      <NumberInput
                        value={registro.calidadQuimica[campo][momento] ?? ""}
                        onChange={(e) =>
                          update({
                            calidadQuimica: {
                              ...registro.calidadQuimica,
                              [campo]: {
                                ...registro.calidadQuimica[campo],
                                [momento]: parseNum(e.target.value),
                              },
                            },
                          })
                        }
                      />
                    </Field>
                  ))}
                </div>
              </div>
            ))}

            {[
              ["turbidez", "Turbidez (UNT)"],
              ["temperatura", "Temperatura (°C)"],
              ["conductividad", "Conductividad (µS/cm)"],
              ["cloruros", "Cloruros (mg/L Cl)"],
              ["acidoCianurico", "Ácido cianúrico (mg/L)"],
              ["alcalinidadTotal", "Alcalinidad total (mg/L CaCO₃)"],
              ["durezaCalcica", "Dureza cálcica (mg/L CaCO₃)"],
            ].map(([key, label]) => (
              <Field key={key} label={label}>
                <NumberInput
                  value={registro.calidadQuimica[key as keyof typeof registro.calidadQuimica] as number | "" ?? ""}
                  onChange={(e) =>
                    update({
                      calidadQuimica: {
                        ...registro.calidadQuimica,
                        [key]: parseNum(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            ))}
          </SectionCard>

          <SectionCard title="Índices y ajustes" description="ISL, IRAPI y dosificaciones del día.">
            <Field label="Índice de saturación de Langelier (ISL)">
              <NumberInput
                value={registro.indices.indiceLangelier ?? ""}
                onChange={(e) =>
                  update({ indices: { ...registro.indices, indiceLangelier: parseNum(e.target.value) } })
                }
              />
            </Field>
            <Field label="Índice de riesgo IRAPI">
              <NumberInput
                value={registro.indices.indiceRiesgo ?? ""}
                onChange={(e) =>
                  update({ indices: { ...registro.indices, indiceRiesgo: parseNum(e.target.value) } })
                }
              />
            </Field>
            <ToggleRow
              label="Accidente por contaminación (materia fecal)"
              checked={registro.ajustes.accidenteContaminacion}
              onChange={(checked) =>
                update({ ajustes: { ...registro.ajustes, accidenteContaminacion: checked } })
              }
              badge="Eventual"
            />
            <Field label="Cloro residual dosificado (cantidad)">
              <NumberInput
                value={registro.ajustes.cloroResidualDosificado ?? ""}
                onChange={(e) =>
                  update({
                    ajustes: {
                      ...registro.ajustes,
                      cloroResidualDosificado: parseNum(e.target.value),
                    },
                  })
                }
              />
            </Field>
          </SectionCard>
        </>
      )}

      {tab === 2 && (
        <>
          <SectionCard title="Labores de operación" description="Marcar las labores realizadas en la jornada.">
            {LABORES_OPERACION.map((labor) => (
              <ToggleRow
                key={labor.id}
                label={labor.label}
                badge={FRECUENCIA_LABEL[labor.frecuencia]}
                checked={registro.labores[labor.id] ?? false}
                onChange={(checked) =>
                  update({ labores: { ...registro.labores, [labor.id]: checked } })
                }
              />
            ))}
          </SectionCard>

          <SectionCard title="Mantenimiento y reparaciones" description="Actividades de mantenimiento registradas.">
            {MANTENIMIENTO_REPARACIONES.map((item) => (
              <ToggleRow
                key={item.id}
                label={item.label}
                badge={FRECUENCIA_LABEL[item.frecuencia]}
                checked={registro.mantenimiento[item.id] ?? false}
                onChange={(checked) =>
                  update({ mantenimiento: { ...registro.mantenimiento, [item.id]: checked } })
                }
              />
            ))}
          </SectionCard>
        </>
      )}

      {tab === 3 && (
        <SectionCard title="Incidencias y observaciones">
          <Field label="Incidencias">
            <TextArea
              value={registro.incidencias}
              onChange={(e) => update({ incidencias: e.target.value })}
              placeholder="Registre cualquier incidente o novedad del día..."
            />
          </Field>
          <Field label="Observaciones">
            <TextArea
              value={registro.observaciones}
              onChange={(e) => update({ observaciones: e.target.value })}
              placeholder="Notas adicionales para la autoridad sanitaria..."
            />
          </Field>
        </SectionCard>
      )}

      {tab === 4 && (
        <SectionCard title="Firma del operador responsable" description="Firma digital requerida para validar el registro del dia.">
          <SignaturePad
            value={registro.firmaOperador}
            onChange={(firma) =>
              update({
                firmaOperador: firma,
                firmaFecha: firma ? new Date().toISOString() : null,
              })
            }
          />
          {registro.firmaOperador ? (
            <p className="text-sm text-emerald-700">
              Firma registrada el {registro.firmaFecha ? new Date(registro.firmaFecha).toLocaleString("es-CO") : ""}
            </p>
          ) : (
            <p className="text-sm text-amber-700">La firma es obligatoria antes de entregar el registro a la autoridad.</p>
          )}
        </SectionCard>
      )}

      <div className="sticky bottom-20 space-y-2">
        {saved ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            Registro guardado correctamente
          </p>
        ) : null}
        <SaveButton onClick={handleSave} saving={saving} />
      </div>
    </div>
  );
}

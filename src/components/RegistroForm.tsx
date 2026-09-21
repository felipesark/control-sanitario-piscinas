"use client";

import { useEffect, useMemo, useState } from "react";
import type { AptitudEstanque, FaseOperacion, Instalacion, MomentoDia, RegistroDiario } from "@/lib/types";
import {
  DISPOSITIVOS_SEGURIDAD,
  FASE_A_SLOT,
  FASE_LABEL,
  FRECUENCIA_LABEL,
  LABORES_OPERACION,
  MANTENIMIENTO_REPARACIONES,
} from "@/lib/fields";
import { horaActual } from "@/lib/defaults";
import {
  abrirCorreccion,
  getBanistasZona,
  getOrCreateRegistro,
  listRegistros,
  saveRegistro,
  setBanistasZona,
} from "@/lib/storage";
import { evaluarRegistro } from "@/lib/rangos-legales";
import {
  debeMostrarAjustes,
  faseDesbloqueada,
  filtrarCamposPorVencimiento,
  MOTIVO_AJUSTE_LABEL,
  motivosAjustePorLectura,
  ORDEN_FASES,
  parametrosPeriodicosVisibles,
  siguienteFaseDisponible,
  validarFase,
  type MotivoAjuste,
} from "@/lib/registro-rules";
import { AlertasPanel } from "@/components/AlertasPanel";
import { SignaturePad } from "@/components/SignaturePad";
import {
  AceptableSelect,
  Field,
  NumberInput,
  SaveButton,
  SectionCard,
  SelectInput,
  TextArea,
  TextInput,
  ToggleRow,
} from "@/components/ui";

interface RegistroFormProps {
  fecha: string;
  instalacion: Instalacion;
  zonaHumedaNombre: string;
  catalogoRangos: import("@/lib/rangos/types").CatalogoRangos;
  operadores: { id: string; nombre: string }[];
  salvavidas: { id: string; nombre: string }[];
  onSaved?: () => void;
}

function parseNum(value: string): number | null {
  if (value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

const AJUSTE_FIELDS: {
  motivo: MotivoAjuste;
  key: keyof RegistroDiario["ajustes"];
  label: string;
}[] = [
  { motivo: "cloro", key: "cloroResidualDosificado", label: "Cloro dosificado" },
  { motivo: "phAlto", key: "phAlto", label: "Acido / reductor de pH" },
  { motivo: "phBajo", key: "phBajo", label: "Base / elevador de pH" },
  { motivo: "cloraminas", key: "cloraminasDosificado", label: "Tratamiento cloraminas" },
  { motivo: "cianurico", key: "acidoCianuricoReposicion", label: "Acido cianurico (reposicion)" },
  { motivo: "dureza", key: "durezaReposicion", label: "Dureza (reposicion)" },
  { motivo: "coagulante", key: "turbidezCoagulante", label: "Coagulante" },
  { motivo: "conductividad", key: "conductividadReposicion", label: "Conductividad (reposicion)" },
  { motivo: "color", key: "colorDosificado", label: "Color (dosificado)" },
];

function MedicionesMomento({
  registro,
  slot,
  onChange,
}: {
  registro: RegistroDiario;
  slot: MomentoDia;
  onChange: (campo: "potencialOxidacion" | "ph" | "cloroLibre" | "cloroCombinado", value: number | null) => void;
}) {
  return (
    <div className="space-y-3">
      {(
        [
          ["potencialOxidacion", "ORP / potencial oxidacion (mV)"],
          ["ph", "pH"],
          ["cloroLibre", "Cloro residual libre (mg/L)"],
          ["cloroCombinado", "Cloro combinado (mg/L)"],
        ] as const
      ).map(([campo, label]) => (
        <Field key={campo} label={label}>
          <NumberInput
            value={registro.calidadQuimica[campo][slot] ?? ""}
            onChange={(e) => onChange(campo, parseNum(e.target.value))}
          />
        </Field>
      ))}
    </div>
  );
}

function BloqueAjustes({
  registro,
  tipo,
  categoria,
  catalogo,
  update,
}: {
  registro: RegistroDiario;
  tipo: Instalacion["tipoEstructura"];
  categoria: Instalacion["categoria"];
  catalogo: import("@/lib/rangos/types").CatalogoRangos;
  update: (partial: Partial<RegistroDiario>) => void;
}) {
  const motivos = motivosAjustePorLectura(registro, tipo, categoria, catalogo);
  const mostrar = debeMostrarAjustes(registro, tipo, categoria, catalogo);

  return (
    <SectionCard
      title="Ajuste de caracteristicas del agua"
      description="Se activa si una lectura salio fuera de rango o si dosifico manualmente."
    >
      <ToggleRow
        label="Hoy dosifique productos quimicos"
        checked={registro.ajustes.huboDosificacion}
        onChange={(checked) =>
          update({ ajustes: { ...registro.ajustes, huboDosificacion: checked } })
        }
      />
      {motivos.length > 0 ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Lecturas fuera de rango: {motivos.map((m) => MOTIVO_AJUSTE_LABEL[m]).join(", ")}.
        </p>
      ) : null}
      {mostrar ? (
        AJUSTE_FIELDS.filter(
          (f) => motivos.includes(f.motivo) || registro.ajustes.huboDosificacion,
        ).map((f) => (
          <Field key={f.motivo} label={`${f.label} (cantidad)`}>
            <NumberInput
              value={(registro.ajustes[f.key] as number | null) ?? ""}
              onChange={(e) =>
                update({
                  ajustes: { ...registro.ajustes, [f.key]: parseNum(e.target.value) },
                })
              }
            />
          </Field>
        ))
      ) : (
        <p className="text-sm text-[var(--muted)]">Sin dosificacion requerida por ahora.</p>
      )}
    </SectionCard>
  );
}

function BloqueFecal({
  registro,
  update,
}: {
  registro: RegistroDiario;
  update: (partial: Partial<RegistroDiario>) => void;
}) {
  return (
    <SectionCard title="Accidente por contaminacion fecal" description="Solo si ocurrio en este momento.">
      <ToggleRow
        label="Hubo accidente por contaminacion fecal"
        checked={registro.ajustes.accidenteContaminacion}
        onChange={(checked) =>
          update({
            ajustes: {
              ...registro.ajustes,
              accidenteContaminacion: checked,
              ...(checked
                ? {}
                : {
                    tiempoContactoMinimo: null,
                    tiempoRestablecimientoMin: null,
                    aptitudPostAccidente: null,
                  }),
            },
          })
        }
        badge="Eventual"
      />
      {registro.ajustes.accidenteContaminacion ? (
        <>
          <Field label="Cantidad de cloro dosificado">
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
          <Field label="Tiempo de contacto (min)">
            <NumberInput
              value={registro.ajustes.tiempoContactoMinimo ?? ""}
              onChange={(e) =>
                update({
                  ajustes: {
                    ...registro.ajustes,
                    tiempoContactoMinimo: parseNum(e.target.value),
                  },
                })
              }
            />
          </Field>
          <Field label="Tiempo de restablecimiento (min)">
            <NumberInput
              value={registro.ajustes.tiempoRestablecimientoMin ?? ""}
              onChange={(e) =>
                update({
                  ajustes: {
                    ...registro.ajustes,
                    tiempoRestablecimientoMin: parseNum(e.target.value),
                  },
                })
              }
            />
          </Field>
          <Field label="Estanque apto / no apto tras el protocolo">
            <SelectInput
              value={registro.ajustes.aptitudPostAccidente ?? ""}
              onChange={(e) =>
                update({
                  ajustes: {
                    ...registro.ajustes,
                    aptitudPostAccidente: (e.target.value || null) as AptitudEstanque | null,
                  },
                })
              }
            >
              <option value="">Seleccionar</option>
              <option value="apto">Apto</option>
              <option value="no_apto">No apto</option>
            </SelectInput>
          </Field>
        </>
      ) : null}
    </SectionCard>
  );
}

export function RegistroForm({
  fecha,
  instalacion,
  zonaHumedaNombre,
  catalogoRangos,
  operadores,
  salvavidas,
  onSaved,
}: RegistroFormProps) {
  const [registro, setRegistro] = useState<RegistroDiario | null>(null);
  const [historial, setHistorial] = useState<RegistroDiario[]>([]);
  const [fase, setFase] = useState<FaseOperacion>("apertura");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [motivoCorreccion, setMotivoCorreccion] = useState("");
  const [mostrarCorreccion, setMostrarCorreccion] = useState(false);

  const tipo = instalacion.tipoEstructura;
  const categoria = instalacion.categoria;
  const esCubierta = instalacion.presentacion === "cubierta";

  useEffect(() => {
    const loaded = getOrCreateRegistro(fecha, instalacion.id);
    if (!loaded.condiciones.horaInicio && loaded.estadoDia === "en_progreso") {
      const hora = horaActual();
      loaded.condiciones = { ...loaded.condiciones, horaInicio: hora };
      loaded.horasFase = { ...loaded.horasFase, apertura: loaded.horasFase.apertura || hora };
    }
    const banistasZona = getBanistasZona(instalacion.zonaHumedaId, fecha);
    if (banistasZona !== null) {
      loaded.condiciones = { ...loaded.condiciones, numeroBanistas: banistasZona };
    }
    setRegistro(loaded);
    setHistorial(listRegistros(instalacion.id));
    setFase(siguienteFaseDisponible(loaded));
    setSaved(false);
    setErrores([]);
    setMostrarCorreccion(false);
  }, [fecha, instalacion.id, instalacion.zonaHumedaId]);

  const laboresVisibles = useMemo(
    () => filtrarCamposPorVencimiento(LABORES_OPERACION, fecha, historial, "labores"),
    [fecha, historial],
  );
  const mantVisibles = useMemo(
    () => filtrarCamposPorVencimiento(MANTENIMIENTO_REPARACIONES, fecha, historial, "mantenimiento"),
    [fecha, historial],
  );
  const paramsVisibles = useMemo(
    () => parametrosPeriodicosVisibles(fecha, historial),
    [fecha, historial],
  );

  if (!registro) return <p className="p-4 text-sm text-[var(--muted)]">Cargando registro...</p>;

  const cerrado = registro.estadoDia === "cerrado" || registro.bloqueado;
  const alertas = evaluarRegistro(registro, { tipoEstructura: tipo, categoria }, catalogoRangos);
  const slotActual =
    fase === "cierre" ? null : (FASE_A_SLOT[fase as "apertura" | "mediodia" | "tarde"] as MomentoDia);

  const update = (partial: Partial<RegistroDiario>) => {
    if (cerrado) return;
    setRegistro((prev) => (prev ? { ...prev, ...partial } : prev));
    setSaved(false);
    setErrores([]);
  };

  const setMedicion = (
    campo: "potencialOxidacion" | "ph" | "cloroLibre" | "cloroCombinado",
    slot: MomentoDia,
    value: number | null,
  ) => {
    update({
      calidadQuimica: {
        ...registro.calidadQuimica,
        [campo]: { ...registro.calidadQuimica[campo], [slot]: value },
      },
    });
  };

  const persist = (next: RegistroDiario) => {
    saveRegistro(next);
    setRegistro(next);
    setHistorial(listRegistros(instalacion.id));
    setSaved(true);
    onSaved?.();
  };

  const completarFase = () => {
    if (!registro || cerrado) return;
    const hora = horaActual();
    let next: RegistroDiario = {
      ...registro,
      instalacionId: instalacion.id,
      horasFase: {
        ...registro.horasFase,
        [fase]: registro.horasFase[fase] || hora,
      },
    };

    if (fase === "apertura" && !next.condiciones.horaInicio) {
      next = {
        ...next,
        condiciones: { ...next.condiciones, horaInicio: hora },
      };
    }
    if (fase === "cierre" && !next.condiciones.horaFinal) {
      next = {
        ...next,
        condiciones: { ...next.condiciones, horaFinal: hora },
      };
    }

    const issues = validarFase(next, fase, historial, tipo, categoria, catalogoRangos);
    if (fase === "cierre" && !next.firmaOperador) {
      issues.push({ id: "firma", mensaje: "La firma del operador es obligatoria para cerrar el dia." });
    }
    if (issues.length) {
      setErrores(issues.map((e) => e.mensaje));
      setRegistro(next);
      return;
    }

    setSaving(true);
    if (fase === "cierre" && next.condiciones.numeroBanistas !== null) {
      setBanistasZona(
        instalacion.zonaHumedaId,
        fecha,
        next.condiciones.numeroBanistas,
      );
    }
    next = {
      ...next,
      progreso: { ...next.progreso, [fase]: true },
      estadoDia: fase === "cierre" ? "cerrado" : "en_progreso",
      bloqueado: fase === "cierre",
      firmaFecha: fase === "cierre" ? next.firmaFecha || new Date().toISOString() : next.firmaFecha,
    };
    persist(next);
    setSaving(false);
    setErrores([]);

    if (fase !== "cierre") {
      const idx = ORDEN_FASES.indexOf(fase);
      setFase(ORDEN_FASES[Math.min(idx + 1, ORDEN_FASES.length - 1)]);
    }
  };

  const handleFirma = (firma: string | null) => {
    if (cerrado && firma) return;
    if (!firma) {
      update({
        firmaOperador: null,
        firmaFecha: null,
      });
      return;
    }
    update({
      firmaOperador: firma,
      firmaFecha: new Date().toISOString(),
    });
  };

  const registrarCorreccion = () => {
    if (!registro || !motivoCorreccion.trim()) return;
    const next = abrirCorreccion(registro, motivoCorreccion.trim());
    setRegistro(next);
    setHistorial(listRegistros(instalacion.id));
    setFase("cierre");
    setMostrarCorreccion(false);
    setMotivoCorreccion("");
    setSaved(false);
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <div
        className={`rounded-2xl border px-4 py-3 text-sm ${
          cerrado
            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
            : "border-[var(--border)] bg-[var(--foam)] text-[var(--deep)]"
        }`}
      >
        <p className="font-semibold">
          {cerrado ? "Registro cerrado y firmado" : "Registro en progreso"}
          {" · "}
          {instalacion.nombre} ({tipo})
        </p>
        <p className="mt-0.5 text-xs opacity-80">
          {cerrado
            ? `Cerrado${registro.firmaFecha ? ` · ${new Date(registro.firmaFecha).toLocaleString("es-CO")}` : ""}`
            : "Editable libremente hasta firmar. Se congela solo al cierre."}
        </p>
        {registro.correcciones.length > 0 ? (
          <p className="mt-1 text-xs opacity-80">
            Correcciones registradas: {registro.correcciones.length}
          </p>
        ) : null}
        {cerrado ? (
          <div className="mt-2 space-y-2">
            {!mostrarCorreccion ? (
              <button
                type="button"
                onClick={() => setMostrarCorreccion(true)}
                className="text-xs font-semibold underline"
              >
                Registrar correccion (deja rastro de la version firmada)
              </button>
            ) : (
              <div className="space-y-2 rounded-xl bg-white/70 p-3 text-[var(--foreground)]">
                <Field label="Motivo de la correccion">
                  <TextInput
                    value={motivoCorreccion}
                    onChange={(e) => setMotivoCorreccion(e.target.value)}
                    placeholder="Ej. error tipografico en pH de mediodia"
                  />
                </Field>
                <button
                  type="button"
                  onClick={registrarCorreccion}
                  disabled={!motivoCorreccion.trim()}
                  className="rounded-xl bg-[var(--deep)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Abrir correccion
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ORDEN_FASES.map((f) => {
          const meta = FASE_LABEL[f];
          const done = registro.progreso[f];
          const unlocked = cerrado || faseDesbloqueada(registro, f);
          const active = fase === f;
          return (
            <button
              key={f}
              type="button"
              disabled={!unlocked}
              onClick={() => unlocked && setFase(f)}
              className={`rounded-2xl border px-3 py-3 text-left transition ${
                active
                  ? "border-[var(--deep)] bg-[var(--deep)] text-white"
                  : done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : unlocked
                      ? "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)]"
                      : "border-[var(--border)] bg-[var(--foam)] text-[var(--muted)] opacity-60"
              }`}
            >
              <span className="block text-sm font-semibold">{meta.titulo}</span>
              <span className={`mt-0.5 block text-[11px] ${active ? "text-white/80" : "opacity-70"}`}>
                {done ? "Completado" : meta.subtitulo}
              </span>
            </button>
          );
        })}
      </div>

      {alertas.length > 0 ? <AlertasPanel alertas={alertas} compact /> : null}

      <fieldset disabled={cerrado} className="space-y-4 border-0 p-0 disabled:opacity-80">
        {fase === "apertura" && (
          <>
            <SectionCard
              title="Apertura del estanque"
              description="Antes de que entren banistas. Deja el dia en progreso."
            >
              <Field label="Hora de apertura" hint="Se asigna al abrir el registro">
                <TextInput type="time" value={registro.condiciones.horaInicio} readOnly />
              </Field>
              <Field label="Piscinero / operador responsable">
                <SelectInput
                  value={registro.operadorId}
                  onChange={(e) => update({ operadorId: e.target.value })}
                >
                  <option value="">Seleccionar operador</option>
                  {operadores.map((op) => (
                    <option key={op.id} value={op.id}>
                      {op.nombre}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Salvavidas (si aplica)">
                <SelectInput
                  value={registro.salvavidasId}
                  onChange={(e) => update({ salvavidasId: e.target.value })}
                >
                  <option value="">Seleccionar salvavidas</option>
                  {salvavidas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              {esCubierta ? (
                <Field label="Humedad relativa del recinto (%)" hint="Solo en instalaciones cubiertas">
                  <NumberInput
                    value={registro.condiciones.humedadRelativa ?? ""}
                    onChange={(e) =>
                      update({
                        condiciones: {
                          ...registro.condiciones,
                          humedadRelativa: parseNum(e.target.value),
                        },
                      })
                    }
                  />
                </Field>
              ) : null}
              <Field label="Temperatura del aire (°C)">
                <NumberInput
                  value={registro.condiciones.temperaturaAire ?? ""}
                  onChange={(e) =>
                    update({
                      condiciones: {
                        ...registro.condiciones,
                        temperaturaAire: parseNum(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </SectionCard>

            <SectionCard title="Observaciones fisicas" description="Obligatorias en la apertura.">
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

            <SectionCard title="Dispositivos de seguridad" description="Revision completa antes de abrir.">
              {DISPOSITIVOS_SEGURIDAD.map((item) => (
                <Field key={item.id} label={item.label}>
                  <AceptableSelect
                    value={registro.dispositivosSeguridad[item.id] ?? null}
                    onChange={(value) =>
                      update({
                        dispositivosSeguridad: {
                          ...registro.dispositivosSeguridad,
                          [item.id]: value,
                        },
                      })
                    }
                  />
                </Field>
              ))}
            </SectionCard>

            <SectionCard title="Mediciones de apertura" description="pH, ORP, cloro libre y combinado.">
              {slotActual ? (
                <MedicionesMomento
                  registro={registro}
                  slot={slotActual}
                  onChange={(campo, value) => setMedicion(campo, slotActual, value)}
                />
              ) : null}
            </SectionCard>

            {paramsVisibles.length > 0 ? (
              <SectionCard
                title="Parametros que vencen hoy"
                description="Segun la ultima vez registrada, no por calendario fijo."
              >
                {paramsVisibles.map((campo) => (
                  <Field key={campo.id} label={campo.label} hint={FRECUENCIA_LABEL[campo.frecuencia]}>
                    <NumberInput
                      value={
                        (registro.calidadQuimica[
                          campo.id as keyof typeof registro.calidadQuimica
                        ] as number | null) ?? ""
                      }
                      onChange={(e) =>
                        update({
                          calidadQuimica: {
                            ...registro.calidadQuimica,
                            [campo.id]: parseNum(e.target.value),
                          },
                        })
                      }
                    />
                  </Field>
                ))}
              </SectionCard>
            ) : null}

            <BloqueAjustes
              registro={registro}
              tipo={tipo}
              categoria={categoria}
              catalogo={catalogoRangos}
              update={update}
            />
          </>
        )}

        {(fase === "mediodia" || fase === "tarde") && slotActual && (
          <>
            <SectionCard
              title={FASE_LABEL[fase].titulo}
              description={FASE_LABEL[fase].subtitulo}
            >
              <Field label={`Hora de ${fase}`}>
                <TextInput
                  type="time"
                  value={registro.horasFase[fase]}
                  onChange={(e) =>
                    update({
                      horasFase: { ...registro.horasFase, [fase]: e.target.value },
                    })
                  }
                />
              </Field>
            </SectionCard>

            <SectionCard title={`Mediciones de ${fase}`}>
              <MedicionesMomento
                registro={registro}
                slot={slotActual}
                onChange={(campo, value) => setMedicion(campo, slotActual, value)}
              />
            </SectionCard>

            <BloqueAjustes
              registro={registro}
              tipo={tipo}
              categoria={categoria}
              catalogo={catalogoRangos}
              update={update}
            />
            <BloqueFecal registro={registro} update={update} />
          </>
        )}

        {fase === "cierre" && (
          <>
            <SectionCard title="Cierre del dia" description="Ultimo momento: firmar y bloquear el registro.">
              <Field label="Hora final">
                <TextInput
                  type="time"
                  value={registro.condiciones.horaFinal}
                  onChange={(e) =>
                    update({
                      condiciones: { ...registro.condiciones, horaFinal: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Evaluacion final del estanque">
                <SelectInput
                  value={registro.evaluacionEstanque ?? ""}
                  onChange={(e) =>
                    update({
                      evaluacionEstanque: (e.target.value || null) as AptitudEstanque | null,
                    })
                  }
                >
                  <option value="">Seleccionar</option>
                  <option value="apto">Apto</option>
                  <option value="no_apto">No apto</option>
                </SelectInput>
              </Field>
              <Field
                label={`Banistas de la zona humeda (${zonaHumedaNombre})`}
                hint="Se cuenta una vez por zona y se copia a todos los libros de esa zona."
              >
                <NumberInput
                  value={registro.condiciones.numeroBanistas ?? ""}
                  onChange={(e) =>
                    update({
                      condiciones: {
                        ...registro.condiciones,
                        numeroBanistas: parseNum(e.target.value),
                      },
                    })
                  }
                />
              </Field>
            </SectionCard>

            <SectionCard title="Labores del dia" description="Solo las que corresponden hoy.">
              {laboresVisibles.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No hay labores pendientes hoy.</p>
              ) : (
                laboresVisibles.map((labor) => (
                  <ToggleRow
                    key={labor.id}
                    label={labor.label}
                    badge={FRECUENCIA_LABEL[labor.frecuencia]}
                    checked={registro.labores[labor.id] ?? false}
                    onChange={(checked) =>
                      update({ labores: { ...registro.labores, [labor.id]: checked } })
                    }
                  />
                ))
              )}
            </SectionCard>

            <SectionCard title="Mantenimiento">
              {mantVisibles.length === 0 ? (
                <p className="text-sm text-[var(--muted)]">No hay mantenimiento pendiente hoy.</p>
              ) : (
                mantVisibles.map((item) => (
                  <ToggleRow
                    key={item.id}
                    label={item.label}
                    badge={FRECUENCIA_LABEL[item.frecuencia]}
                    checked={registro.mantenimiento[item.id] ?? false}
                    onChange={(checked) =>
                      update({
                        mantenimiento: { ...registro.mantenimiento, [item.id]: checked },
                      })
                    }
                  />
                ))
              )}
            </SectionCard>

            <SectionCard title="Incidencias y observaciones">
              <Field label="Incidencias">
                <TextArea
                  value={registro.incidencias}
                  onChange={(e) => update({ incidencias: e.target.value })}
                />
              </Field>
              <Field label="Observaciones">
                <TextArea
                  value={registro.observaciones}
                  onChange={(e) => update({ observaciones: e.target.value })}
                />
              </Field>
            </SectionCard>

            <BloqueAjustes
              registro={registro}
              tipo={tipo}
              categoria={categoria}
              catalogo={catalogoRangos}
              update={update}
            />
            <BloqueFecal registro={registro} update={update} />

            <SectionCard title="Firma del operador" description="Al firmar y completar el cierre, el dia queda bloqueado.">
              <SignaturePad value={registro.firmaOperador} onChange={handleFirma} />
            </SectionCard>
          </>
        )}
      </fieldset>

      <div className="sticky bottom-20 space-y-2">
        {errores.length > 0 ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            <p className="font-semibold">Complete este momento antes de continuar:</p>
            <ul className="mt-1 list-disc pl-5">
              {errores.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        ) : null}
        {saved && !errores.length ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-center text-sm text-emerald-700">
            {fase === "cierre" && cerrado
              ? "Dia cerrado correctamente"
              : "Momento guardado. El registro sigue en progreso."}
          </p>
        ) : null}
        {!cerrado ? (
          <SaveButton
            onClick={completarFase}
            saving={saving}
            label={
              fase === "cierre"
                ? "Cerrar y firmar el dia"
                : `Guardar ${FASE_LABEL[fase].titulo.replace(/^\d+\.\s*/, "")} y continuar`
            }
          />
        ) : null}
      </div>
    </div>
  );
}

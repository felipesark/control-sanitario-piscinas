import type { CampoDefinicion } from "./fields";
import { FASE_A_SLOT, FRECUENCIA_DIAS, PARAMETROS_PERIODICOS } from "./fields";
import { fueraDeRango, obtenerRangos } from "./rangos-legales";
import type { CatalogoRangos } from "./rangos/types";
import { catalogoVacioProduccion } from "./rangos/motor";
import type {
  FaseOperacion,
  Frecuencia,
  MomentoDia,
  RegistroDiario,
  TipoEstructura,
  CategoriaInstalacion,
} from "./types";

export interface ErrorValidacion {
  id: string;
  mensaje: string;
}

export type MotivoAjuste =
  | "cloro"
  | "phAlto"
  | "phBajo"
  | "cloraminas"
  | "cianurico"
  | "dureza"
  | "coagulante"
  | "conductividad"
  | "color";

export const ORDEN_FASES: FaseOperacion[] = ["apertura", "mediodia", "tarde", "cierre"];

function parseFecha(fecha: string): Date {
  const [y, m, d] = fecha.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function diasEntre(desde: string, hasta: string): number {
  const a = parseFecha(desde).getTime();
  const b = parseFecha(hasta).getTime();
  return Math.floor((b - a) / 86_400_000);
}

function fueraRango(
  valor: number,
  key: string,
  tipo: TipoEstructura,
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): boolean {
  const rango = obtenerRangos({ tipoEstructura: tipo, categoria }, null, catalogo)[key];
  if (!rango) return false;
  return fueraDeRango(valor, rango);
}

function medicionSlotCompleta(registro: RegistroDiario, slot: MomentoDia): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  const label = slot === "manana" ? "apertura" : slot;
  if (registro.calidadQuimica.ph[slot] === null) {
    errores.push({ id: `ph-${slot}`, mensaje: `Falta pH en ${label}.` });
  }
  if (registro.calidadQuimica.potencialOxidacion[slot] === null) {
    errores.push({ id: `orp-${slot}`, mensaje: `Falta ORP en ${label}.` });
  }
  if (registro.calidadQuimica.cloroLibre[slot] === null) {
    errores.push({ id: `cloroLibre-${slot}`, mensaje: `Falta cloro residual libre en ${label}.` });
  }
  if (registro.calidadQuimica.cloroCombinado[slot] === null) {
    errores.push({
      id: `cloroCombinado-${slot}`,
      mensaje: `Falta cloro combinado en ${label}.`,
    });
  }
  return errores;
}

function erroresAjustes(
  registro: RegistroDiario,
  tipo: TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  if (!debeMostrarAjustes(registro, tipo, categoria, catalogo)) return errores;

  const motivos = motivosAjustePorLectura(registro, tipo, categoria, catalogo);
  for (const motivo of motivos) {
    if (!ajusteRegistradoPara(registro, motivo)) {
      errores.push({
        id: `ajuste-${motivo}`,
        mensaje: `Hay una lectura fuera de rango: registre el ajuste correspondiente (${motivo}).`,
      });
    }
  }
  if (registro.ajustes.huboDosificacion && motivos.length === 0) {
    const alguno =
      registro.ajustes.cloroResidualDosificado !== null ||
      registro.ajustes.phAlto !== null ||
      registro.ajustes.phBajo !== null ||
      registro.ajustes.cloraminasDosificado !== null ||
      registro.ajustes.turbidezCoagulante !== null ||
      registro.ajustes.acidoCianuricoReposicion !== null ||
      registro.ajustes.durezaReposicion !== null;
    if (!alguno) {
      errores.push({
        id: "ajuste-manual",
        mensaje: "Indico que dosifico: registre al menos una cantidad dosificada.",
      });
    }
  }
  return errores;
}

function erroresFecal(registro: RegistroDiario): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  if (!registro.ajustes.accidenteContaminacion) return errores;
  if (registro.ajustes.cloroResidualDosificado === null) {
    errores.push({
      id: "fecal-cloro",
      mensaje: "Accidente fecal: indique la cantidad de cloro dosificado.",
    });
  }
  if (registro.ajustes.tiempoContactoMinimo === null) {
    errores.push({
      id: "fecal-contacto",
      mensaje: "Accidente fecal: indique el tiempo de contacto.",
    });
  }
  if (registro.ajustes.tiempoRestablecimientoMin === null) {
    errores.push({
      id: "fecal-restablecimiento",
      mensaje: "Accidente fecal: indique el tiempo de restablecimiento.",
    });
  }
  if (!registro.ajustes.aptitudPostAccidente) {
    errores.push({
      id: "fecal-apto",
      mensaje: "Accidente fecal: indique si el estanque quedo apto o no apto.",
    });
  }
  return errores;
}

/** Intervalo en dias; null = eventual (no se muestra por cadencia). */
export function intervaloFrecuencia(frecuencia: Frecuencia): number | null {
  if (frecuencia === "eventual") return null;
  return FRECUENCIA_DIAS[frecuencia];
}

/**
 * Visible si es diaria, o si nunca se registro, o si ya paso el intervalo
 * desde la ultima fecha en que se registro (no calendario fijo).
 */
export function esCampoVisible(
  frecuencia: Frecuencia,
  fechaActual: string,
  ultimaFecha: string | null,
): boolean {
  if (frecuencia === "diaria") return true;
  if (frecuencia === "eventual") return false;
  if (!ultimaFecha) return true;
  const intervalo = intervaloFrecuencia(frecuencia);
  if (intervalo === null) return false;
  return diasEntre(ultimaFecha, fechaActual) >= intervalo;
}

export function ultimaFechaParametroQuimico(
  registros: RegistroDiario[],
  campoId: string,
  fechaActual: string,
): string | null {
  const anteriores = registros
    .filter((r) => r.fecha < fechaActual)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  for (const r of anteriores) {
    const valor = r.calidadQuimica[campoId as keyof typeof r.calidadQuimica];
    if (typeof valor === "number") return r.fecha;
  }
  return null;
}

export function ultimaFechaCheckbox(
  registros: RegistroDiario[],
  grupo: "labores" | "mantenimiento",
  campoId: string,
  fechaActual: string,
): string | null {
  const anteriores = registros
    .filter((r) => r.fecha < fechaActual)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  for (const r of anteriores) {
    if (r[grupo][campoId]) return r.fecha;
  }
  return null;
}

export function filtrarCamposPorVencimiento(
  campos: CampoDefinicion[],
  fechaActual: string,
  registros: RegistroDiario[],
  tipo: "parametro" | "labores" | "mantenimiento",
): CampoDefinicion[] {
  return campos.filter((campo) => {
    if (campo.frecuencia === "diaria") return true;
    if (campo.frecuencia === "eventual") return false;

    const ultima =
      tipo === "parametro"
        ? ultimaFechaParametroQuimico(registros, campo.id, fechaActual)
        : ultimaFechaCheckbox(registros, tipo, campo.id, fechaActual);

    return esCampoVisible(campo.frecuencia, fechaActual, ultima);
  });
}

export function parametrosPeriodicosVisibles(
  fechaActual: string,
  registros: RegistroDiario[],
): CampoDefinicion[] {
  return filtrarCamposPorVencimiento(PARAMETROS_PERIODICOS, fechaActual, registros, "parametro");
}

/** Motivos de ajuste disparados por lecturas fuera de rango. */
export function motivosAjustePorLectura(
  registro: RegistroDiario,
  tipo: TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): MotivoAjuste[] {
  const motivos = new Set<MotivoAjuste>();
  const momentos: MomentoDia[] = ["manana", "mediodia", "tarde"];
  const rangos = obtenerRangos({ tipoEstructura: tipo, categoria }, null, catalogo);
  if (Object.keys(rangos).length === 0) return [];

  for (const momento of momentos) {
    const ph = registro.calidadQuimica.ph[momento];
    if (ph !== null && fueraRango(ph, "ph", tipo, categoria, catalogo)) {
      if (ph > (rangos.ph?.max ?? 8)) motivos.add("phAlto");
      if (ph < (rangos.ph?.min ?? 7.2)) motivos.add("phBajo");
    }

    const cloro = registro.calidadQuimica.cloroLibre[momento];
    if (cloro !== null && fueraRango(cloro, "cloroLibre", tipo, categoria, catalogo)) {
      motivos.add("cloro");
    }

    const combinado = registro.calidadQuimica.cloroCombinado[momento];
    if (
      combinado !== null &&
      fueraRango(combinado, "cloroCombinado", tipo, categoria, catalogo)
    ) {
      motivos.add("cloraminas");
    }
  }

  const turbidez = registro.calidadQuimica.turbidez;
  if (turbidez !== null && fueraRango(turbidez, "turbidez", tipo, categoria, catalogo)) {
    motivos.add("coagulante");
  }

  const cianurico = registro.calidadQuimica.acidoCianurico;
  if (
    cianurico !== null &&
    fueraRango(cianurico, "acidoCianurico", tipo, categoria, catalogo)
  ) {
    motivos.add("cianurico");
  }

  return [...motivos];
}

export function debeMostrarAjustes(
  registro: RegistroDiario,
  tipo: TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): boolean {
  return (
    registro.ajustes.huboDosificacion ||
    motivosAjustePorLectura(registro, tipo, categoria, catalogo).length > 0
  );
}

function ajusteRegistradoPara(registro: RegistroDiario, motivo: MotivoAjuste): boolean {
  const a = registro.ajustes;
  switch (motivo) {
    case "cloro":
      return a.cloroResidualDosificado !== null;
    case "phAlto":
      return a.phAlto !== null;
    case "phBajo":
      return a.phBajo !== null;
    case "cloraminas":
      return a.cloraminasDosificado !== null;
    case "cianurico":
      return a.acidoCianuricoReposicion !== null;
    case "dureza":
      return a.durezaReposicion !== null;
    case "coagulante":
      return a.turbidezCoagulante !== null;
    case "conductividad":
      return a.conductividadReposicion !== null;
    case "color":
      return a.colorDosificado !== null;
  }
}

export function validarFase(
  registro: RegistroDiario,
  fase: FaseOperacion,
  historial: RegistroDiario[] = [],
  tipo: TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];

  if (fase === "apertura") {
    if (!registro.condiciones.horaInicio) {
      errores.push({ id: "horaInicio", mensaje: "Falta la hora de apertura." });
    }
    if (!registro.operadorId && !registro.salvavidasId) {
      errores.push({
        id: "responsable",
        mensaje: "Debe elegir el piscinero responsable o el salvavidas del turno.",
      });
    }
    (["color", "materiaFlotante", "olor", "transparencia"] as const).forEach((campo) => {
      if (!registro.calidadFisica[campo]) {
        errores.push({ id: `fisica-${campo}`, mensaje: `Falta la observacion fisica: ${campo}.` });
      }
    });
    for (const [id, valor] of Object.entries(registro.dispositivosSeguridad)) {
      if (!valor) {
        errores.push({
          id: `seg-${id}`,
          mensaje: `Complete la revision de seguridad: ${id}.`,
        });
      }
    }
    errores.push(...medicionSlotCompleta(registro, "manana"));
    for (const campo of parametrosPeriodicosVisibles(registro.fecha, historial)) {
      const valor = registro.calidadQuimica[campo.id as keyof typeof registro.calidadQuimica];
      if (typeof valor !== "number") {
        errores.push({
          id: `param-${campo.id}`,
          mensaje: `Hoy corresponde registrar: ${campo.label}.`,
        });
      }
    }
    errores.push(...erroresAjustes(registro, tipo, categoria, catalogo));
  }

  if (fase === "mediodia") {
    if (!registro.progreso.apertura) {
      errores.push({ id: "orden", mensaje: "Complete y guarde la apertura antes del mediodia." });
    }
    errores.push(...medicionSlotCompleta(registro, "mediodia"));
    errores.push(...erroresAjustes(registro, tipo, categoria, catalogo));
    errores.push(...erroresFecal(registro));
  }

  if (fase === "tarde") {
    if (!registro.progreso.mediodia) {
      errores.push({ id: "orden", mensaje: "Complete y guarde el mediodia antes de la tarde." });
    }
    errores.push(...medicionSlotCompleta(registro, "tarde"));
    errores.push(...erroresAjustes(registro, tipo, categoria, catalogo));
    errores.push(...erroresFecal(registro));
  }

  if (fase === "cierre") {
    if (!registro.progreso.apertura || !registro.progreso.mediodia || !registro.progreso.tarde) {
      errores.push({
        id: "orden",
        mensaje: "Debe completar apertura, mediodia y tarde antes del cierre.",
      });
    }
    if (!registro.condiciones.horaFinal) {
      errores.push({ id: "horaFinal", mensaje: "Falta la hora final de cierre." });
    }
    if (!registro.evaluacionEstanque) {
      errores.push({
        id: "evaluacion",
        mensaje: "Indique si el estanque esta apto o no apto para el servicio.",
      });
    }
    errores.push(...erroresAjustes(registro, tipo, categoria, catalogo));
    errores.push(...erroresFecal(registro));
  }

  return errores;
}

/** Validacion completa del dia (todas las fases). */
export function validarRegistroObligatorio(
  registro: RegistroDiario,
  historial: RegistroDiario[] = [],
  tipo: TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): ErrorValidacion[] {
  const errores: ErrorValidacion[] = [];
  for (const fase of ORDEN_FASES) {
    const simulado = {
      ...registro,
      progreso: { apertura: true, mediodia: true, tarde: true, cierre: false },
    };
    const parcial = validarFase(simulado, fase, historial, tipo, categoria, catalogo).filter(
      (e) => e.id !== "orden",
    );
    errores.push(...parcial);
  }
  return errores;
}

export function validarParaFirmar(
  registro: RegistroDiario,
  historial: RegistroDiario[] = [],
  tipo: TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): ErrorValidacion[] {
  const errores = validarFase(registro, "cierre", historial, tipo, categoria, catalogo);
  if (!registro.firmaOperador) {
    errores.push({ id: "firma", mensaje: "La firma del operador es obligatoria para cerrar el dia." });
  }
  return errores;
}

export function siguienteFaseDisponible(registro: RegistroDiario): FaseOperacion {
  if (!registro.progreso.apertura) return "apertura";
  if (!registro.progreso.mediodia) return "mediodia";
  if (!registro.progreso.tarde) return "tarde";
  return "cierre";
}

export function faseDesbloqueada(registro: RegistroDiario, fase: FaseOperacion): boolean {
  if (fase === "apertura") return true;
  if (fase === "mediodia") return registro.progreso.apertura;
  if (fase === "tarde") return registro.progreso.mediodia;
  return registro.progreso.tarde;
}

export const MOTIVO_AJUSTE_LABEL: Record<MotivoAjuste, string> = {
  cloro: "Cloro residual",
  phAlto: "Acido / reductor de pH",
  phBajo: "Base / elevador de pH",
  cloraminas: "Tratamiento de cloraminas",
  cianurico: "Acido cianurico",
  dureza: "Dureza calcica",
  coagulante: "Coagulante (turbidez)",
  conductividad: "Conductividad",
  color: "Color",
};

export { FASE_A_SLOT };

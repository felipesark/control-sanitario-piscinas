import type { AppData, FaseOperacion, Frecuencia, MomentoDia, RegistroDiario, TipoEstructura, VisitaInspeccion } from "./types";
import { evaluarRegistro, motorRangosListo, obtenerRangos, type Alerta } from "./rangos-legales";
import { formatFechaHoy, formatFechaLegible } from "./storage";
import { getInstalacionActiva } from "./instalaciones";
import { DISPOSITIVOS_SEGURIDAD, LABORES_OPERACION } from "./fields";
import {
  filtrarCamposPorVencimiento,
  ORDEN_FASES,
  parametrosPeriodicosVisibles,
} from "./registro-rules";

export interface SerieCalidad {
  fecha: string;
  label: string;
  ph: number | null;
  cloro: number | null;
  cloroCombinado: number | null;
  turbidez: number | null;
  temperatura: number | null;
  banistas: number | null;
  alertas: number;
}

export interface IndicadorParametro {
  actual: number | null;
  /** Diferencia contra la medicion anterior con dato. */
  delta: number | null;
  estado: "ok" | "fuera" | "sin_dato";
}

export interface AlertaReciente extends Alerta {
  fecha: string;
}

export interface MedicionMomento {
  momento: MomentoDia;
  ph: number | null;
  orp: number | null;
  cloroLibre: number | null;
  cloroCombinado: number | null;
}

export interface Pendiente {
  id: string;
  tipo: "fase" | "parametro" | "labor";
  texto: string;
  detalle?: string;
  frecuencia?: Frecuencia;
}

export interface DashboardMetrics {
  hoy: string;
  instalacionNombre: string;
  motorActivo: boolean;
  totalRegistros: number;
  totalVisitas: number;
  registrosUltimos14: number;
  alertasHoy: number;
  diasConAlerta: number;
  diasOk: number;
  cumplimientoPct: number | null;
  ultimoPh: number | null;
  ultimoCloro: number | null;
  ultimaTurbidez: number | null;
  indicadores: {
    ph: IndicadorParametro;
    cloro: IndicadorParametro;
    turbidez: IndicadorParametro;
    banistas: IndicadorParametro & { aforo: number | null };
  };
  hoyEstado: {
    existe: boolean;
    cerrado: boolean;
    fases: Record<FaseOperacion, boolean>;
    fasesCompletadas: number;
    siguienteFase: FaseOperacion | null;
  };
  seguridad: { aceptable: number; noAceptable: number; sinRegistrar: number };
  labores: { completadas: number; total: number };
  medicionesHoy: MedicionMomento[];
  alertasRecientes: AlertaReciente[];
  pendientes: Pendiente[];
  ultimaVisita: VisitaInspeccion | null;
  serie: SerieCalidad[];
  rangos: {
    phMin: number;
    phMax: number;
    cloroMin: number;
    cloroMax: number;
    cloroCombinadoMax: number;
    turbidezMax: number;
  };
}

const FASE_TEXTO: Record<FaseOperacion, string> = {
  apertura: "Apertura",
  mediodia: "Mediodia",
  tarde: "Tarde",
  cierre: "Cierre y firma",
};

function ultimoValor(...valores: Array<number | null | undefined>): number | null {
  for (const v of valores) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

/** Solo cuentan alertas sanitarias; los avisos "info" no son incumplimientos. */
function alertasSanitarias(alertas: Alerta[]): Alerta[] {
  return alertas.filter((a) => a.nivel !== "info");
}

function indicador(
  valores: Array<number | null>,
  fuera: (v: number) => boolean,
): IndicadorParametro {
  const conDato = valores.filter((v): v is number => v !== null);
  const actual = conDato.at(-1) ?? null;
  const anterior = conDato.at(-2) ?? null;
  return {
    actual,
    delta: actual !== null && anterior !== null ? actual - anterior : null,
    estado: actual === null ? "sin_dato" : fuera(actual) ? "fuera" : "ok",
  };
}

function toSerie(registro: RegistroDiario, alertas: number): SerieCalidad {
  const q = registro.calidadQuimica;
  return {
    fecha: registro.fecha,
    label: formatFechaLegible(registro.fecha).slice(0, 5),
    ph: ultimoValor(q.ph.tarde, q.ph.mediodia, q.ph.manana),
    cloro: ultimoValor(q.cloroLibre.tarde, q.cloroLibre.mediodia, q.cloroLibre.manana),
    cloroCombinado: ultimoValor(
      q.cloroCombinado.tarde,
      q.cloroCombinado.mediodia,
      q.cloroCombinado.manana,
    ),
    turbidez: q.turbidez,
    temperatura: q.temperatura,
    banistas: registro.condiciones.numeroBanistas,
    alertas,
  };
}

export function buildDashboardMetrics(data: AppData, dias = 14): DashboardMetrics {
  const hoy = formatFechaHoy();
  const activa = getInstalacionActiva(data);
  const ctx = { tipoEstructura: activa.tipoEstructura as TipoEstructura, categoria: activa.categoria };
  const catalogo = data.rangosCatalogo;
  const r = obtenerRangos(ctx, null, catalogo);
  const rangos = {
    phMin: r.ph?.min ?? 7.2,
    phMax: r.ph?.max ?? 8,
    cloroMin: r.cloroLibre?.min ?? 1,
    cloroMax: r.cloroLibre?.max ?? 3,
    cloroCombinadoMax: r.cloroCombinado?.max ?? 0.6,
    turbidezMax: r.turbidez?.max ?? 5,
  };

  const delLibro = data.registros.filter((reg) => reg.instalacionId === activa.id);
  const ordenados = [...delLibro].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const recientes = ordenados.slice(-dias);
  const alertasPorRegistro = recientes.map((reg) =>
    alertasSanitarias(evaluarRegistro(reg, ctx, catalogo)),
  );
  const serie = recientes.map((reg, i) => toSerie(reg, alertasPorRegistro[i].length));

  const registroHoy = delLibro.find((reg) => reg.fecha === hoy) ?? null;
  const alertasHoy = registroHoy
    ? alertasSanitarias(evaluarRegistro(registroHoy, ctx, catalogo)).length
    : 0;

  const diasConAlerta = serie.filter((s) => s.alertas > 0).length;
  const diasOk = serie.length - diasConAlerta;
  const cumplimientoPct = serie.length > 0 ? Math.round((diasOk / serie.length) * 100) : null;

  const fases: Record<FaseOperacion, boolean> = registroHoy
    ? { ...registroHoy.progreso }
    : { apertura: false, mediodia: false, tarde: false, cierre: false };
  const siguienteFase = ORDEN_FASES.find((f) => !fases[f]) ?? null;

  const seguridad = { aceptable: 0, noAceptable: 0, sinRegistrar: 0 };
  for (const d of DISPOSITIVOS_SEGURIDAD) {
    const v = registroHoy?.dispositivosSeguridad[d.id] ?? null;
    if (v === "aceptable") seguridad.aceptable++;
    else if (v === "no_aceptable") seguridad.noAceptable++;
    else seguridad.sinRegistrar++;
  }

  const laboresHoy = filtrarCamposPorVencimiento(LABORES_OPERACION, hoy, delLibro, "labores");
  const laboresHechas = laboresHoy.filter((l) => registroHoy?.labores[l.id]);

  const pendientes: Pendiente[] = [];
  if (siguienteFase) {
    pendientes.push({
      id: `fase-${siguienteFase}`,
      tipo: "fase",
      texto: `Registrar ${FASE_TEXTO[siguienteFase].toLowerCase()}`,
      detalle: registroHoy ? "Siguiente momento del dia" : "El dia aun no se ha iniciado",
    });
  }
  for (const campo of parametrosPeriodicosVisibles(hoy, delLibro)) {
    const valor = registroHoy?.calidadQuimica[campo.id as keyof RegistroDiario["calidadQuimica"]];
    if (typeof valor !== "number") {
      pendientes.push({ id: `param-${campo.id}`, tipo: "parametro", texto: campo.label, frecuencia: campo.frecuencia });
    }
  }
  for (const labor of laboresHoy) {
    if (!registroHoy?.labores[labor.id]) {
      pendientes.push({ id: `labor-${labor.id}`, tipo: "labor", texto: labor.label, frecuencia: labor.frecuencia });
    }
  }

  const alertasRecientes: AlertaReciente[] = recientes
    .flatMap((reg, i) => alertasPorRegistro[i].map((a) => ({ ...a, fecha: reg.fecha })))
    .reverse()
    .slice(0, 8);

  const medicionesHoy: MedicionMomento[] = (["manana", "mediodia", "tarde"] as MomentoDia[]).map(
    (momento) => ({
      momento,
      ph: registroHoy?.calidadQuimica.ph[momento] ?? null,
      orp: registroHoy?.calidadQuimica.potencialOxidacion[momento] ?? null,
      cloroLibre: registroHoy?.calidadQuimica.cloroLibre[momento] ?? null,
      cloroCombinado: registroHoy?.calidadQuimica.cloroCombinado[momento] ?? null,
    }),
  );

  const ultimaVisita =
    [...data.visitas].sort((a, b) => `${b.fecha}${b.hora}`.localeCompare(`${a.fecha}${a.hora}`))[0] ??
    null;

  const ultimo = serie.at(-1);

  return {
    hoy,
    instalacionNombre: activa.nombre,
    motorActivo: motorRangosListo(catalogo),
    totalRegistros: delLibro.length,
    totalVisitas: data.visitas.length,
    registrosUltimos14: serie.length,
    alertasHoy,
    diasConAlerta,
    diasOk,
    cumplimientoPct,
    ultimoPh: ultimo?.ph ?? null,
    ultimoCloro: ultimo?.cloro ?? null,
    ultimaTurbidez: ultimo?.turbidez ?? null,
    indicadores: {
      ph: indicador(
        serie.map((s) => s.ph),
        (v) => v < rangos.phMin || v > rangos.phMax,
      ),
      cloro: indicador(
        serie.map((s) => s.cloro),
        (v) => v < rangos.cloroMin || v > rangos.cloroMax,
      ),
      turbidez: indicador(
        serie.map((s) => s.turbidez),
        (v) => v > rangos.turbidezMax,
      ),
      banistas: {
        ...indicador(
          serie.map((s) => s.banistas),
          (v) => activa.maximoBanistas !== null && v > activa.maximoBanistas,
        ),
        aforo: activa.maximoBanistas,
      },
    },
    hoyEstado: {
      existe: registroHoy !== null,
      cerrado: registroHoy?.estadoDia === "cerrado",
      fases,
      fasesCompletadas: ORDEN_FASES.filter((f) => fases[f]).length,
      siguienteFase,
    },
    seguridad,
    labores: { completadas: laboresHechas.length, total: laboresHoy.length },
    medicionesHoy,
    alertasRecientes,
    pendientes,
    ultimaVisita,
    serie,
    rangos,
  };
}

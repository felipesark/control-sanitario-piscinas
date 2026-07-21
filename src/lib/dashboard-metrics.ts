import type { AppData, RegistroDiario } from "./types";
import { evaluarRegistro, RANGOS } from "./rangos-legales";
import { formatFechaHoy, formatFechaLegible } from "./storage";

export interface SerieCalidad {
  fecha: string;
  label: string;
  ph: number | null;
  cloro: number | null;
  turbidez: number | null;
  banistas: number | null;
  alertas: number;
}

export interface DashboardMetrics {
  hoy: string;
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
  serie: SerieCalidad[];
  rangos: {
    phMin: number;
    phMax: number;
    cloroMin: number;
    cloroMax: number;
    turbidezMax: number;
  };
}

function ultimoValor(
  ...valores: Array<number | null | undefined>
): number | null {
  for (const v of valores) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function toSerie(registro: RegistroDiario): SerieCalidad {
  const ph = ultimoValor(
    registro.calidadQuimica.ph.tarde,
    registro.calidadQuimica.ph.mediodia,
    registro.calidadQuimica.ph.manana,
  );
  const cloro = ultimoValor(
    registro.calidadQuimica.cloroLibre.tarde,
    registro.calidadQuimica.cloroLibre.mediodia,
    registro.calidadQuimica.cloroLibre.manana,
  );

  return {
    fecha: registro.fecha,
    label: formatFechaLegible(registro.fecha).slice(0, 5),
    ph,
    cloro,
    turbidez: registro.calidadQuimica.turbidez,
    banistas: registro.condiciones.numeroBanistas,
    alertas: evaluarRegistro(registro).length,
  };
}

export function buildDashboardMetrics(data: AppData, dias = 14): DashboardMetrics {
  const hoy = formatFechaHoy();
  const ordenados = [...data.registros].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const serie = ordenados.slice(-dias).map(toSerie);
  const registroHoy = data.registros.find((r) => r.fecha === hoy);
  const alertasHoy = registroHoy ? evaluarRegistro(registroHoy).length : 0;

  const diasConAlerta = serie.filter((s) => s.alertas > 0).length;
  const diasOk = serie.filter((s) => s.alertas === 0).length;
  const conDatos = serie.length;
  const cumplimientoPct =
    conDatos > 0 ? Math.round((diasOk / conDatos) * 100) : null;

  const ultimo = serie[serie.length - 1];

  return {
    hoy,
    totalRegistros: data.registros.length,
    totalVisitas: data.visitas.length,
    registrosUltimos14: serie.length,
    alertasHoy,
    diasConAlerta,
    diasOk,
    cumplimientoPct,
    ultimoPh: ultimo?.ph ?? null,
    ultimoCloro: ultimo?.cloro ?? null,
    ultimaTurbidez: ultimo?.turbidez ?? null,
    serie,
    rangos: {
      phMin: RANGOS.ph.min ?? 7.2,
      phMax: RANGOS.ph.max ?? 8,
      cloroMin: RANGOS.cloroLibre.min ?? 1,
      cloroMax: RANGOS.cloroLibre.max ?? 3,
      turbidezMax: RANGOS.turbidez.max ?? 5,
    },
  };
}

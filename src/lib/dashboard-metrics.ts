import type { AppData, RegistroDiario, TipoEstructura } from "./types";
import { evaluarRegistro, obtenerRangos } from "./rangos-legales";
import { formatFechaHoy, formatFechaLegible } from "./storage";
import { getInstalacionActiva } from "./instalaciones";

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

function ultimoValor(...valores: Array<number | null | undefined>): number | null {
  for (const v of valores) {
    if (v !== null && v !== undefined) return v;
  }
  return null;
}

function toSerie(
  registro: RegistroDiario,
  tipo: TipoEstructura,
  categoria: AppData["configuracion"]["categoria"],
  catalogo: AppData["rangosCatalogo"],
): SerieCalidad {
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
    alertas: evaluarRegistro(
      registro,
      { tipoEstructura: tipo, categoria },
      catalogo,
    ).length,
  };
}

export function buildDashboardMetrics(data: AppData, dias = 14): DashboardMetrics {
  const hoy = formatFechaHoy();
  const activa = getInstalacionActiva(data);
  const tipo = activa.tipoEstructura;
  const categoria = activa.categoria;
  const catalogo = data.rangosCatalogo;
  const rangos = obtenerRangos({ tipoEstructura: tipo, categoria }, null, catalogo);
  const delLibro = data.registros.filter((r) => r.instalacionId === activa.id);
  const ordenados = [...delLibro].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const serie = ordenados.slice(-dias).map((r) => toSerie(r, tipo, categoria, catalogo));
  const registroHoy = delLibro.find((r) => r.fecha === hoy);
  const alertasHoy = registroHoy
    ? evaluarRegistro(registroHoy, { tipoEstructura: tipo, categoria }, catalogo).length
    : 0;

  const diasConAlerta = serie.filter((s) => s.alertas > 0).length;
  const diasOk = serie.filter((s) => s.alertas === 0).length;
  const conDatos = serie.length;
  const cumplimientoPct = conDatos > 0 ? Math.round((diasOk / conDatos) * 100) : null;
  const ultimo = serie[serie.length - 1];

  return {
    hoy,
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
    serie,
    rangos: {
      phMin: rangos.ph?.min ?? 7.2,
      phMax: rangos.ph?.max ?? 8,
      cloroMin: rangos.cloroLibre?.min ?? 1,
      cloroMax: rangos.cloroLibre?.max ?? 3,
      turbidezMax: rangos.turbidez?.max ?? 5,
    },
  };
}

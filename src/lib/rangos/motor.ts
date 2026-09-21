import type { CategoriaInstalacion, TipoEstructura } from "../types";
import { CATALOGO_BORRADOR_RES234, catalogoVacioProduccion } from "./catalogo-borrador-res234";
import type {
  CatalogoRangos,
  ContextoRango,
  EntradaCatalogoRango,
  PackRangos,
  ParametroRango,
  RangoLegal,
} from "./types";

export type {
  CatalogoRangos,
  ContextoRango,
  EntradaCatalogoRango,
  PackRangos,
  ParametroRango,
  RangoLegal,
  EstadoEntradaRango,
} from "./types";

export { CATALOGO_BORRADOR_RES234, catalogoVacioProduccion };

function coincideTipo(entrada: EntradaCatalogoRango, tipo: TipoEstructura): boolean {
  return entrada.tipoEstructura === "ambos" || entrada.tipoEstructura === tipo;
}

function coincideCategoria(
  entrada: EntradaCatalogoRango,
  categoria: CategoriaInstalacion | null,
): boolean {
  if (entrada.categoria === "todas") return true;
  if (!categoria) return false;
  return entrada.categoria === categoria;
}

/** Preferir fila especifica de categoria sobre "todas". */
function especificidad(entrada: EntradaCatalogoRango): number {
  let score = 0;
  if (entrada.tipoEstructura !== "ambos") score += 2;
  if (entrada.categoria !== "todas") score += 1;
  return score;
}

/**
 * Solo filas confirmadas y activas, y solo si el catalogo tiene produccion habilitada.
 * Si no hay pack usable, retorna null (no inventar ni usar OCR).
 */
export function obtenerPackRangos(
  catalogo: CatalogoRangos,
  ctx: ContextoRango,
): PackRangos | null {
  if (!catalogo.produccionHabilitada) return null;

  const candidatas = catalogo.entradas.filter(
    (e) =>
      e.activo &&
      e.estado === "confirmado" &&
      coincideTipo(e, ctx.tipoEstructura) &&
      coincideCategoria(e, ctx.categoria),
  );

  if (candidatas.length === 0) return null;

  const porParametro = new Map<ParametroRango, EntradaCatalogoRango>();
  for (const e of candidatas) {
    const prev = porParametro.get(e.parametro);
    if (!prev || especificidad(e) >= especificidad(prev)) {
      porParametro.set(e.parametro, e);
    }
  }

  const pack: PackRangos = {};
  for (const [parametro, e] of porParametro) {
    pack[parametro] = {
      min: e.min,
      max: e.max,
      idealMin: e.idealMin,
      idealMax: e.idealMax,
      unidad: e.unidad,
      norma: `${e.fuente} · ${catalogo.norma}`,
    };
  }
  return pack;
}

/** Compat: mapa string → RangoLegal para callers existentes. */
export function obtenerRangos(
  ctx: ContextoRango | TipoEstructura = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): Record<string, RangoLegal> {
  const contexto: ContextoRango =
    typeof ctx === "string"
      ? { tipoEstructura: ctx, categoria }
      : ctx;
  const pack = obtenerPackRangos(catalogo, contexto);
  return pack ?? {};
}

export function motorRangosListo(catalogo: CatalogoRangos): boolean {
  return (
    catalogo.produccionHabilitada &&
    catalogo.entradas.some((e) => e.activo && e.estado === "confirmado")
  );
}

export function resumenEstadoCatalogo(catalogo: CatalogoRangos): {
  listo: boolean;
  confirmadas: number;
  borradores: number;
  mensaje: string;
} {
  const confirmadas = catalogo.entradas.filter(
    (e) => e.estado === "confirmado" && e.activo,
  ).length;
  const borradores = catalogo.entradas.filter((e) => e.estado === "borrador_ocr").length;
  const listo = motorRangosListo(catalogo);
  return {
    listo,
    confirmadas,
    borradores,
    mensaje: listo
      ? `Motor activo con ${confirmadas} rango(s) confirmado(s).`
      : "Rangos Res. 234 pendientes de confirmacion visual del Anexo Tecnico I. No se emiten alarmas numericas de rango en produccion.",
  };
}

/**
 * Importa el borrador OCR al catalogo local SIN activar produccion.
 * Util para revisar/editar filas antes de confirmar.
 */
export function fusionarBorradorOcr(catalogo: CatalogoRangos): CatalogoRangos {
  const ids = new Set(catalogo.entradas.map((e) => e.id));
  const nuevas = CATALOGO_BORRADOR_RES234.entradas.filter((e) => !ids.has(e.id));
  return {
    ...catalogo,
    actualizadoEn: new Date().toISOString(),
    produccionHabilitada: false,
    entradas: [...catalogo.entradas, ...nuevas],
  };
}

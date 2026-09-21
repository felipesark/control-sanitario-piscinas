import type { CategoriaInstalacion, TipoEstructura } from "../types";

export type EstadoEntradaRango =
  | "borrador_ocr"
  | "pendiente_confirmacion"
  | "confirmado";

/** Parametros que el motor puede validar. */
export type ParametroRango =
  | "ph"
  | "cloroLibre"
  | "cloroCombinado"
  | "bromoTotal"
  | "turbidez"
  | "temperaturaAgua"
  | "acidoCianurico"
  | "alcalinidadTotal"
  | "durezaCalcica"
  | "orp"
  | "solidosDisueltos"
  | "conductividad"
  | "indiceLangelier";

export interface RangoLegal {
  min?: number;
  max?: number;
  idealMin?: number;
  idealMax?: number;
  unidad: string;
  norma: string;
}

/**
 * Fila de la tabla configurable.
 * Indexacion: tipoEstructura + categoria (+ parametro).
 * Solo las filas confirmadas y activas alimentan alertas en produccion.
 */
export interface EntradaCatalogoRango {
  id: string;
  parametro: ParametroRango;
  tipoEstructura: TipoEstructura | "ambos";
  categoria: CategoriaInstalacion | "todas";
  min?: number;
  max?: number;
  idealMin?: number;
  idealMax?: number;
  unidad: string;
  fuente: string;
  estado: EstadoEntradaRango;
  /** Debe ser true Y estado===confirmado para usarse en validacion. */
  activo: boolean;
  notas?: string;
  /** Discrepancias entre lecturas automaticas del PDF. */
  conflictosOcr?: string[];
}

export interface CatalogoRangos {
  version: string;
  norma: string;
  actualizadoEn: string;
  /**
   * Si false, el motor no emite alarmas numericas aunque haya filas.
   * Se activa solo cuando el Anexo Tecnico I este verificado visualmente.
   */
  produccionHabilitada: boolean;
  entradas: EntradaCatalogoRango[];
}

export interface ContextoRango {
  tipoEstructura: TipoEstructura;
  categoria: CategoriaInstalacion | null;
}

export type PackRangos = Partial<Record<ParametroRango, RangoLegal>>;

import type { CategoriaInstalacion, MomentoDia, RegistroDiario, TipoEstructura } from "./types";
import {
  catalogoVacioProduccion,
  motorRangosListo,
  obtenerPackRangos,
  obtenerRangos as obtenerRangosDeCatalogo,
  resumenEstadoCatalogo,
  type CatalogoRangos,
  type ContextoRango,
  type PackRangos,
  type RangoLegal,
} from "./rangos/motor";

export type { CatalogoRangos, ContextoRango, PackRangos, RangoLegal };
export {
  catalogoVacioProduccion,
  motorRangosListo,
  obtenerPackRangos,
  resumenEstadoCatalogo,
  CATALOGO_BORRADOR_RES234,
  fusionarBorradorOcr,
} from "./rangos/motor";

/**
 * @deprecated Ya no hay rangos fijos en codigo.
 * Se mantiene como objeto vacio para no romper imports legados.
 */
export const RANGOS: Record<string, RangoLegal> = {};

export function obtenerRangos(
  tipoOCtx: TipoEstructura | ContextoRango = "IA",
  categoria: CategoriaInstalacion | null = null,
  catalogo: CatalogoRangos = catalogoVacioProduccion(),
): Record<string, RangoLegal> {
  return obtenerRangosDeCatalogo(tipoOCtx, categoria, catalogo);
}

export type NivelAlerta = "critico" | "advertencia" | "info";

export interface Alerta {
  id: string;
  nivel: NivelAlerta;
  campo: string;
  valor: number | string;
  mensaje: string;
  norma: string;
}

const MOMENTO_LABEL: Record<MomentoDia, string> = {
  manana: "apertura",
  mediodia: "mediodia",
  tarde: "tarde",
};

export function fueraDeRango(valor: number, rango: RangoLegal): boolean {
  if (rango.min !== undefined && valor < rango.min) return true;
  if (rango.max !== undefined && valor > rango.max) return true;
  return false;
}

function mensajeRango(campo: string, valor: number, rango: RangoLegal): string {
  const partes: string[] = [];
  if (rango.min !== undefined) partes.push(`min ${rango.min}`);
  if (rango.max !== undefined) partes.push(`max ${rango.max}`);
  return `${campo}: ${valor} ${rango.unidad} (rango permitido: ${partes.join(", ")})`;
}

export function evaluarRegistro(
  registro: RegistroDiario,
  tipoEstructura: TipoEstructura | ContextoRango = "IA",
  categoriaOCatalogo?: CategoriaInstalacion | null | CatalogoRangos,
  catalogoArg?: CatalogoRangos,
): Alerta[] {
  const ctx: ContextoRango =
    typeof tipoEstructura === "string"
      ? {
          tipoEstructura,
          categoria:
            categoriaOCatalogo && typeof categoriaOCatalogo === "object" && "entradas" in categoriaOCatalogo
              ? null
              : ((categoriaOCatalogo as CategoriaInstalacion | null | undefined) ?? null),
        }
      : tipoEstructura;

  const catalogo: CatalogoRangos =
    catalogoArg ??
    (categoriaOCatalogo && typeof categoriaOCatalogo === "object" && "entradas" in categoriaOCatalogo
      ? (categoriaOCatalogo as CatalogoRangos)
      : catalogoVacioProduccion());

  const alertas: Alerta[] = [];
  const pack = obtenerPackRangos(catalogo, ctx);

  if (!pack) {
    const estado = resumenEstadoCatalogo(catalogo);
    alertas.push({
      id: "rangos-pendientes",
      nivel: "info",
      campo: "Motor de rangos",
      valor: "Pendiente",
      mensaje: estado.mensaje,
      norma: catalogo.norma,
    });
  } else {
    (["manana", "mediodia", "tarde"] as MomentoDia[]).forEach((momento) => {
      const ph = registro.calidadQuimica.ph[momento];
      if (ph !== null && pack.ph && fueraDeRango(ph, pack.ph)) {
        alertas.push({
          id: `ph-${momento}`,
          nivel: "critico",
          campo: `pH (${MOMENTO_LABEL[momento]})`,
          valor: ph,
          mensaje: mensajeRango("pH", ph, pack.ph),
          norma: pack.ph.norma,
        });
      }

      const cloro = registro.calidadQuimica.cloroLibre[momento];
      if (cloro !== null && pack.cloroLibre && fueraDeRango(cloro, pack.cloroLibre)) {
        alertas.push({
          id: `cloro-${momento}`,
          nivel: cloro < (pack.cloroLibre.min ?? 0) ? "critico" : "advertencia",
          campo: `Cloro libre (${MOMENTO_LABEL[momento]})`,
          valor: cloro,
          mensaje: mensajeRango("Cloro libre", cloro, pack.cloroLibre),
          norma: pack.cloroLibre.norma,
        });
      }

      const combinado = registro.calidadQuimica.cloroCombinado[momento];
      if (
        combinado !== null &&
        pack.cloroCombinado &&
        fueraDeRango(combinado, pack.cloroCombinado)
      ) {
        alertas.push({
          id: `combinado-${momento}`,
          nivel: "advertencia",
          campo: `Cloro combinado (${MOMENTO_LABEL[momento]})`,
          valor: combinado,
          mensaje: mensajeRango("Cloro combinado", combinado, pack.cloroCombinado),
          norma: pack.cloroCombinado.norma,
        });
      }
    });

    const turbidez = registro.calidadQuimica.turbidez;
    if (turbidez !== null && pack.turbidez && fueraDeRango(turbidez, pack.turbidez)) {
      alertas.push({
        id: "turbidez",
        nivel: "critico",
        campo: "Turbidez",
        valor: turbidez,
        mensaje: mensajeRango("Turbidez", turbidez, pack.turbidez),
        norma: pack.turbidez.norma,
      });
    }

    const temp = registro.calidadQuimica.temperatura;
    if (temp !== null && pack.temperaturaAgua && fueraDeRango(temp, pack.temperaturaAgua)) {
      alertas.push({
        id: "temperatura",
        nivel: "advertencia",
        campo: "Temperatura del agua",
        valor: temp,
        mensaje: mensajeRango("Temperatura", temp, pack.temperaturaAgua),
        norma: pack.temperaturaAgua.norma,
      });
    }

    const cianurico = registro.calidadQuimica.acidoCianurico;
    if (
      cianurico !== null &&
      pack.acidoCianurico &&
      fueraDeRango(cianurico, pack.acidoCianurico)
    ) {
      alertas.push({
        id: "cianurico",
        nivel: "advertencia",
        campo: "Acido cianurico",
        valor: cianurico,
        mensaje: mensajeRango("Acido cianurico", cianurico, pack.acidoCianurico),
        norma: pack.acidoCianurico.norma,
      });
    }
  }

  (["color", "materiaFlotante", "olor", "transparencia"] as const).forEach((campo) => {
    const valor = registro.calidadFisica[campo];
    if (valor === "no_aceptable") {
      alertas.push({
        id: `fisica-${campo}`,
        nivel: "critico",
        campo: campo,
        valor: "No aceptable",
        mensaje: `Calidad fisica: ${campo} no aceptable`,
        norma: "Libro estandar - control diario",
      });
    }
  });

  if (registro.ajustes.accidenteContaminacion) {
    alertas.push({
      id: "contaminacion",
      nivel: "critico",
      campo: "Contaminacion fecal",
      valor: "Si",
      mensaje:
        "Se registro accidente por contaminacion. Aplicar protocolo de choque y vaciado segun norma.",
      norma: "Protocolo de contingencia",
    });
  }

  return alertas;
}

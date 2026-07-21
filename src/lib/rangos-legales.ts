import type { MomentoDia, RegistroDiario } from "./types";

export interface RangoLegal {
  min?: number;
  max?: number;
  unidad: string;
  norma: string;
}

export const RANGOS: Record<string, RangoLegal> = {
  ph: { min: 7.2, max: 8.0, unidad: "pH", norma: "Decreto 3751/1993 - Res. 1618/2010" },
  cloroLibre: { min: 1.0, max: 3.0, unidad: "mg/L", norma: "Decreto 3751/1993 - Res. 1618/2010" },
  cloroCombinado: { max: 0.5, unidad: "mg/L", norma: "Decreto 3751/1993" },
  turbidez: { max: 5, unidad: "UNT", norma: "Res. 1618/2010" },
  temperaturaAgua: { min: 20, max: 32, unidad: "C", norma: "Buenas practicas operativas" },
  acidoCianurico: { min: 30, max: 80, unidad: "mg/L", norma: "Cuando se usa cloro estabilizado" },
};

export type NivelAlerta = "critico" | "advertencia";

export interface Alerta {
  id: string;
  nivel: NivelAlerta;
  campo: string;
  valor: number | string;
  mensaje: string;
  norma: string;
}

const MOMENTO_LABEL: Record<MomentoDia, string> = {
  manana: "manana",
  mediodia: "mediodia",
  tarde: "tarde",
};

function fueraDeRango(valor: number, rango: RangoLegal): boolean {
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

export function evaluarRegistro(registro: RegistroDiario): Alerta[] {
  const alertas: Alerta[] = [];

  (["manana", "mediodia", "tarde"] as MomentoDia[]).forEach((momento) => {
    const ph = registro.calidadQuimica.ph[momento];
    if (ph !== null && fueraDeRango(ph, RANGOS.ph)) {
      alertas.push({
        id: `ph-${momento}`,
        nivel: "critico",
        campo: `pH (${MOMENTO_LABEL[momento]})`,
        valor: ph,
        mensaje: mensajeRango("pH", ph, RANGOS.ph),
        norma: RANGOS.ph.norma,
      });
    }

    const cloro = registro.calidadQuimica.cloroLibre[momento];
    if (cloro !== null && fueraDeRango(cloro, RANGOS.cloroLibre)) {
      alertas.push({
        id: `cloro-${momento}`,
        nivel: cloro < (RANGOS.cloroLibre.min ?? 0) ? "critico" : "advertencia",
        campo: `Cloro libre (${MOMENTO_LABEL[momento]})`,
        valor: cloro,
        mensaje: mensajeRango("Cloro libre", cloro, RANGOS.cloroLibre),
        norma: RANGOS.cloroLibre.norma,
      });
    }

    const combinado = registro.calidadQuimica.cloroCombinado[momento];
    if (combinado !== null && fueraDeRango(combinado, RANGOS.cloroCombinado)) {
      alertas.push({
        id: `combinado-${momento}`,
        nivel: "advertencia",
        campo: `Cloro combinado (${MOMENTO_LABEL[momento]})`,
        valor: combinado,
        mensaje: mensajeRango("Cloro combinado", combinado, RANGOS.cloroCombinado),
        norma: RANGOS.cloroCombinado.norma,
      });
    }
  });

  const turbidez = registro.calidadQuimica.turbidez;
  if (turbidez !== null && fueraDeRango(turbidez, RANGOS.turbidez)) {
    alertas.push({
      id: "turbidez",
      nivel: "critico",
      campo: "Turbidez",
      valor: turbidez,
      mensaje: mensajeRango("Turbidez", turbidez, RANGOS.turbidez),
      norma: RANGOS.turbidez.norma,
    });
  }

  const temp = registro.calidadQuimica.temperatura;
  if (temp !== null && fueraDeRango(temp, RANGOS.temperaturaAgua)) {
    alertas.push({
      id: "temperatura",
      nivel: "advertencia",
      campo: "Temperatura del agua",
      valor: temp,
      mensaje: mensajeRango("Temperatura", temp, RANGOS.temperaturaAgua),
      norma: RANGOS.temperaturaAgua.norma,
    });
  }

  const cianurico = registro.calidadQuimica.acidoCianurico;
  if (cianurico !== null && fueraDeRango(cianurico, RANGOS.acidoCianurico)) {
    alertas.push({
      id: "cianurico",
      nivel: "advertencia",
      campo: "Acido cianurico",
      valor: cianurico,
      mensaje: mensajeRango("Acido cianurico", cianurico, RANGOS.acidoCianurico),
      norma: RANGOS.acidoCianurico.norma,
    });
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
      mensaje: "Se registro accidente por contaminacion. Aplicar protocolo de choque y vaciado segun norma.",
      norma: "Protocolo de contingencia",
    });
  }

  return alertas;
}
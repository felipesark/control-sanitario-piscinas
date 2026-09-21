import type { CatalogoRangos } from "./types";

/**
 * Borrador extraido por lectura automatica del PDF de la Resolucion 234 de 2026
 * (Anexo Tecnico I). NO activar en produccion hasta confirmacion visual.
 *
 * Conflicto documentado (misma lectura OCR repetida dos veces):
 * - Cloro residual libre: 0.2-3.0 mg/L (1a lectura) vs 2.0-4.0 mg/L (2a lectura).
 * Otras cifras tambien variaron; usar solo como guia para la verificacion humana.
 *
 * Ideal: adjuntar foto de la pagina del Anexo Tecnico I y marcar cada fila
 * como confirmado + activo=true, luego produccionHabilitada=true.
 */
export const CATALOGO_BORRADOR_RES234: CatalogoRangos = {
  version: "res234-2026-borrador-ocr-v0",
  norma: "Resolucion 234 de 2026 — Anexo Tecnico I (BORRADOR OCR, no confirmado)",
  actualizadoEn: new Date().toISOString(),
  produccionHabilitada: false,
  entradas: [
    {
      id: "ph-ambos-todas",
      parametro: "ph",
      tipoEstructura: "ambos",
      categoria: "todas",
      min: 6.8,
      max: 7.3,
      idealMin: 7.0,
      idealMax: 7.2,
      unidad: "pH",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      notas: "Candidato a corregir la alarma de pH de Bryan (antes se usaba 7.2-8.0 legacy).",
      conflictosOcr: [
        "Confirmar visualmente 6,8-7,3 y rango ideal 7,0-7,2 en la tabla oficial.",
      ],
    },
    {
      id: "cloroLibre-IA-todas",
      parametro: "cloroLibre",
      tipoEstructura: "IA",
      categoria: "todas",
      min: 2.0,
      max: 4.0,
      unidad: "mg/L",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      conflictosOcr: [
        "1a lectura OCR: 0.2-3.0 mg/L",
        "2a lectura OCR: 2.0-4.0 mg/L (piscinas)",
        "NO usar en produccion hasta foto/confirmacion del Anexo I.",
      ],
    },
    {
      id: "cloroLibre-ES-todas",
      parametro: "cloroLibre",
      tipoEstructura: "ES",
      categoria: "todas",
      min: 3.0,
      max: 5.0,
      unidad: "mg/L",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      conflictosOcr: [
        "OCR sugiere 3.0-5.0 mg/L para estructuras similares; confirmar visualmente.",
      ],
    },
    {
      id: "cloroCombinado-ambos-todas",
      parametro: "cloroCombinado",
      tipoEstructura: "ambos",
      categoria: "todas",
      max: 0.0,
      unidad: "mg/L",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      notas: "OCR sugiere valor aceptable 0.0; confirmar si es max=0 o umbral de deteccion.",
    },
    {
      id: "bromoTotal-ambos-todas",
      parametro: "bromoTotal",
      tipoEstructura: "ambos",
      categoria: "todas",
      min: 2.0,
      max: 3.0,
      unidad: "mg/L",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      notas: "Aplica cuando el desinfectante es a base de bromo.",
    },
    {
      id: "acidoCianurico-ambos-todas",
      parametro: "acidoCianurico",
      tipoEstructura: "ambos",
      categoria: "todas",
      min: 2.0,
      max: 4.0,
      unidad: "mg/L",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      conflictosOcr: [
        "OCR ambiguo (tambien aparecen 2-4 vs limites superiores 15); confirmar en tabla.",
        "Nota normativa tipica: no aplica en piscina cubierta / estabilizado.",
      ],
    },
    {
      id: "durezaCalcica-ambos-todas",
      parametro: "durezaCalcica",
      tipoEstructura: "ambos",
      categoria: "todas",
      min: 200,
      max: 400,
      unidad: "mg/L CaCO3",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
    },
    {
      id: "alcalinidadTotal-ambos-todas",
      parametro: "alcalinidadTotal",
      tipoEstructura: "ambos",
      categoria: "todas",
      min: 80,
      max: 120,
      unidad: "mg/L CaCO3",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
    },
    {
      id: "indiceLangelier-ambos-todas",
      parametro: "indiceLangelier",
      tipoEstructura: "ambos",
      categoria: "todas",
      min: -0.3,
      max: 0.3,
      unidad: "ISL",
      fuente: "Res. 234/2026 Anexo I — OCR no verificado",
      estado: "borrador_ocr",
      activo: false,
      notas: "OCR: rango ideal aprox. -0.3 a 0.3; limites externos a confirmar.",
    },
  ],
};

export function catalogoVacioProduccion(): CatalogoRangos {
  return {
    version: "vacio-pendiente-confirmacion",
    norma: "Resolucion 234 de 2026 — pendiente confirmacion visual del Anexo Tecnico I",
    actualizadoEn: new Date().toISOString(),
    produccionHabilitada: false,
    entradas: [],
  };
}

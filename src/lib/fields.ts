import type { Frecuencia } from "./types";

export interface CampoDefinicion {
  id: string;
  label: string;
  frecuencia: Frecuencia;
  unidad?: string;
  tipo: "numero" | "texto" | "aceptable" | "checkbox" | "momento";
  grupo: string;
  nota?: string;
}

export const LABORES_OPERACION: CampoDefinicion[] = [
  { id: "limpiezaMaterialFlotante", label: "Limpieza de material flotante", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "limpiezaFondo", label: "Limpieza de fondo", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "cepillado", label: "Cepillado", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "aspirado", label: "Aspirado", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "limpiezaParedes", label: "Limpieza de paredes", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "vaciado", label: "Vaciado (cuando se requiera)", frecuencia: "eventual", tipo: "checkbox", grupo: "Labores" },
  { id: "limpiezaDesinfeccion", label: "Limpieza y desinfeccion", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "desnatadores", label: "Desnatadores", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "trampaCabello", label: "Trampa de cabello", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "lavadoFiltro", label: "Lavado de filtro (retrolavado)", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "lavapies", label: "Lavapies", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "duchas", label: "Duchas", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "andenes", label: "Andenes y alrededores", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "instalacionesSanitarias", label: "Instalaciones sanitarias", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "vestidores", label: "Vestidores y guardarropa", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "primerosAuxilios", label: "Local de primeros auxilios", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "productosQuimicos", label: "Local de productos quimicos", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "localOperacion", label: "Local de operacion", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "atracciones", label: "Atracciones recreativas acuaticas", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "bronceadores", label: "Bronceadores en la linea de flotacion", frecuencia: "semanal", tipo: "checkbox", grupo: "Labores" },
  { id: "trampasCanastillas", label: "Trampas y canastillas", frecuencia: "diaria", tipo: "checkbox", grupo: "Labores" },
  { id: "plaguicidas", label: "Aplicacion de plaguicidas en instalaciones anexas", frecuencia: "eventual", tipo: "checkbox", grupo: "Labores" },
];

export const MANTENIMIENTO_REPARACIONES: CampoDefinicion[] = [
  { id: "bomba", label: "Bomba", frecuencia: "mensual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "motor", label: "Motor", frecuencia: "mensual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "valvulas", label: "Valvulas y accesorios", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "desnatadoresMant", label: "Desnatadores", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "trampaCabellosMant", label: "Trampa de cabellos", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "dosificacionQuimicos", label: "Equipos dosificacion de quimicos", frecuencia: "mensual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "sistemaElectrico", label: "Sistema electrico", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "revisionFiltro", label: "Revision de filtro", frecuencia: "trimestral", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "otros", label: "Otros", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
];

/** Revisión diaria obligatoria: aceptable / no aceptable. */
export const DISPOSITIVOS_SEGURIDAD: CampoDefinicion[] = [
  { id: "cerramiento", label: "Cerramiento", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "alarmaInmersion", label: "Alarma de inmersion", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "botonEmergencia", label: "Boton de emergencia / parada", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "rejillas", label: "Rejillas y sumideros", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "tapones", label: "Tapones / cubiertas antiatrapamiento", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "liberacionVacio", label: "Sistema de liberacion de vacio", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "lavapiesSeg", label: "Lavapies", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "andenesSeg", label: "Andenes y zonas de circulacion", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "desnatadoresSeg", label: "Desnatadores", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
  { id: "citofono", label: "Citofono / comunicacion de emergencia", frecuencia: "diaria", tipo: "aceptable", grupo: "Seguridad" },
];

/** Parametros quimicos periodicos (visibilidad por ultima medicion). */
export const PARAMETROS_PERIODICOS: CampoDefinicion[] = [
  { id: "turbidez", label: "Turbidez (UNT)", frecuencia: "diaria", tipo: "numero", grupo: "Quimica", unidad: "UNT" },
  { id: "temperatura", label: "Temperatura del agua (°C)", frecuencia: "diaria", tipo: "numero", grupo: "Quimica", unidad: "C" },
  { id: "conductividad", label: "Conductividad (µS/cm)", frecuencia: "semanal", tipo: "numero", grupo: "Quimica", unidad: "µS/cm" },
  { id: "cloruros", label: "Cloruros (mg/L Cl)", frecuencia: "mensual", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "acidoCianurico", label: "Acido cianurico (mg/L)", frecuencia: "semanal", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "alcalinidadTotal", label: "Alcalinidad total (mg/L CaCO₃)", frecuencia: "semanal", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "durezaCalcica", label: "Dureza calcica (mg/L CaCO₃)", frecuencia: "mensual", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "aluminio", label: "Aluminio (mg/L)", frecuencia: "trimestral", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "bromoLibre", label: "Bromo libre (mg/L)", frecuencia: "mensual", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "bromoTotal", label: "Bromo total (mg/L)", frecuencia: "mensual", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "amonioIon", label: "Amonio ion (mg/L)", frecuencia: "trimestral", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "cobre", label: "Cobre (mg/L)", frecuencia: "trimestral", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "hierro", label: "Hierro (mg/L)", frecuencia: "trimestral", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
  { id: "plata", label: "Plata (mg/L)", frecuencia: "anual", tipo: "numero", grupo: "Quimica", unidad: "mg/L" },
];

export const FRECUENCIA_LABEL: Record<Frecuencia, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
  trimestral: "Trimestral",
  anual: "Anual",
  eventual: "Eventual",
};

export const MOMENTO_LABEL = {
  manana: "Apertura",
  mediodia: "Mediodia",
  tarde: "Tarde",
} as const;

export const FASE_LABEL: Record<
  import("./types").FaseOperacion,
  { titulo: string; subtitulo: string }
> = {
  apertura: {
    titulo: "1. Apertura",
    subtitulo: "Antes de que entren banistas",
  },
  mediodia: {
    titulo: "2. Mediodia",
    subtitulo: "Control durante la operacion",
  },
  tarde: {
    titulo: "3. Tarde",
    subtitulo: "Antes de cerrar al publico",
  },
  cierre: {
    titulo: "4. Cierre",
    subtitulo: "Cerrar y firmar el registro del dia",
  },
};

/** Slot quimico (a/b/c) asociado a cada momento operativo. */
export const FASE_A_SLOT: Record<"apertura" | "mediodia" | "tarde", keyof typeof MOMENTO_LABEL> = {
  apertura: "manana",
  mediodia: "mediodia",
  tarde: "tarde",
};

export const FRECUENCIA_DIAS: Record<Exclude<Frecuencia, "eventual">, number> = {
  diaria: 1,
  semanal: 7,
  mensual: 30,
  trimestral: 90,
  anual: 365,
};

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
  { id: "cerramiento", label: "Cerramiento", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "alarmaInmersion", label: "Alarma de inmersion", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "cubiertaAntiatrapamiento", label: "Cubierta antiatrapamiento", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "seguridadVacio", label: "Sistema de seguridad de liberacion de vacio", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "paradaEmergencia", label: "Boton de parada de emergencia", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "citofono", label: "Citofono", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "revisionFiltro", label: "Revision de filtro (cada tres meses)", frecuencia: "mensual", tipo: "checkbox", grupo: "Mantenimiento" },
  { id: "otros", label: "Otros", frecuencia: "eventual", tipo: "checkbox", grupo: "Mantenimiento" },
];

export const FRECUENCIA_LABEL: Record<Frecuencia, string> = {
  diaria: "Diaria",
  semanal: "Semanal",
  mensual: "Mensual",
  anual: "Anual",
  eventual: "Eventual",
};

export const MOMENTO_LABEL = {
  manana: "Manana (a)",
  mediodia: "Mediodia (b)",
  tarde: "Tarde (c)",
} as const;
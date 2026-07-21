export type Frecuencia = "diaria" | "semanal" | "mensual" | "anual" | "eventual";

export type ValorAceptable = "aceptable" | "no_aceptable";

export type MomentoDia = "manana" | "mediodia" | "tarde";

export interface Operador {
  id: string;
  nombre: string;
  identificacion: string;
}

export interface ConfiguracionInstalacion {
  razonSocial: string;
  representanteLegal: string;
  administrador: string;
  operadores: Operador[];
  direccion: string;
  municipio: string;
  localidad: string;
  telefonoFijo: string;
  telefonoMovil: string;
  nit: string;
  email: string;
  salvavidas: Operador[];
  nombreEstanque: string;
  usoColectiva: boolean;
  usoPublico: boolean;
  usoParticular: boolean;
  presentacionDescubierta: boolean;
  presentacionCubierta: boolean;
  largo: number | null;
  ancho: number | null;
  diametro: number | null;
  profundidad: number | null;
  volumen: number | null;
  areaSuperficial: number | null;
  maximoBanistas: number | null;
  fuenteAguaPotable: boolean;
  fuenteAguaNatural: boolean;
  sistemaRecirculacion: boolean;
  sistemaRenovacionContinua: boolean;
  sistemaDesalojo: boolean;
  sistemaRestringido: boolean;
  sistemaEspecial: boolean;
}

export interface CondicionesOperacion {
  horaInicio: string;
  horaFinal: string;
  temperaturaAire: number | null;
  humedadRelativa: number | null;
  numeroBanistas: number | null;
  horasFiltracion: number | null;
  presionTrabajo: number | null;
  volumenRecirculado: number | null;
  nivelAguaProfundidad: number | null;
  volumenAguaSuministrada: number | null;
  velocidadFlujo: number | null;
  periodoRecirculacion: number | null;
}

export interface CalidadFisica {
  color: ValorAceptable | null;
  materiaFlotante: ValorAceptable | null;
  olor: ValorAceptable | null;
  transparencia: ValorAceptable | null;
}

export interface ValoresPorMomento {
  manana: number | null;
  mediodia: number | null;
  tarde: number | null;
}

export interface CalidadQuimica {
  potencialOxidacion: ValoresPorMomento;
  turbidez: number | null;
  ph: ValoresPorMomento;
  temperatura: number | null;
  conductividad: number | null;
  cloroLibre: ValoresPorMomento;
  cloroCombinado: ValoresPorMomento;
  cloruros: number | null;
  acidoCianurico: number | null;
  alcalinidadTotal: number | null;
  durezaCalcica: number | null;
  aluminio: number | null;
  bromoLibre: number | null;
  bromoTotal: number | null;
  amonioIon: number | null;
  cobre: number | null;
  hierro: number | null;
  plata: number | null;
}

export interface CalidadMicrobiologica {
  heterotrofos: number | null;
  coliformesTermotolerantes: number | null;
  escherichiaColi: number | null;
  pseudomonaAeruginosa: number | null;
  cryptosporidium: number | null;
  giardia: number | null;
}

export interface IndicesAgua {
  indiceLangelier: number | null;
  indiceRiesgo: number | null;
}

export interface AjustesAgua {
  cloroResidualDosificado: number | null;
  cloroResidualUnidad: "kg" | "L";
  phAlto: number | null;
  phAltoUnidad: "kg" | "L";
  phBajo: number | null;
  phBajoUnidad: "kg" | "L";
  cloraminasDosificado: number | null;
  cloraminasUnidad: "kg" | "L";
  acidoCianuricoReposicion: number | null;
  durezaReposicion: number | null;
  turbidezCoagulante: number | null;
  conductividadReposicion: number | null;
  accidenteContaminacion: boolean;
  colorDosificado: number | null;
  colorUnidad: "kg" | "L";
  tiempoContactoMinimo: number | null;
}

export interface RegistroDiario {
  id: string;
  fecha: string;
  operadorId: string;
  salvavidasId: string;
  condiciones: CondicionesOperacion;
  calidadFisica: CalidadFisica;
  calidadQuimica: CalidadQuimica;
  calidadMicrobiologica: CalidadMicrobiologica;
  indices: IndicesAgua;
  ajustes: AjustesAgua;
  labores: Record<string, boolean>;
  mantenimiento: Record<string, boolean>;
  incidencias: string;
  observaciones: string;
  firmaOperador: string | null;
  firmaFecha: string | null;
  actualizadoEn: string;
}

export interface VisitaInspeccion {
  id: string;
  fecha: string;
  hora: string;
  autoridadSanitaria: string;
  conceptoEmitido: string;
  funcionarioNombre: string;
  funcionarioCargo: string;
}

export interface AppData {
  instalacionId: string;
  ultimaSincronizacion: string | null;
  configuracion: ConfiguracionInstalacion;
  registros: RegistroDiario[];
  visitas: VisitaInspeccion[];
}

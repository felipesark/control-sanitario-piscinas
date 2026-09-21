export type Frecuencia = "diaria" | "semanal" | "mensual" | "trimestral" | "anual" | "eventual";

export type ValorAceptable = "aceptable" | "no_aceptable";

export type AptitudEstanque = "apto" | "no_apto";

export type MomentoDia = "manana" | "mediodia" | "tarde";

/** Flujo operativo del día (no es un formulario de una sola vez). */
export type FaseOperacion = "apertura" | "mediodia" | "tarde" | "cierre";

export type EstadoRegistroDia = "en_progreso" | "cerrado";

/** IA = Instalacion Acuatica (piscina). ES = Estructura Similar (spa/jacuzzi). */
export type TipoEstructura = "IA" | "ES";

/**
 * Categoria normativa (Especial / 1° / 2° / 3°).
 * Indexa el motor de rangos junto con IA/ES.
 * Los valores numericos del Anexo I deben confirmarse visualmente antes de activarlos.
 */
export type CategoriaInstalacion = "especial" | "primera" | "segunda" | "tercera";

export type PresentacionEstanque = "cubierta" | "descubierta";

export interface ProgresoDia {
  apertura: boolean;
  mediodia: boolean;
  tarde: boolean;
  cierre: boolean;
}

export interface HorasFase {
  apertura: string;
  mediodia: string;
  tarde: string;
  cierre: string;
}

export interface Operador {
  id: string;
  nombre: string;
  identificacion: string;
}

/** Datos del establecimiento (administracion). */
export interface Establecimiento {
  id: string;
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
}

/** Zona humeda: varias instalaciones pueden compartir el conteo de banistas. */
export interface ZonaHumeda {
  id: string;
  nombre: string;
}

export interface Instalacion {
  id: string;
  zonaHumedaId: string;
  nombre: string;
  tipoEstructura: TipoEstructura;
  /** Pendiente de reglas de rangos por categoria — no inventar. */
  categoria: CategoriaInstalacion | null;
  presentacion: PresentacionEstanque;
  usoColectiva: boolean;
  usoPublico: boolean;
  usoParticular: boolean;
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

export interface ConteoBanistasZona {
  zonaHumedaId: string;
  fecha: string;
  numeroBanistas: number;
}

/**
 * Vista plana legado (establecimiento + instalacion activa).
 * Se mantiene para sync/PDF y migracion.
 */
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
  tipoEstructura: TipoEstructura;
  categoria: CategoriaInstalacion | null;
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
  zonaHumedaId: string;
  zonaHumedaNombre: string;
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
  huboDosificacion: boolean;
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
  tiempoRestablecimientoMin: number | null;
  aptitudPostAccidente: AptitudEstanque | null;
}

/** Instantanea firmada; las correcciones posteriores no la alteran. */
export interface CorreccionRegistro {
  id: string;
  creadoEn: string;
  motivo: string;
  /** Copia inmutable del registro tal como estaba firmado antes de la correccion. */
  snapshotFirmado: RegistroDiario;
}

export interface RegistroDiario {
  id: string;
  instalacionId: string;
  fecha: string;
  estadoDia: EstadoRegistroDia;
  progreso: ProgresoDia;
  horasFase: HorasFase;
  operadorId: string;
  salvavidasId: string;
  condiciones: CondicionesOperacion;
  calidadFisica: CalidadFisica;
  calidadQuimica: CalidadQuimica;
  calidadMicrobiologica: CalidadMicrobiologica;
  indices: IndicesAgua;
  ajustes: AjustesAgua;
  dispositivosSeguridad: Record<string, ValorAceptable | null>;
  evaluacionEstanque: AptitudEstanque | null;
  labores: Record<string, boolean>;
  mantenimiento: Record<string, boolean>;
  incidencias: string;
  observaciones: string;
  firmaOperador: string | null;
  firmaFecha: string | null;
  bloqueado: boolean;
  /** Rastro de correcciones posteriores a firmas previas. */
  correcciones: CorreccionRegistro[];
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
  /** Alias de instalacionActivaId (compat sync/billing). */
  instalacionId: string;
  instalacionActivaId: string;
  establecimiento: Establecimiento;
  zonasHumedas: ZonaHumeda[];
  instalaciones: Instalacion[];
  conteosBanistas: ConteoBanistasZona[];
  /** Vista plana de la instalacion activa + establecimiento. */
  configuracion: ConfiguracionInstalacion;
  /**
   * Tabla configurable de rangos (tipo x categoria).
   * Produccion deshabilitada hasta confirmacion visual del Anexo I.
   */
  rangosCatalogo: import("./rangos/types").CatalogoRangos;
  ultimaSincronizacion: string | null;
  registros: RegistroDiario[];
  visitas: VisitaInspeccion[];
}

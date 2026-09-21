import type {
  AjustesAgua,
  CalidadFisica,
  CalidadMicrobiologica,
  CalidadQuimica,
  CondicionesOperacion,
  ConfiguracionInstalacion,
  Establecimiento,
  HorasFase,
  IndicesAgua,
  Instalacion,
  ProgresoDia,
  RegistroDiario,
  ValorAceptable,
  ValoresPorMomento,
  ZonaHumeda,
} from "./types";
import { DISPOSITIVOS_SEGURIDAD, LABORES_OPERACION, MANTENIMIENTO_REPARACIONES } from "./fields";

function valoresPorMomento(): ValoresPorMomento {
  return { manana: null, mediodia: null, tarde: null };
}

function checkboxesFromFields(fields: { id: string }[]): Record<string, boolean> {
  return Object.fromEntries(fields.map((f) => [f.id, false]));
}

function dispositivosVacios(): Record<string, ValorAceptable | null> {
  return Object.fromEntries(DISPOSITIVOS_SEGURIDAD.map((d) => [d.id, null]));
}

export function horaActual(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function defaultProgreso(): ProgresoDia {
  return { apertura: false, mediodia: false, tarde: false, cierre: false };
}

export function defaultHorasFase(): HorasFase {
  return { apertura: "", mediodia: "", tarde: "", cierre: "" };
}

export function defaultEstablecimiento(id = crypto.randomUUID()): Establecimiento {
  return {
    id,
    razonSocial: "",
    representanteLegal: "",
    administrador: "",
    operadores: [],
    direccion: "",
    municipio: "",
    localidad: "",
    telefonoFijo: "",
    telefonoMovil: "",
    nit: "",
    email: "",
    salvavidas: [],
  };
}

export function defaultZonaHumeda(id = crypto.randomUUID(), nombre = "Zona humeda principal"): ZonaHumeda {
  return { id, nombre };
}

export function defaultInstalacion(
  zonaHumedaId: string,
  id = crypto.randomUUID(),
  nombre = "Estanque principal",
): Instalacion {
  return {
    id,
    zonaHumedaId,
    nombre,
    tipoEstructura: "IA",
    categoria: null,
    presentacion: "descubierta",
    usoColectiva: false,
    usoPublico: false,
    usoParticular: false,
    largo: null,
    ancho: null,
    diametro: null,
    profundidad: null,
    volumen: null,
    areaSuperficial: null,
    maximoBanistas: null,
    fuenteAguaPotable: true,
    fuenteAguaNatural: false,
    sistemaRecirculacion: true,
    sistemaRenovacionContinua: false,
    sistemaDesalojo: false,
    sistemaRestringido: false,
    sistemaEspecial: false,
  };
}

export function buildConfiguracion(
  establecimiento: Establecimiento,
  instalacion: Instalacion,
  zona: ZonaHumeda,
): ConfiguracionInstalacion {
  return {
    razonSocial: establecimiento.razonSocial,
    representanteLegal: establecimiento.representanteLegal,
    administrador: establecimiento.administrador,
    operadores: establecimiento.operadores,
    direccion: establecimiento.direccion,
    municipio: establecimiento.municipio,
    localidad: establecimiento.localidad,
    telefonoFijo: establecimiento.telefonoFijo,
    telefonoMovil: establecimiento.telefonoMovil,
    nit: establecimiento.nit,
    email: establecimiento.email,
    salvavidas: establecimiento.salvavidas,
    nombreEstanque: instalacion.nombre,
    tipoEstructura: instalacion.tipoEstructura,
    categoria: instalacion.categoria,
    usoColectiva: instalacion.usoColectiva,
    usoPublico: instalacion.usoPublico,
    usoParticular: instalacion.usoParticular,
    presentacionDescubierta: instalacion.presentacion === "descubierta",
    presentacionCubierta: instalacion.presentacion === "cubierta",
    largo: instalacion.largo,
    ancho: instalacion.ancho,
    diametro: instalacion.diametro,
    profundidad: instalacion.profundidad,
    volumen: instalacion.volumen,
    areaSuperficial: instalacion.areaSuperficial,
    maximoBanistas: instalacion.maximoBanistas,
    fuenteAguaPotable: instalacion.fuenteAguaPotable,
    fuenteAguaNatural: instalacion.fuenteAguaNatural,
    sistemaRecirculacion: instalacion.sistemaRecirculacion,
    sistemaRenovacionContinua: instalacion.sistemaRenovacionContinua,
    sistemaDesalojo: instalacion.sistemaDesalojo,
    sistemaRestringido: instalacion.sistemaRestringido,
    sistemaEspecial: instalacion.sistemaEspecial,
    zonaHumedaId: zona.id,
    zonaHumedaNombre: zona.nombre,
  };
}

/** Compat: config plana por defecto (una zona + una instalacion). */
export function defaultConfiguracion(): ConfiguracionInstalacion {
  const est = defaultEstablecimiento();
  const zona = defaultZonaHumeda();
  const inst = defaultInstalacion(zona.id);
  return buildConfiguracion(est, inst, zona);
}

export function defaultCondiciones(autoInicio = false): CondicionesOperacion {
  return {
    horaInicio: autoInicio ? horaActual() : "",
    horaFinal: "",
    temperaturaAire: null,
    humedadRelativa: null,
    numeroBanistas: null,
    horasFiltracion: null,
    presionTrabajo: null,
    volumenRecirculado: null,
    nivelAguaProfundidad: null,
    volumenAguaSuministrada: null,
    velocidadFlujo: null,
    periodoRecirculacion: null,
  };
}

export function defaultCalidadFisica(): CalidadFisica {
  return {
    color: null,
    materiaFlotante: null,
    olor: null,
    transparencia: null,
  };
}

export function defaultCalidadQuimica(): CalidadQuimica {
  return {
    potencialOxidacion: valoresPorMomento(),
    turbidez: null,
    ph: valoresPorMomento(),
    temperatura: null,
    conductividad: null,
    cloroLibre: valoresPorMomento(),
    cloroCombinado: valoresPorMomento(),
    cloruros: null,
    acidoCianurico: null,
    alcalinidadTotal: null,
    durezaCalcica: null,
    aluminio: null,
    bromoLibre: null,
    bromoTotal: null,
    amonioIon: null,
    cobre: null,
    hierro: null,
    plata: null,
  };
}

export function defaultCalidadMicrobiologica(): CalidadMicrobiologica {
  return {
    heterotrofos: null,
    coliformesTermotolerantes: null,
    escherichiaColi: null,
    pseudomonaAeruginosa: null,
    cryptosporidium: null,
    giardia: null,
  };
}

export function defaultIndices(): IndicesAgua {
  return { indiceLangelier: null, indiceRiesgo: null };
}

export function defaultAjustes(): AjustesAgua {
  return {
    huboDosificacion: false,
    cloroResidualDosificado: null,
    cloroResidualUnidad: "L",
    phAlto: null,
    phAltoUnidad: "L",
    phBajo: null,
    phBajoUnidad: "L",
    cloraminasDosificado: null,
    cloraminasUnidad: "L",
    acidoCianuricoReposicion: null,
    durezaReposicion: null,
    turbidezCoagulante: null,
    conductividadReposicion: null,
    accidenteContaminacion: false,
    colorDosificado: null,
    colorUnidad: "L",
    tiempoContactoMinimo: null,
    tiempoRestablecimientoMin: null,
    aptitudPostAccidente: null,
  };
}

export function createRegistroDiario(fecha: string, instalacionId: string): RegistroDiario {
  const hora = horaActual();
  return {
    id: crypto.randomUUID(),
    instalacionId,
    fecha,
    estadoDia: "en_progreso",
    progreso: defaultProgreso(),
    horasFase: { ...defaultHorasFase(), apertura: hora },
    operadorId: "",
    salvavidasId: "",
    condiciones: { ...defaultCondiciones(false), horaInicio: hora },
    calidadFisica: defaultCalidadFisica(),
    calidadQuimica: defaultCalidadQuimica(),
    calidadMicrobiologica: defaultCalidadMicrobiologica(),
    indices: defaultIndices(),
    ajustes: defaultAjustes(),
    dispositivosSeguridad: dispositivosVacios(),
    evaluacionEstanque: null,
    labores: checkboxesFromFields(LABORES_OPERACION),
    mantenimiento: checkboxesFromFields(MANTENIMIENTO_REPARACIONES),
    incidencias: "",
    observaciones: "",
    firmaOperador: null,
    firmaFecha: null,
    bloqueado: false,
    correcciones: [],
    actualizadoEn: new Date().toISOString(),
  };
}

export function mergeRegistro(
  partial: Partial<RegistroDiario> & { fecha: string },
  instalacionIdFallback: string,
): RegistroDiario {
  const instalacionId = partial.instalacionId || instalacionIdFallback;
  const base = createRegistroDiario(partial.fecha, instalacionId);
  const cerrado =
    partial.estadoDia === "cerrado" ||
    partial.bloqueado === true ||
    Boolean(partial.firmaOperador);
  return {
    ...base,
    ...partial,
    instalacionId,
    estadoDia: cerrado ? "cerrado" : (partial.estadoDia ?? "en_progreso"),
    progreso: { ...base.progreso, ...partial.progreso },
    horasFase: { ...base.horasFase, ...partial.horasFase },
    condiciones: { ...base.condiciones, ...partial.condiciones },
    calidadFisica: { ...base.calidadFisica, ...partial.calidadFisica },
    calidadQuimica: {
      ...base.calidadQuimica,
      ...partial.calidadQuimica,
      potencialOxidacion: {
        ...base.calidadQuimica.potencialOxidacion,
        ...partial.calidadQuimica?.potencialOxidacion,
      },
      ph: { ...base.calidadQuimica.ph, ...partial.calidadQuimica?.ph },
      cloroLibre: { ...base.calidadQuimica.cloroLibre, ...partial.calidadQuimica?.cloroLibre },
      cloroCombinado: {
        ...base.calidadQuimica.cloroCombinado,
        ...partial.calidadQuimica?.cloroCombinado,
      },
    },
    calidadMicrobiologica: {
      ...base.calidadMicrobiologica,
      ...partial.calidadMicrobiologica,
    },
    indices: { ...base.indices, ...partial.indices },
    ajustes: { ...base.ajustes, ...partial.ajustes },
    dispositivosSeguridad: {
      ...base.dispositivosSeguridad,
      ...partial.dispositivosSeguridad,
    },
    labores: { ...base.labores, ...partial.labores },
    mantenimiento: { ...base.mantenimiento, ...partial.mantenimiento },
    correcciones: partial.correcciones ?? [],
    bloqueado: cerrado,
  };
}

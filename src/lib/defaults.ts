import type {
  AjustesAgua,
  CalidadFisica,
  CalidadMicrobiologica,
  CalidadQuimica,
  CondicionesOperacion,
  ConfiguracionInstalacion,
  IndicesAgua,
  RegistroDiario,
  ValoresPorMomento,
} from "./types";
import { LABORES_OPERACION, MANTENIMIENTO_REPARACIONES } from "./fields";

function valoresPorMomento(): ValoresPorMomento {
  return { manana: null, mediodia: null, tarde: null };
}

function checkboxesFromFields(fields: { id: string }[]): Record<string, boolean> {
  return Object.fromEntries(fields.map((f) => [f.id, false]));
}

export function defaultConfiguracion(): ConfiguracionInstalacion {
  return {
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
    nombreEstanque: "",
    usoColectiva: false,
    usoPublico: false,
    usoParticular: false,
    presentacionDescubierta: true,
    presentacionCubierta: false,
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

export function defaultCondiciones(): CondicionesOperacion {
  return {
    horaInicio: "",
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
  };
}

export function createRegistroDiario(fecha: string): RegistroDiario {
  return {
    id: crypto.randomUUID(),
    fecha,
    operadorId: "",
    salvavidasId: "",
    condiciones: defaultCondiciones(),
    calidadFisica: defaultCalidadFisica(),
    calidadQuimica: defaultCalidadQuimica(),
    calidadMicrobiologica: defaultCalidadMicrobiologica(),
    indices: defaultIndices(),
    ajustes: defaultAjustes(),
    labores: checkboxesFromFields(LABORES_OPERACION),
    mantenimiento: checkboxesFromFields(MANTENIMIENTO_REPARACIONES),
    incidencias: "",
    observaciones: "",
    firmaOperador: null,
    firmaFecha: null,
    actualizadoEn: new Date().toISOString(),
  };
}

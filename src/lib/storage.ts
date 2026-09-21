"use client";

import type {
  AppData,
  ConfiguracionInstalacion,
  CorreccionRegistro,
  RegistroDiario,
  VisitaInspeccion,
} from "./types";
import { createRegistroDiario, mergeRegistro } from "./defaults";
import { getSampleAppData } from "./sample-data";
import {
  aplicarConfigPlana,
  crearEstructuraBaseDesdeConfig,
  getInstalacionActiva,
  refreshConfiguracion,
} from "./instalaciones";
import { catalogoVacioProduccion } from "./rangos/motor";
import type { CatalogoRangos } from "./rangos/types";

export const STORAGE_KEY = "control-sanitario-piscinas-v1";
export const APP_DATA_EVENT = "csp-app-data-changed";

function defaultAppData(): AppData {
  const { establecimiento, zona, instalacion } = crearEstructuraBaseDesdeConfig();
  const data: AppData = {
    instalacionId: instalacion.id,
    instalacionActivaId: instalacion.id,
    establecimiento,
    zonasHumedas: [zona],
    instalaciones: [instalacion],
    conteosBanistas: [],
    configuracion: refreshConfiguracion({
      instalacionId: instalacion.id,
      instalacionActivaId: instalacion.id,
      establecimiento,
      zonasHumedas: [zona],
      instalaciones: [instalacion],
      conteosBanistas: [],
      configuracion: {} as ConfiguracionInstalacion,
      rangosCatalogo: catalogoVacioProduccion(),
      ultimaSincronizacion: null,
      registros: [],
      visitas: [],
    }),
    rangosCatalogo: catalogoVacioProduccion(),
    ultimaSincronizacion: null,
    registros: [],
    visitas: [],
  };
  data.configuracion = refreshConfiguracion(data);
  return data;
}

function migrate(raw: Partial<AppData> & { configuracion?: ConfiguracionInstalacion }): AppData {
  const base = defaultAppData();
  const legacyId = raw.instalacionId || raw.instalacionActivaId || base.instalacionId;

  let establecimiento = raw.establecimiento;
  let zonasHumedas = raw.zonasHumedas;
  let instalaciones = raw.instalaciones;

  if (!establecimiento || !zonasHumedas?.length || !instalaciones?.length) {
    const built = crearEstructuraBaseDesdeConfig(raw.configuracion, legacyId);
    establecimiento = built.establecimiento;
    zonasHumedas = [built.zona];
    instalaciones = [built.instalacion];
  }

  const instalacionActivaId =
    raw.instalacionActivaId && instalaciones.some((i) => i.id === raw.instalacionActivaId)
      ? raw.instalacionActivaId
      : instalaciones[0].id;

  const data: AppData = {
    instalacionId: instalacionActivaId,
    instalacionActivaId,
    establecimiento,
    zonasHumedas,
    instalaciones,
    conteosBanistas: raw.conteosBanistas ?? [],
    configuracion: raw.configuracion ?? base.configuracion,
    rangosCatalogo: (raw.rangosCatalogo as CatalogoRangos | undefined) ?? catalogoVacioProduccion(),
    ultimaSincronizacion: raw.ultimaSincronizacion ?? null,
    registros: (raw.registros ?? []).map((r) =>
      mergeRegistro(r, r.instalacionId || instalacionActivaId),
    ),
    visitas: raw.visitas ?? [],
  };
  data.configuracion = refreshConfiguracion(data);
  return data;
}

function notifyAppDataChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(APP_DATA_EVENT));
}

function readData(): AppData {
  if (typeof window === "undefined") return defaultAppData();
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return defaultAppData();
  try {
    return migrate(JSON.parse(raw) as Partial<AppData>);
  } catch {
    return defaultAppData();
  }
}

function writeData(data: AppData): void {
  data.instalacionId = data.instalacionActivaId;
  data.configuracion = refreshConfiguracion(data);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  notifyAppDataChanged();
}

export function getAppData(): AppData {
  return readData();
}

export function setAppData(data: AppData): void {
  writeData(data);
}

export function loadSampleData(): AppData {
  const sample = getSampleAppData();
  writeData(sample);
  return sample;
}

export function saveConfiguracion(configuracion: ConfiguracionInstalacion): void {
  const data = aplicarConfigPlana(readData(), configuracion);
  writeData(data);
}

export function setInstalacionActiva(instalacionId: string): void {
  const data = readData();
  if (!data.instalaciones.some((i) => i.id === instalacionId)) return;
  data.instalacionActivaId = instalacionId;
  data.instalacionId = instalacionId;
  writeData(data);
}

export function getRegistroPorFecha(
  fecha: string,
  instalacionId?: string,
): RegistroDiario | null {
  const data = readData();
  const id = instalacionId ?? data.instalacionActivaId;
  return data.registros.find((r) => r.fecha === fecha && r.instalacionId === id) ?? null;
}

export function saveRegistro(registro: RegistroDiario): void {
  const data = readData();
  const index = data.registros.findIndex(
    (r) => r.fecha === registro.fecha && r.instalacionId === registro.instalacionId,
  );
  const actualizado = { ...registro, actualizadoEn: new Date().toISOString() };
  if (index >= 0) data.registros[index] = actualizado;
  else data.registros.push(actualizado);
  data.registros.sort((a, b) => b.fecha.localeCompare(a.fecha));
  writeData(data);
}

export function getOrCreateRegistro(fecha: string, instalacionId?: string): RegistroDiario {
  const data = readData();
  const id = instalacionId ?? data.instalacionActivaId;
  return getRegistroPorFecha(fecha, id) ?? createRegistroDiario(fecha, id);
}

export function listRegistros(instalacionId?: string): RegistroDiario[] {
  const data = readData();
  const id = instalacionId ?? data.instalacionActivaId;
  return data.registros.filter((r) => r.instalacionId === id);
}

/** Conteo compartido por zona humeda: se copia a todos los libros de la zona. */
export function setBanistasZona(zonaHumedaId: string, fecha: string, numeroBanistas: number): void {
  const data = readData();
  const idx = data.conteosBanistas.findIndex(
    (c) => c.zonaHumedaId === zonaHumedaId && c.fecha === fecha,
  );
  const row = { zonaHumedaId, fecha, numeroBanistas };
  if (idx >= 0) data.conteosBanistas[idx] = row;
  else data.conteosBanistas.push(row);

  const ids = data.instalaciones.filter((i) => i.zonaHumedaId === zonaHumedaId).map((i) => i.id);
  for (const instalacionId of ids) {
    const rIdx = data.registros.findIndex(
      (r) => r.fecha === fecha && r.instalacionId === instalacionId,
    );
    if (rIdx >= 0) {
      data.registros[rIdx] = {
        ...data.registros[rIdx],
        condiciones: {
          ...data.registros[rIdx].condiciones,
          numeroBanistas,
        },
        actualizadoEn: new Date().toISOString(),
      };
    }
  }
  writeData(data);
}

export function getBanistasZona(zonaHumedaId: string, fecha: string): number | null {
  const row = readData().conteosBanistas.find(
    (c) => c.zonaHumedaId === zonaHumedaId && c.fecha === fecha,
  );
  return row?.numeroBanistas ?? null;
}

/**
 * Tras firmar, no se edita en silencio: se guarda la instantanea firmada
 * y se reabre el dia para correccion (exige nueva firma al cierre).
 */
export function abrirCorreccion(registro: RegistroDiario, motivo: string): RegistroDiario {
  if (!registro.firmaOperador || registro.estadoDia !== "cerrado") {
    throw new Error("Solo se puede corregir un registro firmado/cerrado.");
  }
  const snapshotFirmado: RegistroDiario = structuredClone(registro);
  const entrada: CorreccionRegistro = {
    id: crypto.randomUUID(),
    creadoEn: new Date().toISOString(),
    motivo: motivo.trim() || "Correccion de registro",
    snapshotFirmado: {
      ...snapshotFirmado,
      correcciones: [],
    },
  };
  const next: RegistroDiario = {
    ...registro,
    correcciones: [...registro.correcciones, entrada],
    firmaOperador: null,
    firmaFecha: null,
    bloqueado: false,
    estadoDia: "en_progreso",
    progreso: { ...registro.progreso, cierre: false },
    actualizadoEn: new Date().toISOString(),
  };
  saveRegistro(next);
  return next;
}

export function saveVisita(visita: VisitaInspeccion): void {
  const data = readData();
  const index = data.visitas.findIndex((v) => v.id === visita.id);
  if (index >= 0) data.visitas[index] = visita;
  else data.visitas.push(visita);
  data.visitas.sort((a, b) => b.fecha.localeCompare(a.fecha));
  writeData(data);
}

export function listVisitas(): VisitaInspeccion[] {
  return readData().visitas;
}

export function deleteVisita(id: string): void {
  const data = readData();
  data.visitas = data.visitas.filter((v) => v.id !== id);
  writeData(data);
}

export function formatFechaHoy(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}

export function formatFechaLegible(fecha: string): string {
  const [y, m, d] = fecha.split("-");
  return `${d}/${m}/${y}`;
}

export function saveRangosCatalogo(catalogo: CatalogoRangos): void {
  const data = readData();
  data.rangosCatalogo = {
    ...catalogo,
    actualizadoEn: new Date().toISOString(),
  };
  writeData(data);
}

export function getRangosCatalogo(): CatalogoRangos {
  return readData().rangosCatalogo;
}

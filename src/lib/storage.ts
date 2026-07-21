"use client";

import type { AppData, ConfiguracionInstalacion, RegistroDiario, VisitaInspeccion } from "./types";
import { createRegistroDiario, defaultConfiguracion } from "./defaults";
import { getSampleAppData } from "./sample-data";

export const STORAGE_KEY = "control-sanitario-piscinas-v1";
export const APP_DATA_EVENT = "csp-app-data-changed";

function defaultAppData(): AppData {
  return {
    instalacionId: crypto.randomUUID(),
    ultimaSincronizacion: null,
    configuracion: defaultConfiguracion(),
    registros: [],
    visitas: [],
  };
}

function migrate(data: Partial<AppData>): AppData {
  const base = defaultAppData();
  return {
    instalacionId: data.instalacionId ?? base.instalacionId,
    ultimaSincronizacion: data.ultimaSincronizacion ?? null,
    configuracion: data.configuracion ?? base.configuracion,
    registros: (data.registros ?? []).map((r) => ({
      ...createRegistroDiario(r.fecha),
      ...r,
      firmaOperador: r.firmaOperador ?? null,
      firmaFecha: r.firmaFecha ?? null,
    })),
    visitas: data.visitas ?? [],
  };
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
  const data = readData();
  data.configuracion = configuracion;
  writeData(data);
}

export function getRegistroPorFecha(fecha: string): RegistroDiario | null {
  return readData().registros.find((r) => r.fecha === fecha) ?? null;
}

export function saveRegistro(registro: RegistroDiario): void {
  const data = readData();
  const index = data.registros.findIndex((r) => r.fecha === registro.fecha);
  const actualizado = { ...registro, actualizadoEn: new Date().toISOString() };
  if (index >= 0) data.registros[index] = actualizado;
  else data.registros.push(actualizado);
  data.registros.sort((a, b) => b.fecha.localeCompare(a.fecha));
  writeData(data);
}

export function getOrCreateRegistro(fecha: string): RegistroDiario {
  return getRegistroPorFecha(fecha) ?? createRegistroDiario(fecha);
}

export function listRegistros(): RegistroDiario[] {
  return readData().registros;
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

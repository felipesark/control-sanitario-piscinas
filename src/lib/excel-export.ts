"use client";

import * as XLSX from "xlsx";
import type { AppData, RegistroDiario } from "./types";
import { LABORES_OPERACION, MANTENIMIENTO_REPARACIONES } from "./fields";
import { formatFechaLegible } from "./storage";
import { evaluarRegistro } from "./rangos-legales";
import { filtrarRegistrosPorRango } from "./export-range";

function val(v: unknown): string | number {
  if (v === null || v === undefined || v === "") return "";
  if (typeof v === "boolean") return v ? "Si" : "No";
  return v as string | number;
}

function buildResumenRows(data: AppData, registros: RegistroDiario[]) {
  return registros.map((r) => {
    const op = data.configuracion.operadores.find((o) => o.id === r.operadorId);
    const sv = data.configuracion.salvavidas.find((s) => s.id === r.salvavidasId);
    const alertas = evaluarRegistro(r);
    const labores = Object.values(r.labores).filter(Boolean).length;

    return {
      Fecha: formatFechaLegible(r.fecha),
      "Fecha ISO": r.fecha,
      Operador: op?.nombre ?? "",
      Salvavidas: sv?.nombre ?? "",
      "Hora inicio": r.condiciones.horaInicio,
      "Hora final": r.condiciones.horaFinal,
      "Temp. aire (°C)": val(r.condiciones.temperaturaAire),
      Banistas: val(r.condiciones.numeroBanistas),
      "Horas filtracion": val(r.condiciones.horasFiltracion),
      Color: val(r.calidadFisica.color),
      "Materia flotante": val(r.calidadFisica.materiaFlotante),
      Olor: val(r.calidadFisica.olor),
      Transparencia: val(r.calidadFisica.transparencia),
      "pH manana": val(r.calidadQuimica.ph.manana),
      "pH mediodia": val(r.calidadQuimica.ph.mediodia),
      "pH tarde": val(r.calidadQuimica.ph.tarde),
      "Cloro libre manana": val(r.calidadQuimica.cloroLibre.manana),
      "Cloro libre mediodia": val(r.calidadQuimica.cloroLibre.mediodia),
      "Cloro libre tarde": val(r.calidadQuimica.cloroLibre.tarde),
      "Cloro combinado manana": val(r.calidadQuimica.cloroCombinado.manana),
      "Cloro combinado mediodia": val(r.calidadQuimica.cloroCombinado.mediodia),
      "Cloro combinado tarde": val(r.calidadQuimica.cloroCombinado.tarde),
      "Turbidez (UNT)": val(r.calidadQuimica.turbidez),
      "Temp. agua (°C)": val(r.calidadQuimica.temperatura),
      "Indice Langelier": val(r.indices.indiceLangelier),
      "Indice riesgo": val(r.indices.indiceRiesgo),
      Labores: labores,
      Alertas: alertas.length,
      "Detalle alertas": alertas.map((a) => `${a.campo}: ${a.mensaje}`).join(" | "),
      Firmado: r.firmaOperador ? "Si" : "No",
      Incidencias: r.incidencias,
      Observaciones: r.observaciones,
    };
  });
}

function buildLaboresRows(registros: RegistroDiario[]) {
  return registros.map((r) => {
    const row: Record<string, string | number> = {
      Fecha: formatFechaLegible(r.fecha),
      "Fecha ISO": r.fecha,
    };
    for (const labor of LABORES_OPERACION) {
      row[labor.label] = r.labores[labor.id] ? "X" : "";
    }
    return row;
  });
}

function buildMantenimientoRows(registros: RegistroDiario[]) {
  return registros.map((r) => {
    const row: Record<string, string | number> = {
      Fecha: formatFechaLegible(r.fecha),
      "Fecha ISO": r.fecha,
    };
    for (const item of MANTENIMIENTO_REPARACIONES) {
      row[item.label] = r.mantenimiento[item.id] ? "X" : "";
    }
    return row;
  });
}

export function exportarLibroRangoExcel(
  data: AppData,
  desde: string,
  hasta: string,
): boolean {
  const registros = filtrarRegistrosPorRango(data.registros, desde, hasta);
  if (registros.length === 0) return false;

  const cfg = data.configuracion;
  const wb = XLSX.utils.book_new();

  const info = [
    ["Libro de Control Sanitario de Piscinas"],
    ["Razon social", cfg.razonSocial],
    ["NIT", cfg.nit],
    ["Estanque", cfg.nombreEstanque],
    ["Municipio", cfg.municipio],
    ["Rango desde", desde],
    ["Rango hasta", hasta],
    ["Registros exportados", registros.length],
    ["Generado", new Date().toLocaleString("es-CO")],
  ];
  const wsInfo = XLSX.utils.aoa_to_sheet(info);
  wsInfo["!cols"] = [{ wch: 24 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, wsInfo, "Informacion");

  const resumen = buildResumenRows(data, registros);
  const wsResumen = XLSX.utils.json_to_sheet(resumen);
  wsResumen["!cols"] = Object.keys(resumen[0] ?? {}).map((key) => ({
    wch: Math.min(28, Math.max(12, key.length + 2)),
  }));
  XLSX.utils.book_append_sheet(wb, wsResumen, "Registros");

  const labores = buildLaboresRows(registros);
  const wsLabores = XLSX.utils.json_to_sheet(labores);
  XLSX.utils.book_append_sheet(wb, wsLabores, "Labores");

  const mantenimiento = buildMantenimientoRows(registros);
  const wsMant = XLSX.utils.json_to_sheet(mantenimiento);
  XLSX.utils.book_append_sheet(wb, wsMant, "Mantenimiento");

  XLSX.writeFile(wb, `control-sanitario-${desde}_${hasta}.xlsx`);
  return true;
}

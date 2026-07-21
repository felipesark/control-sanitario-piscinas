"use client";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { AppData, RegistroDiario } from "./types";
import { LABORES_OPERACION, MANTENIMIENTO_REPARACIONES } from "./fields";
import { formatFechaLegible } from "./storage";
import { evaluarRegistro } from "./rangos-legales";
import { filtrarRegistrosPorRango } from "./export-range";

function val(v: unknown): string {
  if (v === null || v === undefined || v === "") return "-";
  if (typeof v === "boolean") return v ? "Si" : "No";
  return String(v);
}

function momento(v: { manana: number | null; mediodia: number | null; tarde: number | null }): string {
  return `M:${val(v.manana)} / MD:${val(v.mediodia)} / T:${val(v.tarde)}`;
}

export function exportarRegistroPDF(data: AppData, registro: RegistroDiario): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const cfg = data.configuracion;
  const op = cfg.operadores.find((o) => o.id === registro.operadorId);
  const sv = cfg.salvavidas.find((s) => s.id === registro.salvavidasId);
  let y = 15;

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("LIBRO ESTANDAR DE REGISTRO DE CONTROL SANITARIO", 105, y, { align: "center" });
  y += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Estanques de Piscinas y Estructuras Similares - Antioquia, Colombia", 105, y, { align: "center" });
  y += 8;

  doc.setFontSize(9);
  const header = [
    [`Razon Social: ${cfg.razonSocial}`, `NIT: ${cfg.nit}`],
    [`Estanque: ${cfg.nombreEstanque}`, `Municipio: ${cfg.municipio}`],
    [`Operador: ${op?.nombre ?? "-"}`, `Salvavidas: ${sv?.nombre ?? "-"}`],
    [`Fecha registro: ${formatFechaLegible(registro.fecha)}`, `Actualizado: ${new Date(registro.actualizadoEn).toLocaleString("es-CO")}`],
  ];
  header.forEach((row) => { doc.text(row[0], 14, y); doc.text(row[1], 110, y); y += 5; });
  y += 3;

  autoTable(doc, {
    startY: y,
    head: [["CONDICIONES DE OPERACION", "Valor"]],
    body: [
      ["Hora inicio / final", `${registro.condiciones.horaInicio} - ${registro.condiciones.horaFinal}`],
      ["Temperatura aire (C)", val(registro.condiciones.temperaturaAire)],
      ["Humedad relativa (%)", val(registro.condiciones.humedadRelativa)],
      ["Numero banistas", val(registro.condiciones.numeroBanistas)],
      ["Horas filtracion", val(registro.condiciones.horasFiltracion)],
      ["Presion trabajo (psi)", val(registro.condiciones.presionTrabajo)],
      ["Volumen recirculado (m3)", val(registro.condiciones.volumenRecirculado)],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [11, 61, 92] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  autoTable(doc, {
    startY: y,
    head: [["CALIDAD DEL AGUA", "Valor"]],
    body: [
      ["Color", val(registro.calidadFisica.color)],
      ["Materia flotante", val(registro.calidadFisica.materiaFlotante)],
      ["Olor", val(registro.calidadFisica.olor)],
      ["Transparencia", val(registro.calidadFisica.transparencia)],
      ["pH (M/MD/T)", momento(registro.calidadQuimica.ph)],
      ["Cloro libre mg/L (M/MD/T)", momento(registro.calidadQuimica.cloroLibre)],
      ["Cloro combinado mg/L (M/MD/T)", momento(registro.calidadQuimica.cloroCombinado)],
      ["Turbidez (UNT)", val(registro.calidadQuimica.turbidez)],
      ["Temperatura agua (C)", val(registro.calidadQuimica.temperatura)],
      ["Indice Langelier (ISL)", val(registro.indices.indiceLangelier)],
      ["Indice riesgo (IRAPI)", val(registro.indices.indiceRiesgo)],
    ],
    styles: { fontSize: 8 },
    headStyles: { fillColor: [26, 143, 143] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  const laboresHechas = LABORES_OPERACION.filter((l) => registro.labores[l.id]).map((l) => l.label);
  const mantHecho = MANTENIMIENTO_REPARACIONES.filter((m) => registro.mantenimiento[m.id]).map((m) => m.label);

  autoTable(doc, {
    startY: y,
    head: [["LABORES REALIZADAS", ""]],
    body: laboresHechas.length ? laboresHechas.map((l) => [l, "X"]) : [["Ninguna registrada", ""]],
    styles: { fontSize: 7 },
    headStyles: { fillColor: [11, 61, 92] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  if (y > 220) { doc.addPage(); y = 15; }

  autoTable(doc, {
    startY: y,
    head: [["MANTENIMIENTO", ""]],
    body: mantHecho.length ? mantHecho.map((m) => [m, "X"]) : [["Ninguno registrado", ""]],
    styles: { fontSize: 7 },
    headStyles: { fillColor: [11, 61, 92] },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;

  const alertas = evaluarRegistro(registro);
  if (alertas.length > 0) {
    autoTable(doc, {
      startY: y,
      head: [["ALERTAS SANITARIAS", "Nivel", "Detalle"]],
      body: alertas.map((a) => [a.campo, a.nivel, a.mensaje]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [217, 95, 74] },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 5;
  }

  if (registro.incidencias || registro.observaciones) {
    if (y > 240) { doc.addPage(); y = 15; }
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Incidencias:", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    const inc = doc.splitTextToSize(registro.incidencias || "Ninguna", 180);
    doc.text(inc, 14, y); y += inc.length * 4 + 3;
    doc.setFont("helvetica", "bold");
    doc.text("Observaciones:", 14, y); y += 5;
    doc.setFont("helvetica", "normal");
    const obs = doc.splitTextToSize(registro.observaciones || "Ninguna", 180);
    doc.text(obs, 14, y); y += obs.length * 4 + 5;
  }

  if (registro.firmaOperador) {
    if (y > 220) { doc.addPage(); y = 15; }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Firma del operador responsable:", 14, y);
    y += 3;
    doc.addImage(registro.firmaOperador, "PNG", 14, y, 60, 25);
    y += 28;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(`Firmado: ${registro.firmaFecha ? new Date(registro.firmaFecha).toLocaleString("es-CO") : "-"}`, 14, y);
    doc.text(`Operador: ${op?.nombre ?? "-"}`, 14, y + 4);
  }

  doc.setFontSize(7);
  doc.text("Documento generado digitalmente - Control Sanitario Piscinas App", 105, 270, { align: "center" });

  doc.save(`registro-sanitario-${registro.fecha}.pdf`);
}

export function exportarLibroRangoPDF(
  data: AppData,
  desde: string,
  hasta: string,
): boolean {
  const registros = filtrarRegistrosPorRango(data.registros, desde, hasta);
  if (registros.length === 0) return false;

  const tituloRango =
    desde === hasta
      ? formatFechaLegible(desde)
      : `${formatFechaLegible(desde)} - ${formatFechaLegible(hasta)}`;

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(`Libro de Control Sanitario - ${tituloRango}`, 148, 12, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`${data.configuracion.razonSocial} - ${data.configuracion.nombreEstanque}`, 148, 18, { align: "center" });
  doc.setFontSize(8);
  doc.text(`${registros.length} registro(s)`, 148, 23, { align: "center" });

  autoTable(doc, {
    startY: 28,
    head: [["Fecha", "Operador", "pH (M)", "Cloro (M)", "Turbidez", "Banistas", "Labores", "Alertas"]],
    body: registros.map((r) => {
      const op = data.configuracion.operadores.find((o) => o.id === r.operadorId);
      const alertas = evaluarRegistro(r).length;
      const labores = Object.values(r.labores).filter(Boolean).length;
      return [
        formatFechaLegible(r.fecha),
        op?.nombre ?? "-",
        val(r.calidadQuimica.ph.manana),
        val(r.calidadQuimica.cloroLibre.manana),
        val(r.calidadQuimica.turbidez),
        val(r.condiciones.numeroBanistas),
        String(labores),
        alertas > 0 ? `${alertas} alerta(s)` : "OK",
      ];
    }),
    styles: { fontSize: 7 },
    headStyles: { fillColor: [11, 61, 92] },
  });

  doc.save(`libro-control-${desde}_${hasta}.pdf`);
  return true;
}

/** @deprecated Prefer exportarLibroRangoPDF con rango de fechas */
export function exportarLibroMensualPDF(data: AppData, mes: string): void {
  const registros = data.registros.filter((r) => r.fecha.startsWith(mes));
  if (registros.length === 0) return;
  const fechas = registros.map((r) => r.fecha).sort();
  exportarLibroRangoPDF(data, fechas[0], fechas[fechas.length - 1]);
}
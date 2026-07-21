import type { RegistroDiario } from "./types";

export function filtrarRegistrosPorRango(
  registros: RegistroDiario[],
  desde: string,
  hasta: string,
): RegistroDiario[] {
  if (!desde || !hasta) return [];
  const inicio = desde <= hasta ? desde : hasta;
  const fin = desde <= hasta ? hasta : desde;

  return registros
    .filter((r) => r.fecha >= inicio && r.fecha <= fin)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

"use client";

import type { AppData } from "./types";
import { getAppData, setAppData } from "./storage";
import { getSupabase, isSupabaseConfigured } from "./supabase";

export interface SyncResult {
  ok: boolean;
  message: string;
  timestamp?: string;
}

export function getSyncStatus(): { configured: boolean; lastSync: string | null } {
  const data = getAppData();
  return {
    configured: isSupabaseConfigured(),
    lastSync: data.ultimaSincronizacion,
  };
}

export async function sincronizarConNube(): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      ok: false,
      message: "Supabase no configurado. Agregue las variables en .env.local",
    };
  }

  const data = getAppData();
  const instalacionId = data.instalacionId;

  try {
    const { error: errConfig } = await supabase.from("instalaciones").upsert({
      id: instalacionId,
      configuracion: data.configuracion,
      updated_at: new Date().toISOString(),
    });
    if (errConfig) throw errConfig;

    if (data.registros.length > 0) {
      const rows = data.registros.map((r) => ({
        id: r.id,
        instalacion_id: instalacionId,
        fecha: r.fecha,
        data: r,
        updated_at: r.actualizadoEn,
      }));
      const { error: errReg } = await supabase.from("registros").upsert(rows);
      if (errReg) throw errReg;
    }

    if (data.visitas.length > 0) {
      const rows = data.visitas.map((v) => ({
        id: v.id,
        instalacion_id: instalacionId,
        data: v,
        updated_at: new Date().toISOString(),
      }));
      const { error: errVis } = await supabase.from("visitas").upsert(rows);
      if (errVis) throw errVis;
    }

    const { data: remota, error: errPull } = await supabase
      .from("instalaciones")
      .select("configuracion, updated_at")
      .eq("id", instalacionId)
      .single();

    if (!errPull && remota) {
      const local = getAppData();
      local.configuracion = remota.configuracion;
      local.ultimaSincronizacion = new Date().toISOString();
      setAppData(local);
    } else {
      const local = getAppData();
      local.ultimaSincronizacion = new Date().toISOString();
      setAppData(local);
    }

    return {
      ok: true,
      message: "Datos sincronizados correctamente",
      timestamp: new Date().toISOString(),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, message: `Error de sincronizacion: ${msg}` };
  }
}

export async function descargarDesdeNube(instalacionId: string): Promise<SyncResult> {
  const supabase = getSupabase();
  if (!supabase) {
    return { ok: false, message: "Supabase no configurado" };
  }

  try {
    const { data: inst, error: e1 } = await supabase
      .from("instalaciones")
      .select("configuracion")
      .eq("id", instalacionId)
      .single();
    if (e1) throw e1;

    const { data: registros, error: e2 } = await supabase
      .from("registros")
      .select("data")
      .eq("instalacion_id", instalacionId);
    if (e2) throw e2;

    const { data: visitas, error: e3 } = await supabase
      .from("visitas")
      .select("data")
      .eq("instalacion_id", instalacionId);
    if (e3) throw e3;

    const local = getAppData();
    local.instalacionId = instalacionId;
    local.configuracion = inst.configuracion;
    local.registros = (registros ?? []).map((r) => r.data);
    local.visitas = (visitas ?? []).map((v) => v.data);
    local.ultimaSincronizacion = new Date().toISOString();
    setAppData(local);

    return { ok: true, message: "Datos descargados desde la nube" };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, message: msg };
  }
}
import type {
  AppData,
  ConfiguracionInstalacion,
  Establecimiento,
  Instalacion,
  ZonaHumeda,
} from "./types";
import {
  buildConfiguracion,
  defaultEstablecimiento,
  defaultInstalacion,
  defaultZonaHumeda,
} from "./defaults";

export function getInstalacionActiva(data: AppData): Instalacion {
  return (
    data.instalaciones.find((i) => i.id === data.instalacionActivaId) ??
    data.instalaciones[0]
  );
}

export function getZonaDeInstalacion(data: AppData, instalacion: Instalacion): ZonaHumeda {
  return (
    data.zonasHumedas.find((z) => z.id === instalacion.zonaHumedaId) ?? data.zonasHumedas[0]
  );
}

export function refreshConfiguracion(data: AppData): ConfiguracionInstalacion {
  const inst = getInstalacionActiva(data);
  const zona = getZonaDeInstalacion(data, inst);
  return buildConfiguracion(data.establecimiento, inst, zona);
}

export function aplicarConfigPlana(
  data: AppData,
  config: ConfiguracionInstalacion,
): AppData {
  const inst = getInstalacionActiva(data);
  const zonaId = config.zonaHumedaId || inst.zonaHumedaId;
  const establecimiento: Establecimiento = {
    ...data.establecimiento,
    razonSocial: config.razonSocial,
    representanteLegal: config.representanteLegal,
    administrador: config.administrador,
    operadores: config.operadores,
    direccion: config.direccion,
    municipio: config.municipio,
    localidad: config.localidad,
    telefonoFijo: config.telefonoFijo,
    telefonoMovil: config.telefonoMovil,
    nit: config.nit,
    email: config.email,
    salvavidas: config.salvavidas,
  };

  const instalaciones = data.instalaciones.map((i) =>
    i.id === inst.id
      ? {
          ...i,
          zonaHumedaId: zonaId,
          nombre: config.nombreEstanque,
          tipoEstructura: config.tipoEstructura ?? i.tipoEstructura,
          categoria: config.categoria ?? i.categoria,
          presentacion: config.presentacionCubierta ? ("cubierta" as const) : ("descubierta" as const),
          usoColectiva: config.usoColectiva,
          usoPublico: config.usoPublico,
          usoParticular: config.usoParticular,
          largo: config.largo,
          ancho: config.ancho,
          diametro: config.diametro,
          profundidad: config.profundidad,
          volumen: config.volumen,
          areaSuperficial: config.areaSuperficial,
          maximoBanistas: config.maximoBanistas,
          fuenteAguaPotable: config.fuenteAguaPotable,
          fuenteAguaNatural: config.fuenteAguaNatural,
          sistemaRecirculacion: config.sistemaRecirculacion,
          sistemaRenovacionContinua: config.sistemaRenovacionContinua,
          sistemaDesalojo: config.sistemaDesalojo,
          sistemaRestringido: config.sistemaRestringido,
          sistemaEspecial: config.sistemaEspecial,
        }
      : i,
  );

  const zonasHumedas = data.zonasHumedas.map((z) =>
    z.id === zonaId
      ? { ...z, nombre: config.zonaHumedaNombre || z.nombre }
      : z,
  );

  const next: AppData = {
    ...data,
    establecimiento,
    instalaciones,
    zonasHumedas,
    configuracion: config,
  };
  next.configuracion = refreshConfiguracion(next);
  return next;
}

export function crearEstructuraBaseDesdeConfig(
  config?: Partial<ConfiguracionInstalacion>,
  instalacionId = crypto.randomUUID(),
) {
  const establecimiento = defaultEstablecimiento();
  if (config) {
    Object.assign(establecimiento, {
      razonSocial: config.razonSocial ?? "",
      representanteLegal: config.representanteLegal ?? "",
      administrador: config.administrador ?? "",
      operadores: config.operadores ?? [],
      direccion: config.direccion ?? "",
      municipio: config.municipio ?? "",
      localidad: config.localidad ?? "",
      telefonoFijo: config.telefonoFijo ?? "",
      telefonoMovil: config.telefonoMovil ?? "",
      nit: config.nit ?? "",
      email: config.email ?? "",
      salvavidas: config.salvavidas ?? [],
    });
  }

  const zona = defaultZonaHumeda(
    config?.zonaHumedaId || crypto.randomUUID(),
    config?.zonaHumedaNombre || "Zona humeda principal",
  );
  const instalacion = defaultInstalacion(zona.id, instalacionId, config?.nombreEstanque || "Estanque principal");
  if (config) {
    instalacion.tipoEstructura = config.tipoEstructura ?? "IA";
    instalacion.categoria = config.categoria ?? null;
    instalacion.presentacion = config.presentacionCubierta ? "cubierta" : "descubierta";
    instalacion.usoColectiva = config.usoColectiva ?? false;
    instalacion.usoPublico = config.usoPublico ?? false;
    instalacion.usoParticular = config.usoParticular ?? false;
    instalacion.largo = config.largo ?? null;
    instalacion.ancho = config.ancho ?? null;
    instalacion.diametro = config.diametro ?? null;
    instalacion.profundidad = config.profundidad ?? null;
    instalacion.volumen = config.volumen ?? null;
    instalacion.areaSuperficial = config.areaSuperficial ?? null;
    instalacion.maximoBanistas = config.maximoBanistas ?? null;
    instalacion.fuenteAguaPotable = config.fuenteAguaPotable ?? true;
    instalacion.fuenteAguaNatural = config.fuenteAguaNatural ?? false;
    instalacion.sistemaRecirculacion = config.sistemaRecirculacion ?? true;
    instalacion.sistemaRenovacionContinua = config.sistemaRenovacionContinua ?? false;
    instalacion.sistemaDesalojo = config.sistemaDesalojo ?? false;
    instalacion.sistemaRestringido = config.sistemaRestringido ?? false;
    instalacion.sistemaEspecial = config.sistemaEspecial ?? false;
  }

  return { establecimiento, zona, instalacion };
}

export function agregarInstalacion(
  data: AppData,
  opts?: { nombre?: string; zonaHumedaId?: string; tipoEstructura?: Instalacion["tipoEstructura"] },
): AppData {
  const zonaId = opts?.zonaHumedaId || data.zonasHumedas[0]?.id;
  const zona =
    data.zonasHumedas.find((z) => z.id === zonaId) ??
    defaultZonaHumeda(crypto.randomUUID(), "Zona humeda");
  const zonas = data.zonasHumedas.some((z) => z.id === zona.id)
    ? data.zonasHumedas
    : [...data.zonasHumedas, zona];
  const nueva = defaultInstalacion(
    zona.id,
    crypto.randomUUID(),
    opts?.nombre || `Instalacion ${data.instalaciones.length + 1}`,
  );
  if (opts?.tipoEstructura) nueva.tipoEstructura = opts.tipoEstructura;

  const next: AppData = {
    ...data,
    zonasHumedas: zonas,
    instalaciones: [...data.instalaciones, nueva],
    instalacionActivaId: nueva.id,
    instalacionId: nueva.id,
  };
  next.configuracion = refreshConfiguracion(next);
  return next;
}

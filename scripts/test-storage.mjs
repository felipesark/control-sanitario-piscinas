import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import { test, beforeEach } from "node:test";

// Node strips TypeScript types; resolve the extensionless imports used by Next.js.
registerHooks({
  resolve(specifier, context, nextResolve) {
    try {
      return nextResolve(specifier, context);
    } catch (error) {
      if (error.code === "ERR_MODULE_NOT_FOUND" && specifier.startsWith(".")) {
        return nextResolve(`${specifier}.ts`, context);
      }
      throw error;
    }
  },
});

const values = new Map();
globalThis.window = new EventTarget();
Object.defineProperty(globalThis, "localStorage", {
  configurable: true,
  value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
  },
});

const { getAppData, getOrCreateRegistro, getRegistroPorFecha, saveRegistro, STORAGE_KEY, APP_DATA_EVENT } =
  await import("../src/lib/storage.ts");

beforeEach(() => values.clear());

test("first use preserves the form identity across automatic refreshes", () => {
  const first = getAppData();
  for (let i = 0; i < 4; i++) {
    const refreshed = getAppData();
    assert.equal(refreshed.instalacionActivaId, first.instalacionActivaId);
    assert.equal(refreshed.instalaciones[0].zonaHumedaId, first.instalaciones[0].zonaHumedaId);
    assert.equal(refreshed.establecimiento.id, first.establecimiento.id);
  }
  assert.deepEqual(getAppData().registros, []);
});

test("saving the first record retains its installation and physical observations", () => {
  const initial = getAppData();
  const record = getOrCreateRegistro("2026-09-29", initial.instalacionActivaId);
  record.calidadFisica.color = "aceptable";
  record.calidadFisica.olor = "no_aceptable";
  saveRegistro(record);
  const reloaded = getAppData();
  assert.equal(reloaded.instalacionActivaId, record.instalacionId);
  assert.equal(reloaded.registros.length, 1);
  assert.deepEqual(getRegistroPorFecha(record.fecha)?.calidadFisica, record.calidadFisica);
});

test("legacy data is migrated once without changing identity or observations", () => {
  const initial = getAppData();
  const record = getOrCreateRegistro("2026-09-29", initial.instalacionActivaId);
  record.calidadFisica.transparencia = "no_aceptable";
  const { zonaHumedaId, ...legacyConfig } = initial.configuracion;
  assert.ok(zonaHumedaId);
  values.set(STORAGE_KEY, JSON.stringify({
    instalacionId: initial.instalacionActivaId,
    configuracion: legacyConfig,
    registros: [record],
  }));
  const migrated = getAppData();
  assert.deepEqual(getAppData(), migrated);
  assert.equal(migrated.instalacionActivaId, record.instalacionId);
  assert.equal(migrated.registros[0].calidadFisica.transparencia, "no_aceptable");
});

test("reading data does not trigger recursive refresh notifications or alter saved data", () => {
  let notifications = 0;
  const listener = () => notifications++;
  window.addEventListener(APP_DATA_EVENT, listener);
  try {
    const initial = getAppData();
    const stored = values.get(STORAGE_KEY);
    assert.ok(stored);
    assert.deepEqual(getAppData(), initial);
    assert.equal(values.get(STORAGE_KEY), stored);
    assert.equal(notifications, 0);
  } finally {
    window.removeEventListener(APP_DATA_EVENT, listener);
  }
});

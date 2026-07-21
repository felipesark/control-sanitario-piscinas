"use client";

import { useEffect, useState } from "react";
import type { AppData } from "@/lib/types";
import { APP_DATA_EVENT, STORAGE_KEY, getAppData } from "@/lib/storage";

/** Carga AppData y se actualiza en vivo ante guardados, sync u otros tabs. */
export function useAppData() {
  const [data, setData] = useState<AppData | null>(null);

  useEffect(() => {
    const refresh = () => setData(getAppData());
    refresh();

    const onCustom = () => refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === null) refresh();
    };
    const onFocus = () => refresh();
    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };

    window.addEventListener(APP_DATA_EVENT, onCustom);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibility);

    const interval = window.setInterval(refresh, 4000);

    return () => {
      window.removeEventListener(APP_DATA_EVENT, onCustom);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(interval);
    };
  }, []);

  const refresh = () => setData(getAppData());

  return { data, refresh, ready: data !== null };
}

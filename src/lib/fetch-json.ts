export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(url, init);
    const text = await response.text();
    if (!text.trim()) {
      console.warn(`fetchJson: respuesta vacia (${response.status}) ${url}`);
      return null;
    }
    const data = JSON.parse(text) as T;
    if (!response.ok) {
      console.warn(`fetchJson: HTTP ${response.status} ${url}`);
      return null;
    }
    return data;
  } catch (error) {
    console.warn("fetchJson:", url, error);
    return null;
  }
}

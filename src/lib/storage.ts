const KEY = 'surgi-weather:v1';

export function load<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${KEY}:${name}`);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(name: string, value: unknown): void {
  try {
    localStorage.setItem(`${KEY}:${name}`, JSON.stringify(value));
  } catch {
    /* storage is full or disabled: the app keeps working without persistence */
  }
}

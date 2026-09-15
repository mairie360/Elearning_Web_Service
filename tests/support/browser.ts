// `window` minimal pour le code client exécuté sous Node : localStorage en mémoire et rechargements comptés.

export class MemoryStorage {
  private readonly values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) ?? null; }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
  removeItem(key: string) { this.values.delete(key); }
  clear() { this.values.clear(); }
  get length() { return this.values.size; }
}

export type FakeWindow = { localStorage: MemoryStorage; location: { reload: () => void; reloads: number } };

export function installWindow(): FakeWindow {
  const location = { reloads: 0, reload() { location.reloads += 1; } };
  const fake: FakeWindow = { localStorage: new MemoryStorage(), location };
  (globalThis as { window?: unknown }).window = fake;
  return fake;
}

export function removeWindow(): void {
  delete (globalThis as { window?: unknown }).window;
}
